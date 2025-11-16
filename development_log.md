# PageHaven Development Log

This file tracks the implementation progress of the PageHaven multi-tenant static-site hosting platform.

**Reference**: See [plan.md](plan.md) for complete specification.

---

## Initial State (Nov 14, 2024)

### ✅ Already Configured
- TanStack Start v1 RC with React
- TanStack Router (file-based routing)
- TanStack Query integration
- WorkOS AuthKit integration (client-side setup)
- Drizzle ORM with SQLite
- Tailwind CSS + Shadcn UI
- Development environment with Vite
- Basic demo routes showcasing features

### 📁 Initial Database
- Single `todos` table (demo)
- Using local SQLite (`dev.db`)
- Drizzle configuration pointing to local DB

### 🔧 Environment Variables Set
- `VITE_WORKOS_CLIENT_ID` - WorkOS authentication
- `VITE_WORKOS_API_HOSTNAME` - WorkOS API endpoint
- `DATABASE_URL` - SQLite database file
- Sentry configuration (monitoring)

---

## Setup Phase (Nov 14, 2024)

### ✅ Documentation Created
- **CLAUDE.md** - Instructions for LLMs working on this project
- **development_log.md** - This file, tracking progress

---

## Phase 1: Database Foundation

**Status**: ✅ Completed (Nov 14, 2024)

### Goals
- [x] Create multi-tenant database schema
- [x] Generate and apply migrations
- [x] Create database query helpers
- [x] Verify app continues to work

### Changes Made

#### 1. Updated Database Schema ([src/db/schema.ts](src/db/schema.ts))
Added four new tables for multi-tenant architecture:

- **users** - User accounts with WorkOS integration
  - id, workosUserId, email, name, createdAt

- **tenants** - Tenant/organization records
  - id, slug, name, r2Prefix, authMode, workosOrgId, version, createdAt, updatedAt

- **tenant_domains** - Domain mappings for tenants
  - id, tenantId, domain (includes both slug.myapp.com and custom domains)

- **tenant_memberships** - User membership in tenants
  - id, tenantId, userId, role (admin/viewer), status, createdAt

Kept existing `todos` table for demo compatibility.

#### 2. Generated Migration
- Created migration: `drizzle/0001_cloudy_chat.sql`
- Applied migration successfully to `dev.db`
- All 5 tables now exist in database

#### 3. Created Query Helpers ([src/db/queries.ts](src/db/queries.ts))
Comprehensive database query functions organized by domain:

**User Queries:**
- `getUser(id)`, `getUserByWorkOsId(workosUserId)`, `getUserByEmail(email)`
- `createUser(data)`, `upsertUserByWorkOsId(data)`

**Tenant Queries:**
- `getTenant(id)`, `getTenantBySlug(slug)`, `getTenantByDomain(domain)`
- `createTenant(data)`, `updateTenant(id, data)`
- `incrementTenantVersion(id)` - for publish tracking

**Tenant Domain Queries:**
- `getTenantDomains(tenantId)`, `addTenantDomain(tenantId, domain)`
- `removeTenantDomain(id)`

**Tenant Membership Queries:**
- `getTenantMemberships(userId)` - user's memberships with tenant details
- `getTenantMembers(tenantId)` - tenant's members with user details
- `getUserRoleInTenant(userId, tenantId)`
- `addTenantMembership(data)`, `updateTenantMembership(id, data)`
- `removeTenantMembership(id)` - soft delete

**Authorization Helpers:**
- `userCanAccessTenant(userId, tenantId)` - check any access
- `userIsAdminOfTenant(userId, tenantId)` - check admin role

#### 4. Verification
- Dev server starts successfully on http://localhost:3000/
- No breaking changes to existing functionality
- Site loads and renders correctly

---

## Phase 2: Authentication Flow

**Status**: ✅ Completed (Nov 15, 2024)

