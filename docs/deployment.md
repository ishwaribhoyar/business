# Deployment Architecture & Operations Runbook

**Product:** Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP  

---

## 1. Data Ownership & Governance

In strict accordance with PRD Section 18 and BRD Section 15:

> **CRITICAL REQUIREMENT:**  
> All production accounts, domains, hosting subscriptions, source-code repositories, databases, and business communication channels **MUST be owned and controlled directly by the business owner**, never by external individual developer accounts.

Checklist for Business Ownership:
- [ ] Domain Registrar Account (`.in` / `.com` under company email)
- [ ] Production Server / Cloud Hosting Account (AWS / DigitalOcean / Hetzner / VPS)
- [ ] Production Git Repository (Company GitHub / GitLab organization)
- [ ] Business Email & Google Workspace / Zoho Mail (`support@domain.in`)
- [ ] WhatsApp Business Registered Phone Line (`+91 ...`)

---

## 2. Infrastructure Topology

```
[ Internet Traffic ]
        │
        ▼ (Port 443 / HTTPS)
[ Reverse Proxy / SSL Termination ] (Nginx / Caddy / Cloudflare)
        │
        ├───────────────────────────────────┐
        ▼ (Port 3000)                       ▼ (Port 5000)
[ Static Frontend Assets ]             [ Backend API Process ]
(Nginx static server / SPA)           (Node.js / PM2 / Express)
                                            │
                                            ▼
                                  [ Relational Database ]
                               (SQLite WAL or PostgreSQL)
```

---

## 3. Production Environment Checklist

1. **HTTPS Enforcement:**
   - A valid SSL/TLS certificate (Let's Encrypt / Cloudflare) must be provisioned.
   - HTTP must redirect permanently (301) to HTTPS.
   - HSTS header enabled via Helmet (`Strict-Transport-Security`).

2. **Environment Variables:**
   - Set `NODE_ENV=production`.
   - Set `JWT_SECRET` to a cryptographically strong random string (minimum 64 characters):
     `openssl rand -base64 48`
   - Set `CLIENT_URL` to production domain (e.g. `https://nagpurmaterials.in`).
   - Configure company WhatsApp Business number (`BUSINESS_WHATSAPP`).

3. **Database Setup:**
   - Run migrations before starting application: `npm run migrate`.
   - In production, SQLite WAL mode ensures concurrent readers and writers with minimal lock contention.
   - For high-volume multi-instance deployments, switch `DATABASE_URL` to PostgreSQL.

4. **Process Supervision (PM2 Example):**
   ```bash
   npm run build
   pm2 start backend/dist/server.js --name "nagpur-marketplace-api" -i max
   pm2 save
   pm2 startup
   ```

5. **Static Frontend Hosting:**
   - Host `frontend/dist/` behind Nginx with fallback to `index.html` for client-side routing:
     ```nginx
     location / {
       root /var/www/nagpur-materials/frontend/dist;
       try_files $uri $uri/ /index.html;
     }
     location /api/ {
       proxy_pass http://localhost:5000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
     }
     ```
