# 📌 **MASTER PROMPT — Multi-Site Static-Site Hosting Platform (Cloudflare + TanStack Start)**

You are building a complete, production-ready multi-site static-site hosting platform.
This prompt contains the **full specification**. Follow it exactly.

---

# 1. **Purpose of the Application**

Build a SaaS platform where:

1. **Users sign in via WorkOS**.
2. **Users automatically get a default site** upon first sign-in, named "{User's Name}'s Sites".
   - Each site maps to a WorkOS Organization (for user/access management)
3. **Users can create additional sites**.
4. Each site gets a **subdomain** like:
   `https://<slug>.myapp.com`
5. Each site can:

   * Upload a ZIP of static HTML/CSS/JS files
     **OR**
     * Connect a private GitHub repo (you pull its static build)
     * The static files are stored in **R2** under `sites/<siteId>/...`
6. When a visitor goes to `https://<site>.myapp.com`:

   * An **edge worker** resolves the site from the hostname (via KV)
   * Checks whether the site requires auth
   * Optionally verifies WorkOS session (for private sites)
   * Fetches the requested static file from **R2**
   * Injects a small overlay UI (HTMLRewriter) for logged-in users
   * Returns the static HTML
7. Admin users can:

   * Manage domains
   * Manage membership (invite/remove users via WorkOS Organizations)
   * Configure auth mode (public vs WorkOS/SSO-only)
   * Upload/sync site content
   * Trigger redeploy (publish to KV)
8. Viewer users:

   * Can see the site in the dashboard
   * Can see the static site if the site auth rules allow it
   * Cannot modify site settings or content

The app has a **marketing site**, **management dashboard**, and a **control-plane API**.

---

# 2. **Tech Stack**

### **Frontend / App**

* **TanStack Start v1 RC**
* **React**
* **TanStack Router** (file-based routing)
* **TanStack Query**
* **TailwindCSS**
* **Radix UI** for unstyled accessible components

### **Backend / Infra**

* **Cloudflare Workers** for app + control plane
* **Cloudflare KV** for site-config distribution (fast edge reads)
* **Cloudflare R2** for static site storage
* **Cloudflare D1** (SQLite) as system-of-record database (SQLite for development)
* **Cloudflare Pages or Worker deploy** for the Start app
* **WorkOS AuthKit** for authentication + SSO
* **A separate Edge Worker** (not Start) to serve static sites from R2

### **Authentication & Security**

* **@workos-inc/node** - Official WorkOS Node.js SDK
* **jose** - JWT verification and JWKS support
* **TanStack Start Server Functions** - Type-safe server-side functions
* **HTTP-only cookies** - Secure session storage with encryption

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

### **sites** (formerly "tenants" in database schema)

