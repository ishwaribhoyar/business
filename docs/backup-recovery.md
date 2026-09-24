# Backup & Disaster Recovery Runbook

**Product:** Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP  

---

## 1. Backup Scope

The following assets must be protected and backed up regularly:

1. **Relational Database:** The active SQLite database file (`backend/data/marketplace.sqlite`) containing all customers, orders, quotations, audit logs, and partner records.
2. **Environment Configuration:** The production `.env` configuration file (stored in a separate encrypted vault like Bitwarden or AWS Secrets Manager; never in plaintext).
3. **Application Source Code:** Git repository hosted on company-controlled GitHub/GitLab.

---

## 2. Backup Frequency & Retention

| Asset | Frequency | Storage Location | Retention Window |
| :--- | :--- | :--- | :--- |
| **Database Snapshot** | Daily at 02:00 IST | Encrypted cloud object storage (S3 / R2 / Wasabi) | 30 Daily, 12 Monthly |
| **Before Migrations** | On-demand before schema upgrade | Local backup folder + Cloud storage | 7 days |
| **Config Secrets** | On modification | Encrypted password manager / Secrets Vault | Versioned |

---

## 3. SQLite Online Backup Procedure

Because SQLite is in WAL (Write-Ahead Logging) mode, a live hot backup can be performed safely using the official SQLite `.backup` command or via Python / Node script without taking the application offline:

### Hot Backup Script (`scripts/backup.ps1` or shell):
```bash
# Example online backup command using sqlite3 CLI
sqlite3 backend/data/marketplace.sqlite ".backup 'backups/marketplace_$(date +%Y%m%d_%H%M%S).sqlite'"
```

### Automated Node.js / Python Snapshot:
A daily cron task copies the database file with WAL checkpoints flushed:
```javascript
// Flush WAL pages to main database file
db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
// Safe atomic copy to backup destination
```

---

## 4. Disaster Recovery Procedure (Step-by-Step)

If the production server fails or database corruption occurs:

1. **Provision New Host:** Set up Ubuntu/Debian server with Node.js 22/24 and Git.
2. **Clone Repository:**
   ```bash
   git clone <company-repo-url> /var/www/nagpur-materials
   cd /var/www/nagpur-materials
   ```
3. **Restore Environment Variables:**
   Retrieve production `.env` from secure vault and place it in root directory.
4. **Restore Database:**
   Download the latest verified backup from secure cloud storage:
   ```bash
   cp /path/to/backup/marketplace_20260924.sqlite backend/data/marketplace.sqlite
   ```
5. **Verify Database Integrity:**
   ```bash
   sqlite3 backend/data/marketplace.sqlite "PRAGMA integrity_check;"
   # Output must be: "ok"
   ```
6. **Execute Migrations (if any pending):**
   ```bash
   npm run migrate
   ```
7. **Start Application:**
   ```bash
   npm run build
   pm2 start backend/dist/server.js --name "nagpur-marketplace-api"
   ```
8. **Verify Service Health:**
   ```bash
   curl -s http://localhost:5000/health/readiness
   # Expected response: {"success":true,"data":{"status":"READY","database":"CONNECTED"}}
   ```

---

## 5. Recovery Verification Testing

Disaster recovery drills should be executed quarterly to verify:
- Backups are decryptable and uncorrupted.
- System can be fully restored within 30 minutes (RTO < 30 mins, RPO < 24 hours).