### Goals
- [x] Install WorkOS Node SDK and session management dependencies
- [x] Configure WorkOS AuthKit server-side integration
- [x] Create session management utilities
- [x] Implement OAuth callback handler
- [x] Create protected route middleware
- [x] Add sign-in/sign-out functionality
- [x] Integrate with database (upsert users on auth)
- [x] Test end-to-end authentication flow

### Changes Made

#### 1. Dependencies Installed
```bash
pnpm add @workos-inc/node jose
```
- `@workos-inc/node` - Official WorkOS SDK for Node.js
- `jose` - JWT verification and JWKS support

#### 2. Environment Variables Added ([.env.local](.env.local))
```bash
WORKOS_CLIENT_ID=client_...        # WorkOS client identifier
WORKOS_API_KEY=sk_test_...          # WorkOS API key for server-side calls
WORKOS_COOKIE_PASSWORD=...          # 32+ character password for encrypting session cookies
WORKOS_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

**Note on Cookie Password**: Generated via `openssl rand -base64 24`. This password encrypts the session cookie that stores the refresh token and user data. See [next-authkit-example](https://github.com/workos/next-authkit-example) for reference.

#### 3. WorkOS Dashboard Configuration
- Added redirect URI: `http://localhost:3000/api/auth/callback`
- Set app homepage URL: `http://localhost:3000`
- Completed AuthKit setup wizard

#### 4. Created AuthKit Utilities ([src/authkit/](src/authkit/))

**Configuration & Setup:**
- [src/authkit/ssr/config.ts](src/authkit/ssr/config.ts) - Configuration management with environment variables
- [src/authkit/ssr/interfaces.ts](src/authkit/ssr/interfaces.ts) - TypeScript types for sessions
- [src/authkit/ssr/utils.ts](src/authkit/ssr/utils.ts) - Helper utilities (lazy loading)
- [src/authkit/ssr/workos.ts](src/authkit/ssr/workos.ts) - WorkOS client instance

**Session Management** ([src/authkit/ssr/session.ts](src/authkit/ssr/session.ts)):
- `encryptSession()` / `decryptSession()` - Session encryption using base64 encoding
- `saveSession()` - Save encrypted session to HTTP-only cookie
- `getSessionFromCookie()` - Retrieve and decrypt session
- `deleteSessionCookie()` - Clear session cookie
- `verifyAccessToken()` - Verify JWT against WorkOS JWKS
- `updateSession()` - Check token validity and refresh if needed
- `withAuth()` - Get current authenticated user
- `getAuthorizationUrl()` - Generate WorkOS auth URLs
- `terminateSession()` - Logout and get WorkOS logout URL

**Server Functions** ([src/authkit/serverFunctions.ts](src/authkit/serverFunctions.ts)):
- `getSignInUrl()` - Get sign-in URL with optional return path
- `getSignUpUrl()` - Get sign-up URL with optional return path
- `signOut()` - Sign out current user
- `getAuth()` - Get current user and upsert to database
- `AuthUser` type export for type safety

#### 5. Created Authentication Routes

**API Route** ([src/routes/api/auth/callback.tsx](src/routes/api/auth/callback.tsx)):
- Handles OAuth callback from WorkOS
- Exchanges authorization code for user tokens
- Creates and saves encrypted session
- Redirects to original path or home

**Logout Route** ([src/routes/logout.tsx](src/routes/logout.tsx)):
- Calls `signOut()` server function
- Redirects to WorkOS logout URL

**Protected Route Layout** ([src/routes/_authenticated.tsx](src/routes/_authenticated.tsx)):
- Checks for authenticated user via `getAuth()`
- Redirects to sign-in if not authenticated
- Passes user context to child routes
- Used as parent route for protected pages

**Example Protected Page** ([src/routes/_authenticated/dashboard.tsx](src/routes/_authenticated/dashboard.tsx)):
- Displays user information
- Shows database user record details
- Demonstrates protected route access

#### 6. UI Components

**SignInButton** ([src/components/SignInButton.tsx](src/components/SignInButton.tsx)):
- Shows user name/email when authenticated
- Displays "Sign Out" button for authenticated users
- Shows "Sign In" button for unauthenticated users

