# REST API Documentation & Conventions

**Base URL:** `/api/v1`  
**Current Release:** Phase 0 Baseline  
**Encoding:** `application/json; charset=utf-8`  

---

## 1. API Design Conventions

All API responses follow a strict, consistent JSON envelope:

### Success Response Envelope:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-24T14:49:57.061Z",
    "total": 100,
    "limit": 50,
    "page": 1
  }
}
```

### Error Response Envelope:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "mobile_number",
        "message": "Please provide a valid 10-digit mobile number"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-09-24T14:49:57.385Z"
  }
}
```

### Standard HTTP Status Codes:
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created (e.g., new quote request).
- `400 Bad Request`: Validation failure or malformed payload.
- `401 Unauthorized`: Missing, invalid, or expired JWT token.
- `403 Forbidden`: Insufficient role permissions (e.g. non-Super Admin accessing system controls).
- `404 Not Found`: Target resource or route does not exist.
- `409 Conflict`: Unique constraint violation (e.g. duplicate email).
- `422 Unprocessable Entity`: Business rule failure (e.g. invalid order transition).
- `500 Internal Server Error`: Unexpected server exception.
- `503 Service Unavailable`: Upstream dependency unavailable (e.g. database failure in readiness check).

---

## 2. Health & Readiness Endpoints

### `GET /health`
Verifies that the application process is running and responsive.
- **Access:** Public
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "UP",
    "service": "nagpur-materials-marketplace-api",
    "timestamp": "2026-09-24T14:49:56.000Z",
    "uptime": 124.5
  },
  "meta": { "timestamp": "2026-09-24T14:49:56.000Z" }
}
```

### `GET /health/readiness`
Deep health check verifying relational database connectivity.
- **Access:** Public (Internal / Container Orchestrators)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "READY",
    "database": "CONNECTED",
    "timestamp": "2026-09-24T14:49:56.000Z"
  }
}
```

---

## 3. Authentication Endpoints

### `POST /api/v1/auth/login`
Authenticates operations personnel using email and password.
- **Access:** Public
- **Request Body:**
```json
{
  "email": "admin@nagpurmaterials.local",
  "password": "AdminSecurePass123!"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_admin_initial",
      "email": "admin@nagpurmaterials.local",
      "full_name": "Operations Admin",
      "role": "SUPER_ADMIN",
      "is_active": 1,
      "created_at": "2026-09-24T14:45:28.081Z",
      "updated_at": "2026-09-24T14:45:28.081Z"
    }
  }
}
```

### `GET /api/v1/auth/me`
Retrieves the authenticated user's current session profile.
- **Access:** Authenticated (`Bearer <token>`)
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):** Returns safe user profile.

---

## 4. Product Endpoints

### `GET /api/v1/products`
Retrieves the 4 authoritative MVP materials.
- **Access:** Public
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_sand_01",
      "name": "Sand",
      "slug": "sand",
      "category": "Bulk Aggregate",
      "description": "Clean, quality construction sand...",
      "unit": "Brass",
      "min_quantity": 1,
      "is_active": 1,
      "display_order": 1
    },
    { "id": "prod_bricks_02", "name": "Bricks", ... },
    { "id": "prod_stone_03", "name": "Black Stone / Aggregate", ... },
    { "id": "prod_murum_04", "name": "Murum", ... }
  ]
}
```

### `GET /api/v1/products/:slug`
Retrieves material details by URL slug.
- **Access:** Public

---

## 5. Order & Quote Request Endpoints

### `POST /api/v1/orders/quote-request`
Public quote request submission (no customer account required).
- **Access:** Public
- **Request Body:**
```json
{
  "material_id": "prod_sand_01",
  "quantity": 2,
  "unit": "Brass",
  "delivery_address": "Plot 45, Manish Nagar, Wardha Road",
  "area_pincode": "440015",
  "preferred_delivery_date": "2026-10-01",
  "customer_name": "Rajesh Sharma",
  "mobile_number": "9876543210",
  "whatsapp_number": "9876543210",
  "additional_notes": "Morning delivery requested",
  "map_pin_url": "https://maps.app.goo.gl/example",
  "qr_campaign_code": "TRUCK_01"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "orderId": "ord_1790261397397_xxvgo",
    "orderReference": "NGP-260924-3914",
    "status": "NEW",
    "message": "Your quote request has been received. Our operations team will contact you shortly with the delivered price.",
    "whatsappDirectUrl": "https://wa.me/919876543210?text=Hi%2C%20I%20just%20submitted%20a%20quote%20request..."
  }
}
```

### `GET /api/v1/orders`
Retrieves list of orders with status filtering and pagination.
- **Access:** Authenticated Admin (`ADMIN`, `SUPER_ADMIN`)
- **Query Params:** `status` (optional), `limit`, `offset`

### `GET /api/v1/orders/:id`
Retrieves full order detail, customer info, material info, and historical status trail.
- **Access:** Authenticated Admin (`ADMIN`, `SUPER_ADMIN`)

---

## 6. Admin Endpoints

### `GET /api/v1/admin/dashboard/summary`
Retrieves high-level operations pipeline metrics.
- **Access:** Authenticated Admin (`ADMIN`, `SUPER_ADMIN`)

### `GET /api/v1/admin/settings`
Retrieves platform runtime configuration and guardrails.
- **Access:** Authenticated Super Admin (`SUPER_ADMIN`)

---

## 7. Future Endpoint Conventions (Planned for Phase 1+)
- `POST /api/v1/quotations` — Create and freeze snapshot quotation
- `PATCH /api/v1/orders/:id/status` — Transition order lifecycle state
- `POST /api/v1/suppliers` — Register verified quarry/kiln partner
- `POST /api/v1/trucks` — Register third-party vehicle partner
- `POST /api/v1/payments` — Record payment transaction