```
id TEXT PRIMARY KEY
slug TEXT UNIQUE NOT NULL      -- forms <slug>.myapp.com
name TEXT NOT NULL
r2_prefix TEXT NOT NULL        -- "sites/<id>/"
auth_mode TEXT NOT NULL        -- "public" | "workos"
workos_org_id TEXT             -- Maps to WorkOS Organization
version INTEGER NOT NULL DEFAULT 1
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

**Note**: The database table is still named `tenants` for backward compatibility, but conceptually these are "sites" in the application.

### **site_domains** (table: `tenant_domains`)

```
id TEXT PRIMARY KEY
tenant_id TEXT REFERENCES tenants(id)  -- References sites table
domain TEXT UNIQUE NOT NULL    -- includes slug.myapp.com and custom domains
```

### **site_memberships** (table: `tenant_memberships`)

```
id TEXT PRIMARY KEY
tenant_id TEXT REFERENCES tenants(id)  -- References sites table
user_id TEXT REFERENCES users(id)
role TEXT NOT NULL             -- "admin" | "viewer"
status TEXT NOT NULL DEFAULT "active"
created_at TEXT NOT NULL
UNIQUE (tenant_id, user_id)
```

**Note**: Membership is managed via WorkOS Organizations. The local database tracks roles for authorization within the application.

---

# 4. **Published Site Config (KV Records)**

For fast lookup at the edge:

* Key: `site:id:<id>`
* Key: `site:host:<domain>`
  Where `<domain>` is each of:

  * `<slug>.myapp.com`
  * Any custom domain

Value (JSON):

```json
{
  "id": "s1",
  "slug": "acme",
  "domains": ["acme.myapp.com"],
  "r2_prefix": "sites/s1/",
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

# 5. **Multi-Site Authorization Model**

* **Users** authenticate via WorkOS (WorkOS concept: User).
* After WorkOS callback, backend:

  * upserts into `users`
  * sets session cookie / JWT
* **Default Site Auto-Provisioning**:
  * Upon first widget token request, system checks if user has any WorkOS Organizations
  * If none exist, automatically creates:
    * WorkOS Organization named "{User's Name}'s Sites" (e.g., "John's Sites")
    * Local site record with slug `${userId}-default`
    * User added as admin member (both in WorkOS Organization and local database)
    * Session refreshed with organization context
  * This ensures WorkOS widgets (OrganizationSwitcher, etc.) always have data to render
  * Pattern is idempotent and self-healing (recreates if org deleted)
* **Site-to-Organization Mapping**: Each PageHaven site maps 1:1 to a WorkOS Organization
  * WorkOS Organizations handle user membership and access
  * Local database tracks site-specific roles (admin/viewer) for authorization
* For every **site-specific CP API route**, check:

  * membership exists (via WorkOS Organization) → allow read
  * membership role = `admin` (from local database) → allow writes
* For the **edge static site**:

  * if site.auth_mode = public → no session required
  * if site.auth_mode = workos → edge calls CP `/api/auth/authorize-site?siteId=...`
    OR decodes JWT to check WorkOS Organization membership quickly

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
  2. Lookup in KV (`site:host:<host>`)
  3. If miss → call CP `/api/sites/by-host?host=...`
  4. Enforce site auth_mode
  5. Fetch static file from R2 (`<r2_prefix>/<path>`)
  6. If HTML → inject overlay using HTMLRewriter
  7. Return file

Bucket is **private**; only Worker can read from R2.

---

# 7. **Content Model**

### Upload flow:

* Admin uploads ZIP to `/api/sites/:id/content/upload`
* Worker unpacks, writes to R2 under `sites/<id>/...`
* Optionally bumps site version & republishes to KV

### GitHub sync flow:

* Admin sets repo + branch
* CP fetches repo contents, builds if necessary, writes to R2
* Publish to KV

---

# 8. **TanStack Start Route Tree**

### Public routes

```
/                             (marketing/landing page)
/pricing                      (to be implemented)
/docs                         (to be implemented)
/logout                       ✅ IMPLEMENTED - Handles logout and WorkOS redirect
/api/auth/callback           ✅ IMPLEMENTED - OAuth callback handler
```

Note: `/login` is handled via WorkOS AuthKit redirect (not a dedicated route)

### Protected routes (under `/_authenticated` layout)

✅ **`/_authenticated` layout** - Checks auth via `beforeLoad`, redirects to WorkOS if not authenticated

```
/_authenticated/dashboard     ✅ IMPLEMENTED - Example protected page showing user info
/_authenticated/sites         ✅ IMPLEMENTED - List of user's sites
/_authenticated/sites/:siteId
    /_authenticated/sites/:siteId/          (overview)
    /_authenticated/sites/:siteId/domains
    /_authenticated/sites/:siteId/auth
    /_authenticated/sites/:siteId/content
    /_authenticated/sites/:siteId/deploys
    /_authenticated/sites/:siteId/members
/_authenticated/account       (to be implemented)
```

**Pattern**: All protected pages are children of `/_authenticated` route, which handles authentication check in `beforeLoad` hook.

### API routes

```
/api/auth/callback           ✅ IMPLEMENTED - WorkOS OAuth callback
/api/me                       (to be implemented)
/api/sites                    (GET, POST) - to be implemented
/api/sites/:siteId            (GET, PATCH, DELETE) - to be implemented
/api/sites/:siteId/publish
/api/sites/:siteId/domains
/api/sites/:siteId/memberships
/api/sites/by-host            (edge fallback)
```

---

# 9. **Server Functions / Loaders / Actions**

### Examples

* `/login` → server function: create WorkOS auth URL → redirect.
* `/auth/callback` → server function: exchange code, create user, set session cookie, redirect.
* `/app/_layout` loader:
  loads current user + all site memberships for the site switcher.
* `/app/sites/:siteId/_layout` loader:
  loads site + role; if viewer but trying admin action → 403.

---

# 10. **Control Plane Publish Logic**

Whenever a site is updated:

1. Query full site config + domains from D1.
2. Build the compact JSON payload.
3. Write to KV:

   * `site:id:<id>`
   * `site:host:<domain>` for every domain

Edge worker reads this instantly on next request.

---

# 11. **Session + Auth Implementation**

✅ **IMPLEMENTED** - Phase 2 Complete

### Architecture ([src/authkit/](src/authkit/))

**Session Management:**
* Secure, HTTP-only cookies with 400-day expiration
* Encrypted session data using base64 encoding (can be enhanced with AES)
* Cookie name: `wos-session`
* Stores encrypted JSON containing:
  ```json
  {
    "accessToken": "...",
    "refreshToken": "...",
    "user": { WorkOS User object },
    "impersonator": { optional }
  }
  ```

**Directory Structure:**
```
src/authkit/
├── ssr/
│   ├── config.ts          - Configuration with env vars
│   ├── interfaces.ts      - TypeScript types
│   ├── session.ts         - Session encryption, JWT verification, token refresh
│   ├── utils.ts           - Helper utilities
│   └── workos.ts          - WorkOS client instance
└── serverFunctions.ts     - TanStack Start server functions
```

**Server Functions** (src/authkit/serverFunctions.ts):
* `getAuth()` - Get current user, upsert to database
* `getSignInUrl()` - Generate WorkOS sign-in URL with return path
* `getSignUpUrl()` - Generate WorkOS sign-up URL
* `signOut()` - Terminate session, get logout URL

**Session Operations** (src/authkit/ssr/session.ts):
* `encryptSession()` / `decryptSession()` - Session encryption
* `saveSession()` - Save to HTTP-only cookie
* `getSessionFromCookie()` - Retrieve and decrypt
* `deleteSessionCookie()` - Clear session
* `verifyAccessToken()` - Verify JWT against WorkOS JWKS using `jose`
* `updateSession()` - Check validity, auto-refresh if expired
* `withAuth()` - Get authenticated user with token refresh
* `getAuthorizationUrl()` - Generate WorkOS auth URLs
* `terminateSession()` - Logout flow

**Authentication Flow:**
1. User clicks "Sign In" → redirect to WorkOS AuthKit UI
2. User authenticates (email/password, SSO, etc.)
3. WorkOS redirects to `/api/auth/callback?code=...&state=...`
4. Callback exchanges code for `{ user, accessToken, refreshToken }`
5. Session encrypted and saved to cookie
6. User record upserted to database via `upsertUserByWorkOsId()`
7. Redirect to original path or home

**Protected Routes Pattern:**
* `/_authenticated` layout checks auth in `beforeLoad` hook
* Calls `getAuth()` server function
* Redirects to WorkOS if not authenticated
* Passes user context to child routes

**For CP API calls:**
* Server functions call `withAuth()` to get current user
* Automatic token refresh if access token expired
* User data includes database record + WorkOS user object

**For edge worker** (to be implemented):
* Either decode JWT locally using `jose`
* Or call `/api/auth/authorize-site?siteId=X` (fast path)

**Environment Variables Required:**
```bash
WORKOS_CLIENT_ID          # WorkOS client identifier
WORKOS_API_KEY            # WorkOS API key for server calls
WORKOS_COOKIE_PASSWORD    # 32+ char password for cookie encryption
WORKOS_REDIRECT_URI       # OAuth callback URL
```

**Cookie Password Generation:**
```bash
openssl rand -base64 24
```
Reference: [next-authkit-example](https://github.com/workos/next-authkit-example)

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

* Routing structure (TanStack Router file-based)
* Loaders / actions (using `beforeLoad` and server functions)
* Server-only helpers for D1/R2/KV
* ✅ **WorkOS login + callback flow** - IMPLEMENTED
  * Server functions: `getSignInUrl()`, `getSignUpUrl()`, `signOut()`
  * OAuth callback: `/api/auth/callback`
  * Protected routes: `/_authenticated` layout
* ✅ **Session management** - IMPLEMENTED
  * HTTP-only encrypted cookies
  * Automatic token refresh
  * JWT verification with JWKS
  * User upsert to database
* Site CRUD (Phase 3+) ✅ IMPLEMENTED
* Membership CRUD (Phase 3+) ✅ IMPLEMENTED (via WorkOS Organizations)
* Domain CRUD (Phase 7)
* Content upload + GitHub sync (Phase 5)
* Publish-to-KV utility (Phase 4)
* `/api/sites/by-host` implementation (Phase 4)

### **Edge Worker**:

* Host parsing
* KV lookup
* API fallback
* R2 fetch
* HTMLRewriter injection
* Auth gating logic

### **Database layer**:

* ✅ **D1 migrations** - IMPLEMENTED (Phase 1)
  * Migration: `drizzle/0001_cloudy_chat.sql`
  * Tables: users, tenants (sites), tenant_domains (site_domains), tenant_memberships (site_memberships)
  * **Note**: Database tables still use "tenant" naming for backward compatibility, but application refers to them as "sites"
* ✅ **Query helpers** - IMPLEMENTED (Phase 1)
  * User queries: `getUser()`, `getUserByWorkOsId()`, `createUser()`, `upsertUserByWorkOsId()`
  * Site queries: `getTenant()`, `getTenantBySlug()`, `getTenantByDomain()`, `createTenant()`, `updateTenant()`
  * Domain queries: `getTenantDomains()`, `addTenantDomain()`, `removeTenantDomain()`
  * Membership queries: `getTenantMemberships()`, `getUserRoleInTenant()`, `addTenantMembership()`
  * Authorization helpers: `userCanAccessTenant()`, `userIsAdminOfTenant()`
  * **Note**: Function names still use "tenant" for backward compatibility, but conceptually these are "sites"

### **Front-end**:

* Marketing pages (SSR)
* Dashboard layout with site switcher (uses WorkOS OrganizationSwitcher widget)
* Site detail pages:

  * overview
  * domains
  * auth config
  * content panel
  * deploy history UI
  * membership management (uses WorkOS UsersManagement widget)
* Form components (using Radix)
* API integration via Start's built-in server functions

### **Configs**:

* Cloudflare `wrangler.toml` for:

  * Start app worker
  * edge worker
  * R2 bindings
  * KV bindings
  * D1 DB binding
* Tailwind config

---

# 14. **Development Environment Setup**

### Required Environment Variables

Create a `.env.local` file with:

```bash
# WorkOS Authentication
WORKOS_CLIENT_ID=client_...              # From WorkOS dashboard
WORKOS_API_KEY=sk_test_...               # From WorkOS dashboard API keys
WORKOS_COOKIE_PASSWORD=...               # Generate with: openssl rand -base64 24
WORKOS_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Legacy (for client-side WorkOS provider - may be removed)
VITE_WORKOS_CLIENT_ID=client_...
VITE_WORKOS_API_HOSTNAME=api.workos.com

# Database
DATABASE_URL="dev.db"                    # SQLite for development

# Sentry (optional)
VITE_SENTRY_DSN=...
VITE_SENTRY_ORG=...
VITE_SENTRY_PROJECT=...
SENTRY_AUTH_TOKEN=...
```

### WorkOS Dashboard Configuration

1. **Sign up** at [WorkOS Dashboard](https://dashboard.workos.com/)
2. **Create a new project** or select existing
3. **Navigate to AuthKit** section
4. **Add Redirect URI**: `http://localhost:3000/api/auth/callback`
5. **Set App Homepage URL**: `http://localhost:3000`
6. **Copy credentials**:
   - Client ID from AuthKit settings
   - API Key from API Keys tab
7. **Complete AuthKit setup wizard**

### Cookie Password Generation

The `WORKOS_COOKIE_PASSWORD` must be **32+ characters** for secure session encryption:

```bash
openssl rand -base64 24
```

This password encrypts the session cookie containing the refresh token and user data.

**Reference**: [WorkOS Next.js AuthKit Example](https://github.com/workos/next-authkit-example)

### Installation & Running

```bash
# Install dependencies
pnpm install

# Generate database types
pnpm db:generate

# Run migrations
pnpm db:migrate

# Start development server
pnpm dev

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

### Development Database

- **Development**: SQLite (`dev.db`)
- **Production**: Cloudflare D1
- Drizzle ORM handles both environments seamlessly

---

# 15. **Implementation Progress**

See [development_log.md](development_log.md) for detailed implementation notes.

### ✅ Phase 1: Database Foundation (Nov 14, 2024)
- Multi-tenant database schema created
- Drizzle migrations generated and applied
- Query helpers for all entities
- Authorization helpers implemented

### ✅ Phase 2: Authentication Flow (Nov 15, 2024)
- WorkOS AuthKit server-side integration
- Session management with encrypted cookies
- OAuth callback handler
- Protected route middleware (`/_authenticated`)
- Sign-in/sign-out functionality
- Database user persistence
- Server functions: `getAuth()`, `getSignInUrl()`, `signOut()`

### ✅ Phase 3: Dashboard Routes (Nov 16, 2024)
- **WorkOS Widget-First Architecture**: Maximum use of WorkOS widgets for UI
  - `<OrganizationSwitcher />` for site switching in header
  - `<UsersManagement />` for member management
  - `<UserProfile />` for user account settings
- **Default Site Auto-Provisioning**: Every user gets "{User's Name}'s Sites" on first widget load
  - Ensures OrganizationSwitcher always has data to render
  - Uses checkpoint pattern in `getWidgetToken()` for resilience
  - Slug convention: `${userId}-default`
- **Site-to-Organization Mapping**: Each PageHaven site maps 1:1 to WorkOS Organization
- Site creation workflow with WorkOS Organization sync
- Site dashboard with role-based access (admin/viewer)
- Site settings, domains, and member management pages

### ⏳ Phase 4: Control Plane API (Not Started)
### ⏳ Phase 5: Content Management (Not Started)
### ⏳ Phase 6: Edge Worker (Not Started)
### ⏳ Phase 7: Domain Management (Not Started)
### ⏳ Phase 8: Production Cloudflare Setup (Not Started)

---

# 16. **Final Instruction to the LLM**

Using the full specification above, build the entire application (or complete it step-by-step if requested).
Follow all architectural decisions exactly as stated: **Cloudflare Workers + D1 + R2 + KV + TanStack Start + WorkOS + React + Tailwind + Radix UI**. Use the multi-site model and APIs exactly as described.

**Terminology Mapping**:
- **Sites**: PageHaven's concept for static site hosting instances (user-facing term)
- **WorkOS Organizations**: WorkOS's concept for grouping users and managing access (used internally for membership management)
- **WorkOS Users**: WorkOS's concept for authenticated identities
- **Database Tables**: Still use "tenant" naming for backward compatibility, but application refers to them as "sites"

**For implemented features (marked with ✅)**: Refer to the actual implementation in the codebase and build upon those patterns. The [development_log.md](development_log.md) contains detailed notes about implementation decisions and architecture choices.