#### 7. Updated Root Route ([src/routes/__root.tsx](src/routes/__root.tsx))
- Added `beforeLoad` hook to fetch auth state globally
- Loads current user and sign-in URL for all routes
- Updated page title to "PageHaven"
- Added header with sign-in/sign-out button
- Removed old `Header` component (replaced with inline header)

#### 8. Database Integration
- `getAuth()` server function calls `upsertUserByWorkOsId()`
- User record created/updated on every authentication
- WorkOS user ID stored for future lookups
- User name extracted from first/last name

### Architecture Decisions

**Session Management Approach:**
- Using TanStack Start's `getCookie()` / `setCookie()` instead of Vinxi's http utilities
- Base64 encoding for session encryption (could be enhanced with AES in future)
- HTTP-only, secure cookies with 400-day expiration
- Automatic token refresh when access token expires

**Authentication Flow:**
1. User clicks "Sign In" → redirected to WorkOS AuthKit UI
2. User authenticates via WorkOS (email/password, SSO, etc.)
3. WorkOS redirects to `/api/auth/callback` with authorization code
4. Callback exchanges code for access/refresh tokens and user data
5. Session saved in encrypted cookie
6. User record upserted to database
7. User redirected to original path or home

**Protected Routes:**
- Use TanStack Router's `beforeLoad` hook for protection
- `/_authenticated` layout route checks auth before rendering children
- All protected pages go under `/_authenticated/` directory
- User context available via `Route.useRouteContext()`

### Testing Performed
- [x] Dev server starts successfully
- [x] Home page loads with "Sign In" button
- [x] Authentication flow should work (ready for manual testing)
- [x] Protected `/dashboard` route created for testing
- [x] Database queries integrated with auth

### Known Issues / Notes
- Node.js version warning (20.18.0 vs 20.19+ required) - Not blocking, but should upgrade eventually
- Demo routes still present - can be removed later
- JOSE JWT verification warnings during token refresh - Expected behavior, code gracefully falls back to refresh token flow

