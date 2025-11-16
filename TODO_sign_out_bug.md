# WorkOS Support Request - Account Selection After Logout

**Subject: Feature Request - Support for `prompt=select_account` in AuthKit**

Hi WorkOS Support Team,

I'm building a multi-tenant application using WorkOS AuthKit (Node.js SDK v7.73.0) and have encountered a limitation regarding account selection after logout.

## The Issue

When users sign out of my application and then click "Sign In" again, they are automatically re-authenticated with the same account without being prompted to select or switch accounts. This creates a poor user experience for users who want to switch between multiple accounts (e.g., personal vs. work accounts).

## What I've Tried

I've attempted several approaches to force account selection:

### 1. **Using the `prompt` parameter**
```typescript
const authorizationUrl = workos.userManagement.getAuthorizationUrl({
  provider: "authkit",
  clientId: "...",
  redirectUri: "...",
  screenHint: "sign-in",
  prompt: "select_account"  // This is accepted but not honored
});
```

**Result:** The `prompt` parameter is accepted by the WorkOS API, but it doesn't force the account selection screen to appear. The URL generated is:
```
https://api.workos.com/user_management/authorize?client_id=...&prompt=select_account&provider=authkit&...
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

**Result:** The `provider_query_params` is logged in the parameters but **not** included in the generated authorization URL. It appears that `provider_query_params` may only work with direct OAuth providers (e.g., `GoogleOAuth`) and not with `provider: "authkit"`.

### 3. **Aggressive browser storage clearing**
I implemented client-side code to clear all localStorage, sessionStorage, and cookies before logout.

**Result:** This doesn't work because WorkOS uses HTTP-only cookies and maintains server-side sessions that cannot be cleared from the browser.

## Expected Behavior

When a user signs out and clicks "Sign In" again, I would like AuthKit to show the account selection screen, allowing users to:
- Choose a different account
- Confirm which account they want to use
- Switch between multiple authenticated sessions

This is standard OAuth behavior supported by the `prompt=select_account` parameter in OAuth 2.0 / OpenID Connect.

## Feature Request

Could you please add support for passing the `prompt` parameter through AuthKit to the underlying OAuth providers (Google, Microsoft, etc.)? This would allow developers to control the authentication prompt behavior.

Alternatively, if there's already a way to achieve this that I've missed, I'd appreciate guidance on the correct implementation.

## My Setup

- **WorkOS SDK:** `@workos-inc/node` v7.73.0
- **Framework:** TanStack Start
- **Provider:** `authkit`
- **OAuth Providers:** Google OAuth (via AuthKit)

## Use Case

Our application serves users who often need to switch between personal and work accounts. Being automatically logged back into the same account after logout creates friction and confuses users who expect to be able to choose their account.

Thank you for your help! WorkOS AuthKit has been great to work with otherwise, and I appreciate any guidance or timeline for this feature.

Best regards,
[Your Name]
