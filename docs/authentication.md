# Authentication & Authorization Architecture

**Product:** Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP  
**Version:** Phase 0 Baseline  

---

## 1. Authentication Strategy

The platform enforces strict boundaries in accordance with PRD Section 3:

| Actor | Authentication Mechanism in MVP | Access Privileges |
| :--- | :--- | :--- |
| **Customer** | **No Login Required** | Can view materials, request quotes, track by reference ID, and connect via WhatsApp. |
| **Supplier** | **No Login Required** | Managed manually by platform operations desk. |
| **Truck / Driver** | **No Login Required** | Managed manually by platform operations desk. |
| **Operations Staff** | **Email + Password (Bcrypt + JWT)** | Manages orders, customers, quotations, statuses, suppliers, trucks, and payments. |
| **Super Admin** | **Email + Password (Bcrypt + JWT)** | Full operations permissions plus user management, platform settings, and product configurations. |

---

## 2. Password Hashing & Cryptography

- **Algorithm:** Bcrypt with 10 salt rounds (`bcryptjs`).
- **Storage:** Passwords are never stored in plaintext. Hashes are stored in `admin_users.password_hash`.
- **Response Sanitization:** The repository and service layers strip `password_hash` from user objects before serialization.
- **Timing Safe:** Bcrypt compares hashes in constant time to prevent side-channel timing attacks.

---

## 3. JWT Token Architecture

- **Format:** JSON Web Token (JWT) signed with HMAC-SHA256 (`HS256`).
- **Payload Contents:**
  ```json
  {
    "userId": "usr_admin_initial",
    "email": "admin@nagpurmaterials.local",
    "role": "SUPER_ADMIN",
    "iat": 1727192996,
    "exp": 1727797796
  }
  ```
- **Transmission:** Clients transmit the token via standard HTTP header:
  `Authorization: Bearer <token>`
- **Token Expiry:** Configurable via `JWT_EXPIRES_IN` (defaults to 7 days for active operational personnel).

---

## 4. Middleware & Route Protection

Two primary middlewares guard internal endpoints:

### 1. `authenticate` Middleware (`backend/src/middlewares/auth.ts`)
1. Checks for `Authorization: Bearer <token>` header.
2. Verifies cryptographic signature against `JWT_SECRET`.
3. Verifies token is not expired.
4. Queries database to ensure user account exists and `is_active = 1`.
5. Attaches the safe user object to Express request (`req.user`).
6. Rejects with `401 Unauthorized` if invalid or missing.

### 2. `authorize(...allowedRoles)` Middleware
1. Runs after `authenticate`.
2. Inspects `req.user.role`.
3. If user's role is not within `allowedRoles`, rejects with `403 Forbidden`.

Example Usage:
```typescript
// Accessible to both Admin and Super Admin
router.get('/orders', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), OrderController.getOrders);

// Accessible ONLY to Super Admin
router.get('/settings', authenticate, authorize('SUPER_ADMIN'), AdminController.getSystemSettings);
```

---

## 5. Development Seed Strategy

- Initial admin credentials can be seeded via `npm run seed`.
- Default development credentials:
  - **Email:** `admin@nagpurmaterials.local`
  - **Password:** `AdminSecurePass123!`
  - **Role:** `SUPER_ADMIN`
- These are configurable in `.env` via `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`.
- In staging and production, real credentials must be generated uniquely and injected via environment secret managers.
