# 📌 **MASTER PROMPT — Multi-Tenant Static-Site Hosting Platform (Cloudflare + TanStack Start)**

You are building a complete, production-ready multi-tenant static-site hosting platform.
This prompt contains the **full specification**. Follow it exactly.

---

# 1. **Purpose of the Application**

Build a SaaS platform where:

1. **Users sign in via WorkOS**.
2. **Users can create organizations (“tenants”)**.
3. Each tenant gets a **subdomain** like:
   `https://<slug>.myapp.com`
4. Each tenant can:

   * Upload a ZIP of static HTML/CSS/JS files
     **OR**
   * Connect a private GitHub repo (you pull its static build)
   * The static files are stored in **R2** under `tenants/<tenantId>/...`
5. When a visitor goes to `https://<tenant>.myapp.com`:

   * An **edge worker** resolves the tenant from the hostname (via KV)
   * Checks whether the tenant requires auth
   * Optionally verifies WorkOS session (for private sites)
   * Fetches the requested static file from **R2**
   * Injects a small overlay UI (HTMLRewriter) for logged-in users
   * Returns the static HTML
6. Admin users can:

   * Manage domains
   * Manage membership (invite/remove users)
   * Configure auth mode (public vs WorkOS/SSO-only)
   * Upload/sync site content
   * Trigger redeploy (publish to KV)
7. Viewer users:

   * Can see the tenant in the dashboard
   * Can see the static site if the tenant auth rules allow it
   * Cannot modify tenant settings or content

The app has a **marketing site**, **management dashboard**, and a **control-plane API**.

---

# 2. **Tech Stack**

### **Frontend / App**

* **TanStack Start v1 RC**
* **React**
* **TanStack Router**
* **TanStack Query**
* **TailwindCSS**
* **Radix UI** for unstyled accessible components

### **Backend / Infra**

* **Cloudflare Workers** for app + control plane
* **Cloudflare KV** for tenant-config distribution (fast edge reads)
* **Cloudflare R2** for static site storage
* **Cloudflare D1** (SQLite) as system-of-record database
* **Cloudflare Pages or Worker deploy** for the Start app
* **WorkOS** for authentication + SSO
* **A separate Edge Worker** (not Start) to serve static tenant sites from R2

---

# 3. **Database Schema (D1)**

### **users**

```
id TEXT PRIMARY KEY
workos_user_id TEXT UNIQUE
email TEXT NOT NULL
name TEXT
created_at TEXT NOT NULL
```

### **tenants**

```
id TEXT PRIMARY KEY
slug TEXT UNIQUE NOT NULL      -- forms <slug>.myapp.com
name TEXT NOT NULL
r2_prefix TEXT NOT NULL        -- "tenants/<id>/"
auth_mode TEXT NOT NULL        -- "public" | "workos"
workos_org_id TEXT             -- optional
version INTEGER NOT NULL DEFAULT 1
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

### **tenant_domains**

```
id TEXT PRIMARY KEY
tenant_id TEXT REFERENCES tenants(id)
domain TEXT UNIQUE NOT NULL    -- includes slug.myapp.com and custom domains
```

### **tenant_memberships**

```
id TEXT PRIMARY KEY
tenant_id TEXT REFERENCES tenants(id)
user_id TEXT REFERENCES users(id)
role TEXT NOT NULL             -- "admin" | "viewer"
status TEXT NOT NULL DEFAULT "active"
created_at TEXT NOT NULL
UNIQUE (tenant_id, user_id)
```

---

# 4. **Published Tenant Config (KV Records)**

For fast lookup at the edge:

* Key: `tenant:id:<id>`
* Key: `tenant:host:<domain>`
  Where `<domain>` is each of:

  * `<slug>.myapp.com`
  * Any custom domain

Value (JSON):

```json
{
  "id": "t1",
  "slug": "acme",
  "domains": ["acme.myapp.com"],
  "r2_prefix": "tenants/t1/",
  "auth": {
    "mode": "workos",
    "workos_connection_id": "conn_123"
  },
  "ui": { "inject_user_panel": true },
  "version": 7,
  "updated_at": "2025-01-01T12:00:00Z"
}
```

---

# 5. **Multi-Tenant Authorization Model**

* Users authenticate via WorkOS.
* After WorkOS callback, backend:

  * upserts into `users`
  * sets session cookie / JWT
* For every **tenant-specific CP API route**, check:

  * membership exists → allow read
  * membership role = `admin` → allow writes
* For the **edge static site**:

  * if tenant.auth_mode = public → no session required
  * if tenant.auth_mode = workos → edge calls CP `/api/auth/authorize-site?tenantId=...`
    OR decodes JWT to check membership quickly

---

# 6. **Two Workers: App Worker & Edge Worker**

## **A. App Worker (TanStack Start)**

Handles:

* Marketing pages (`/`, `/pricing`, `/docs`)
* Login + WorkOS callbacks
* Dashboard at `/app/...`
* Control-plane API under `/api/...`
* Reads/writes D1, R2, KV

## **B. Edge Worker**

Handles:

* Requests to `https://*.myapp.com/*`
* Steps:

  1. Parse host
  2. Lookup in KV (`tenant:host:<host>`)
  3. If miss → call CP `/api/tenants/by-host?host=...`
  4. Enforce tenant auth_mode
  5. Fetch static file from R2 (`<r2_prefix>/<path>`)
  6. If HTML → inject overlay using HTMLRewriter
  7. Return file