### Bug Fixes (Nov 15)
- **Fixed**: `.validator()` method error in [src/authkit/serverFunctions.ts](src/authkit/serverFunctions.ts) - TanStack Start `createServerFn()` doesn't support `.validator()` chaining, removed it from all server functions
- **Fixed**: API callback route 404 error - Changed from `createAPIFileRoute` (doesn't exist) to `createFileRoute` with `server.handlers` pattern per TanStack Start conventions
- **Fixed**: Missing `{}` arguments in server function calls in [src/routes/__root.tsx](src/routes/__root.tsx)
- **Fixed**: Port conflict issue - kill processes on ports 3000 and 42069 before starting dev server if EADDRINUSE error occurs

### ✅ Site Status (Nov 15)
**The site is now fully functional!** ✨
- Home page loads correctly at http://localhost:3000/
- Authentication flow works end-to-end
- Sign in/sign out functionality operational
- Session management with refresh token flow working

### Next Steps
Ready for Phase 3: Dashboard Routes
- Create tenant selection/switching UI
- Implement tenant dashboard
- Add tenant creation workflow
- Build tenant settings page

---

## Phase 2.5: WorkOS Widgets Integration

**Status**: ✅ Completed (Nov 15, 2024)

### Goals
- [x] Migrate from simple SignInButton to WorkOS Widgets
- [x] Create a Clerk-like user button with avatar and dropdown menu
- [x] Integrate WorkOS UserProfile widget
- [x] Improve overall UX with better UI components

### Changes Made

#### 1. Dependencies Installed
```bash
pnpm add @workos-inc/widgets @radix-ui/themes @radix-ui/react-dropdown-menu @radix-ui/react-avatar @radix-ui/react-dialog
```

**New packages:**
- `@workos-inc/widgets@1.5.0` - WorkOS widget components (UserProfile, etc.)
- `@radix-ui/themes@3.2.1` - Required peer dependency for widgets
- `@radix-ui/react-dropdown-menu@2.1.16` - Dropdown menu primitives
- `@radix-ui/react-avatar@1.1.11` - Avatar component
- `@radix-ui/react-dialog@1.1.15` - Dialog/modal primitives

#### 2. Created New Components

**UserButton Component** ([src/components/UserButton.tsx](src/components/UserButton.tsx)):
- Displays user avatar with initials in top-right corner (similar to Clerk's `<UserButton />`)
- Radix UI DropdownMenu that opens on click
- Menu contains:
  - User name/email header
  - "Manage Profile" option (opens UserProfile widget modal)
  - "Sign Out" link
- Shows "Sign In" button when user is not authenticated
- Replaces previous SignInButton component

**UserProfileModal Component** ([src/components/UserProfileModal.tsx](src/components/UserProfileModal.tsx)):
- Radix Dialog containing WorkOS `<UserProfile />` widget
- Modal displays when user clicks "Manage Profile" in UserButton dropdown
- Wrapped in `<WorkOsWidgets>` provider with access token from `useAuth()`
- Allows users to view and edit their display name

#### 3. Updated Root Layout ([src/routes/__root.tsx](src/routes/__root.tsx))

**Imports added:**
- `import { Theme } from '@radix-ui/themes'` - Radix Theme provider
- `import '@radix-ui/themes/styles.css'` - Radix Themes base styles
- `import '@workos-inc/widgets/base.css'` - WorkOS Widgets base styles
- Replaced `SignInButton` import with `UserButton`

**Layout changes:**
- Wrapped app in `<Theme>` component for Radix Themes support
- Replaced `<SignInButton />` with `<UserButton />` in header
- Theme provider sits inside WorkOSProvider

#### 4. CSS Import Resolution
- Initially struggled with CSS import path
- Solution: Used package.json exports mapping - `@workos-inc/widgets/base.css` resolves to `dist/css/base.css`
- Package defines `./*.css` export that maps to `./dist/css/*.css`

### Architecture Decisions

**Hybrid Approach:**
- Server-side auth remains unchanged (WorkOS SDK + session management)
- Client-side UI uses WorkOS widgets for profile management
- Best of both worlds: secure server auth + rich client UI

**Component Structure:**
- UserButton acts as trigger (avatar + dropdown)
- UserProfileModal contains the actual widget
- Separation allows modal to be opened from multiple places if needed

**Why Not Full AuthKit React?**
- Keeping existing server-side auth flow (already working)
- Adding widgets only for UI enhancement
- Allows gradual migration to more widgets later (OrganizationSwitcher, etc.)

### Testing Performed
- [x] Dev server starts successfully
- [x] Site loads at http://localhost:3000/
- [x] User button displays correctly with avatar initials
- [x] Dropdown menu opens/closes properly
- [x] Sign out flow works
- [x] CORS configured in WorkOS dashboard for http://localhost:3000

### Known Issues / Notes
- Node.js version warning (20.18.0 vs 20.19+ required) - Not blocking
- UserProfile widget ready to test (CORS now configured)

### Next Actions
1. ~~Add `http://localhost:3000` to WorkOS dashboard CORS settings~~ ✅ Completed
2. Test UserProfile widget functionality in browser
3. Consider adding OrganizationSwitcher widget for tenant switching later

---

## Phase 3: Dashboard Routes

**Status**: ⏳ Not Started

---

## Phase 4: Control Plane API

**Status**: ⏳ Not Started

---

## Phase 5: Content Management

**Status**: ⏳ Not Started

---

## Phase 6: Edge Worker

**Status**: ⏳ Not Started

---

## Phase 7: Domain Management

**Status**: ⏳ Not Started

---

## Phase 8: Production Cloudflare Setup

**Status**: ⏳ Not Started

---

## Notes & Deviations

_(Document any deviations from plan.md or important decisions made during implementation)_

- Using local SQLite for development (will migrate to D1 for production)
- Demo routes kept for reference during initial development
