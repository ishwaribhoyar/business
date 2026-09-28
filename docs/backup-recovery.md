# Production PostgreSQL Backup & Disaster Recovery Runbook

**Product:** Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP  
**Phase:** Phase 4 — PostgreSQL Migration, Multi-User Production Architecture & Render Deployment Readiness  
**Target Engine:** Render Managed PostgreSQL 16

---

## 1. Backup Strategy Overview

On Render, the managed PostgreSQL database (`marketplace_db`) provides automated daily backups and point-in-time recovery (PITR). In addition, logical database dumps (`pg_dump`) provide off-site archive redundancy.

```
┌────────────────────────────────┐
│ Render Managed PostgreSQL 16   │
└───────────────┬────────────────┘
                │
                ├─────────────────────────────────────────┐
                ▼ (Continuous WAL Archiving)              ▼ (Daily Automated Snapshot)
┌────────────────────────────────┐        ┌────────────────────────────────┐
│ Point-In-Time Recovery (PITR)  │        │ Render Automated Daily Backups │
│ Granular rollback to any minute│        │ 7-day rolling retention        │
└────────────────────────────────┘        └────────────────────────────────┘
                │
                ▼ (On-Demand / Pre-Deploy)
┌─────────────────────────────────────────────────────────┐
│ Logical Offsite Backup (pg_dump)                        │
│ Format: Custom compressed archive (.dump)               │
│ Storage: Company Encrypted S3 / Cloudflare R2           │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Backup Types & Retention Schedules

| Backup Type | Mechanism | Schedule | Retention | Storage |
|---|---|---|---|---|
| **Render Automated Snapshots** | Native Render backup engine | Daily (automated) | 7 to 30 days (by plan) | Render Internal Storage |
| **Point-In-Time Recovery** | WAL Continuous Archiving | Continuous | Up to 7 days | Render Internal |
| **Logical Dump (`pg_dump`)** | Scheduled CLI / GitHub Action | Weekly / Pre-deploy | 90 days | Encrypted Cloud Storage |
| **Pre-Migration Snapshot** | Manual trigger before migrations | On-demand | 14 days | Local + Cloud |

---

## 3. Logical Backup Procedure (`pg_dump`)

To create a complete, consistent logical backup of the PostgreSQL database:

### Command:
```bash
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="marketplace_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### Text SQL Format (for inspection):
```bash
pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --file="marketplace_backup_$(date +%Y%m%d_%H%M%S).sql"
```

---

## 4. Disaster Recovery & Database Restoration

### Scenario A: Rollback using Render Point-In-Time Recovery (PITR)
1. Open **Render Dashboard** $\to$ Select **PostgreSQL: nagpur-marketplace-postgres**.
2. Select **Backups** tab.
3. Choose **Point-in-Time Recovery**.
4. Specify target timestamp (prior to the incident).
5. Render provisions a restored database instance with the exact data at that minute.
6. Update `DATABASE_URL` in the Backend Web Service to point to the restored database.

### Scenario B: Restoring from a Logical `pg_dump` File
To restore into a fresh database instance:

1. **Verify target database is reachable:**
   ```bash
   psql "$DATABASE_URL" -c "SELECT 1;"
   ```
2. **Restore tables, constraints, indexes, and data:**
   ```bash
   pg_restore --clean --if-exists --no-owner --no-privileges -d "$DATABASE_URL" marketplace_backup_YYYYMMDD_HHMMSS.dump
   ```
3. **Verify Data Integrity:**
   ```bash
   # Count key entities
   psql "$DATABASE_URL" -c "SELECT count(*) FROM orders;"
   psql "$DATABASE_URL" -c "SELECT count(*) FROM quotations;"
   psql "$DATABASE_URL" -c "SELECT count(*) FROM payments;"
   psql "$DATABASE_URL" -c "SELECT count(*) FROM admin_users;"
   ```
4. **Verify Application Readiness:**
   ```bash
   curl -s https://<backend-url>/ready
   # Expected output: {"success":true,"data":{"status":"READY","database":"CONNECTED","engine":"POSTGRESQL"}}
   ```

---

## 5. Recovery Objectives (RTO & RPO)

- **Recovery Time Objective (RTO):** $< 30$ minutes to restore service from automated snapshot or PITR.
- **Recovery Point Objective (RPO):** $< 5$ minutes with WAL archiving; $< 24$ hours for daily snapshots.
- **Drill Cadence:** Disaster recovery restoration drills must be performed quarterly in a staging environment.