Bucket is **private**; only Worker can read from R2.

---

# 7. **Content Model**

### Upload flow:

* Admin uploads ZIP to `/api/tenants/:id/content/upload`
* Worker unpacks, writes to R2 under `tenants/<id>/...`
* Optionally bumps tenant version & republishes to KV

### GitHub sync flow:

* Admin sets repo + branch
* CP fetches repo contents, builds if necessary, writes to R2
* Publish to KV

---

# 8. **TanStack Start Route Tree**

### Public routes

```
/
 /pricing
 /docs
 /login
 /auth/callback
```

### App routes (protected)

```
/app
    /app/tenants
    /app/tenants/:tenantId
        /app/tenants/:tenantId
        /app/tenants/:tenantId/domains
        /app/tenants/:tenantId/auth
        /app/tenants/:tenantId/content
        /app/tenants/:tenantId/deploys
        /app/tenants/:tenantId/members
    /app/account
```

### API routes

```
/api/me
/api/tenants                  (GET, POST)
/api/tenants/:tenantId        (GET, PATCH, DELETE)
/api/tenants/:tenantId/publish
/api/tenants/:tenantId/domains
/api/tenants/:tenantId/memberships
/api/tenants/by-host          (edge fallback)
```

---

# 9. **Server Functions / Loaders / Actions**

### Examples

* `/login` → server function: create WorkOS auth URL → redirect.
* `/auth/callback` → server function: exchange code, create user, set session cookie, redirect.
* `/app/_layout` loader:
  loads current user + all memberships for the tenant switcher.
* `/app/tenants/:tenantId/_layout` loader:
  loads tenant + role; if viewer but trying admin action → 403.

---

# 10. **Control Plane Publish Logic**

Whenever a tenant is updated:

1. Query full tenant config + domains from D1.
2. Build the compact JSON payload.
3. Write to KV:

   * `tenant:id:<id>`
   * `tenant:host:<domain>` for every domain

Edge worker reads this instantly on next request.

---

# 11. **Session + Auth Implementation**

* Use secure, HTTP-only cookie for session.
* Store:

  ```
  user_id
  email
  memberships? (optional optimization)
  ```
* For CP API calls: decode cookie → determine user.
* For edge worker:

  * either decode JWT locally
  * or call `/api/auth/authorize-site?tenantId=X` (fast path)

---

# 12. **UI Technology**

* **Tailwind** for styling
* **Radix UI** for accessible primitives:

  * Dialog, DropdownMenu, Popover, Switch, etc.
* **TanStack Query** for client-side fetching where needed
* **TanStack Router** (via Start) for nested layouts + validation

---

# 13. **Deliverables Expected From the LLM**

The LLM should generate or outline:

### **App Worker (Start)**:

* Routing structure
* Loaders / actions
* Server-only helpers for D1/R2/KV
* WorkOS login + callback flow
* Session management
* Tenant CRUD
* Membership CRUD
* Domain CRUD
* Content upload + GitHub sync
* Publish-to-KV utility
* `/api/tenants/by-host` implementation

### **Edge Worker**:

* Host parsing
* KV lookup
* API fallback
* R2 fetch
* HTMLRewriter injection
* Auth gating logic

### **Database layer**:

* D1 migrations
* Query helpers (getTenant, getMembership, etc.)

### **Front-end**:

* Marketing pages (SSR)
* Dashboard layout with tenant switcher
* Tenant detail pages:

  * overview
  * domains
  * auth config
  * content panel
  * deploy history UI
  * membership management
* Form components (using Radix)
* API integration via Start’s built-in server functions

### **Configs**:

* Cloudflare `wrangler.toml` for:

  * Start app worker
  * edge worker
  * R2 bindings
  * KV bindings
  * D1 DB binding
* Tailwind config

---

# 14. **Final Instruction to the LLM**

Using the full specification above, build the entire application (or complete it step-by-step if requested).
Follow all architectural decisions exactly as stated: **Cloudflare Workers + D1 + R2 + KV + TanStack Start + WorkOS + React + Tailwind + Radix UI**. Use the multi-tenant model and APIs exactly as described.
