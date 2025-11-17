# WorkOS Support Request - Account Selection After Logout

**Subject: Feature Request - Support for `prompt=select_account` in AuthKit**

Hi WorkOS Support Team,

I'm building a multi-tenant application using WorkOS AuthKit (Node.js SDK v7.73.0) and have encountered a critical limitation regarding account selection after logout.

## The Issue

When users sign out of my application and then click "Sign In" again, they are **automatically re-authenticated with the same account** without being prompted to select or switch accounts. This completely bypasses the AuthKit login screen (`https://youthful-line-32-staging.authkit.app/`) and immediately logs them back in.

**Current Behavior:**
1. User clicks "Sign Out" → Redirected to WorkOS logout URL → Returns to app (logged out)
2. User clicks "Sign In" → **Automatically authenticated** → No login screen shown
3. User is logged in with the same account they just logged out from

**Expected Behavior:**
1. User clicks "Sign Out" → Redirected to WorkOS logout URL → Returns to app (logged out)
2. User clicks "Sign In" → **Shown AuthKit login screen** → User can select/switch accounts
3. User completes authentication → Logged in with selected account

This creates a poor user experience for users who want to switch between multiple accounts (e.g., personal vs. work accounts).

## What I've Tried

I've attempted multiple approaches to force account selection, all without success:

### 1. **Using the `prompt` parameter directly**
```typescript
const authorizationUrl = workos.userManagement.getAuthorizationUrl({
  provider: "authkit",
  clientId: "...",
  redirectUri: "...",
  screenHint: "sign-in",
  prompt: "select_account"  // Passed directly to WorkOS API
});
```

**Result:** The `prompt` parameter is accepted by the WorkOS API and appears in the generated URL, but **WorkOS still auto-authenticates the user** without showing the login screen.

**Actual URL generated:**
```
https://api.workos.com/user_management/authorize?client_id=client_01KA2VNNDSNMQY3W9G7SE1KNVP&prompt=select_account&provider=authkit&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback&response_type=code&screen_hint=sign-in
```

### 2. **Using `provider_query_params`**
```typescript
const authorizationUrl = workos.userManagement.getAuthorizationUrl({
  provider: "authkit",
  clientId: "...",
  redirectUri: "...",
  screenHint: "sign-in",
  provider_query_params: {
    prompt: "select_account"
  }
});
```

**Result:** The `provider_query_params` is logged in the parameters but **not included in the generated authorization URL**. It appears that `provider_query_params` may only work with direct OAuth providers (e.g., `GoogleOAuth`) and not with `provider: "authkit"`.

### 3. **Manually adding `prompt=select_account` to the URL**
Since the SDK doesn't include it, I've tried manually appending it to the generated URL:

```typescript
let authorizationUrl = workos.userManagement.getAuthorizationUrl(params);
const url = new URL(authorizationUrl);
url.searchParams.set("prompt", "select_account");
authorizationUrl = url.toString();
```

**Result:** The URL includes `prompt=select_account`, but **WorkOS still auto-authenticates** the user, suggesting that WorkOS is maintaining a server-side session that persists after logout.

### 4. **Aggressive browser storage clearing**
I implemented client-side code to clear all localStorage, sessionStorage, and cookies (including WorkOS cookies) before logout:

```typescript
localStorage.clear();
sessionStorage.clear();
// Clear all cookies including WorkOS AuthKit cookies
document.cookie.split(";").forEach(cookie => {
  // Delete cookie for all possible paths and domains
});
```

**Result:** This doesn't work because WorkOS uses HTTP-only cookies and maintains **server-side sessions that cannot be cleared from the browser**. The session appears to persist on WorkOS servers even after calling `getLogoutUrl()`.

### 5. **Cache invalidation and fresh URL generation**
I've implemented proper cache invalidation to ensure a fresh sign-in URL is generated after logout, including cache-busting parameters:

```typescript
// After logout, clear all auth cache
queryClient.removeQueries({ queryKey: ["auth"] });
queryClient.invalidateQueries({ queryKey: ["auth"] });

// Generate fresh sign-in URL with forceAccountSelection
const signInUrl = getAuthorizationUrl({
  screenHint: "sign-in",
  forceAccountSelection: true, // Adds prompt=select_account
});
```

**Result:** A fresh URL is generated with `prompt=select_account` and cache-busting parameters, but **WorkOS still auto-authenticates** the user, indicating the issue is on WorkOS's server-side session management.

## Root Cause Analysis

Based on my testing, the issue appears to be that **WorkOS maintains server-side sessions that persist after logout**. When `getLogoutUrl()` is called:

1. The logout URL is generated correctly
2. The user is redirected to WorkOS logout endpoint
3. The user is redirected back to the application
4. **However, WorkOS still maintains the session on their servers**

When the user clicks "Sign In" again (even with `prompt=select_account` in the URL), WorkOS recognizes the existing server-side session and automatically authenticates the user, bypassing the AuthKit login screen entirely.

## Expected Behavior

When a user signs out and clicks "Sign In" again, I would like AuthKit to:
1. **Show the AuthKit login screen** (`https://youthful-line-32-staging.authkit.app/`)
2. Allow users to choose a different account
3. Allow users to confirm which account they want to use
4. Allow users to switch between multiple authenticated sessions

This is standard OAuth 2.0 / OpenID Connect behavior supported by the `prompt=select_account` parameter, which should force the authentication provider to show the account selection screen even if a valid session exists.

## Feature Request

I have two requests:

### 1. **Honor `prompt=select_account` parameter**
Could you please ensure that when `prompt=select_account` is included in the authorization URL (either via the `prompt` parameter or `provider_query_params`), AuthKit:
- Shows the login screen instead of auto-authenticating
- Passes the `prompt=select_account` parameter through to underlying OAuth providers (Google, Microsoft, etc.)
- Forces account selection even when a valid server-side session exists

### 2. **Proper session termination on logout**
Could you please ensure that when `getLogoutUrl()` is called and the user completes the logout flow, the server-side session is **completely terminated** on WorkOS servers? Currently, it appears the session persists, allowing automatic re-authentication.

Alternatively, if there's already a way to achieve this that I've missed, I'd appreciate guidance on the correct implementation.

## My Setup

- **WorkOS SDK:** `@workos-inc/node` v7.73.0
- **Framework:** TanStack Start (React)
- **Provider:** `authkit`
- **OAuth Providers:** Google OAuth (via AuthKit)
- **Environment:** Staging (`youthful-line-32-staging.authkit.app`)

## Use Case

Our application serves users who often need to switch between personal and work accounts. Being automatically logged back into the same account after logout:
- Creates friction for users who expect to choose their account
- Prevents users from switching between accounts
- Violates user expectations for logout behavior
- Makes it impossible to test multi-account scenarios

## Additional Context

I've verified that:
- The authorization URL includes `prompt=select_account` (visible in browser network tab)
- All browser storage is cleared on logout
- A fresh authorization URL is generated after logout
- The logout URL is called correctly via `getLogoutUrl({ sessionId: accessToken })`

Despite all of this, WorkOS still auto-authenticates users, suggesting the issue is with WorkOS's server-side session management rather than client-side implementation.

Thank you for your help! WorkOS AuthKit has been great to work with otherwise, and I appreciate any guidance or timeline for this feature.

Best regards,
Jeremiah Bejarano
