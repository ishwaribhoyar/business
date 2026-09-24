# Security Architecture & Safeguards

**Product:** Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP  

---

## 1. Security Principles

The security model is designed in strict compliance with PRD Section 17 & 18:

1. **Defense in Depth:** Validation, authentication, role authorization, and database layer parameterization.
2. **Customer Data Privacy:** Phone numbers and site delivery addresses must not be exposed to unauthorized parties or indexed publicly.
3. **Immutable Audit Trail:** Sensitive admin actions are logged with timestamp, user ID, and IP address.
4. **Zero Hardcoded Secrets:** All credentials, keys, and tokens are read exclusively from environment variables.

---

## 2. Authentication & Credential Security

- **Bcrypt Hashing:** Passwords hashed with 10 salt rounds. Plaintext passwords never stored or cached.
- **JWT Protection:** JWT tokens signed with HS256 algorithm and validated on every protected route.
- **Credential Stripping:** Serializers explicitly omit `password_hash` from all API responses.
- **Initial Seed Security:** Production configurations generate unique administrator credentials; default development credentials must never be deployed.

---

## 3. SQL Injection & Injection Prevention

- **Parameterized Queries:** All SQL queries in the repository layer use parameterized statements (`?` placeholders via `node:sqlite`'s prepared statements).
- **No String Concatenation:** User input is never concatenated directly into SQL statements.
- **Zod Schema Parsing:** Strict validation strips unknown fields and validates types, formats, lengths, and regex patterns before requests reach the service layer.

---

## 4. HTTP Headers & Transport Security

- **Helmet:** Implements modern security headers:
  - `Content-Security-Policy`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN` (prevents clickjacking)
  - `Strict-Transport-Security` (forces HTTPS)
- **CORS:** Restricted strictly to configured frontend origin (`CLIENT_URL`).
- **Body Size Limits:** JSON payload size capped at 1MB to prevent Denial of Service (DoS) memory exhaustion.

---

## 5. Customer Privacy & Log Sanitization

- **Structured Logger Redaction:** `Logger` automatically detects and redacts sensitive keys:
  `password`, `password_hash`, `token`, `jwt`, `secret`, `authorization`, `cookie`, `api_key`.
- **Public Endpoints:** Public quote submission receives customer request data but **never** provides query endpoints for unauthenticated users to inspect other customers' contact details.
- **Access Control:** Order and customer lists are strictly restricted to authenticated staff with `ADMIN` or `SUPER_ADMIN` roles.

---

## 6. Audit Logging

Every critical business action is recorded in the `audit_logs` table:
- Customer submits quote request
- Admin updates quotation
- Admin assigns supplier
- Admin assigns truck/driver
- Admin updates order status
- Admin records payment status
