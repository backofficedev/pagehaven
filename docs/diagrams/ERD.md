# PageHaven - Entity Relationship Diagram

## Full ERD (Mermaid)

```mermaid
erDiagram
    %% ============ AUTHENTICATION DOMAIN ============
    USER {
        text id PK
        text name
        text email UK
        boolean emailVerified
        text image
        timestamp createdAt
        timestamp updatedAt
    }

    SESSION {
        text id PK
        text token UK
        timestamp expiresAt
        text ipAddress
        text userAgent
        text userId FK
        timestamp createdAt
        timestamp updatedAt
    }

    ACCOUNT {
        text id PK
        text accountId
        text providerId
        text userId FK
        text accessToken
        text refreshToken
        text idToken
        timestamp accessTokenExpiresAt
        timestamp refreshTokenExpiresAt
        text scope
        text password
        timestamp createdAt
        timestamp updatedAt
    }

    VERIFICATION {
        text id PK
        text identifier
        text value
        timestamp expiresAt
        timestamp createdAt
        timestamp updatedAt
    }

    %% ============ SITE MANAGEMENT DOMAIN ============
    SITE {
        text id PK
        text name
        text subdomain UK
        text customDomain UK
        text description
        text activeDeploymentId FK
        text createdBy FK
        timestamp createdAt
        timestamp updatedAt
    }

    SITE_MEMBER {
        text id PK
        text siteId FK
        text userId FK
        text role
        text invitedBy FK
        timestamp createdAt
    }

    SITE_ACCESS {
        text id PK
        text siteId FK
        text accessType
        text passwordHash
        timestamp createdAt
        timestamp updatedAt
    }

    SITE_INVITE {
        text id PK
        text siteId FK
        text email
        text userId FK
        text invitedBy FK
        timestamp expiresAt
        timestamp acceptedAt
        timestamp createdAt
    }

    DEPLOYMENT {
        text id PK
        text siteId FK
        text storagePath
        text status
        integer fileCount
        integer totalSize
        text commitHash
        text commitMessage
        text deployedBy FK
        timestamp createdAt
        timestamp finishedAt
    }

    %% ============ ANALYTICS DOMAIN ============
    SITE_ANALYTICS {
        text id PK
        text siteId FK
        text date
        text path
        integer views
        integer uniqueVisitors
        integer bandwidth
    }

    DOMAIN_VERIFICATION {
        text id PK
        text siteId FK
        text domain UK
        text verificationToken
        text status
        timestamp lastCheckedAt
        timestamp verifiedAt
        timestamp createdAt
    }

    %% ============ RELATIONSHIPS ============
    USER ||--o{ SESSION : "has"
    USER ||--o{ ACCOUNT : "has"
    USER ||--o{ SITE : "creates"
    USER ||--o{ SITE_MEMBER : "belongs to"
    USER ||--o{ DEPLOYMENT : "deploys"
    USER ||--o{ SITE_INVITE : "invites"
    USER ||--o{ SITE_INVITE : "is invited"

    SITE ||--o{ SITE_MEMBER : "has"
    SITE ||--|| SITE_ACCESS : "has"
    SITE ||--o{ SITE_INVITE : "has"
    SITE ||--o{ DEPLOYMENT : "has"
    SITE ||--o{ SITE_ANALYTICS : "tracks"
    SITE ||--o{ DOMAIN_VERIFICATION : "verifies"
    SITE ||--o| DEPLOYMENT : "active deployment"
```

## Simplified Domain View

```mermaid
erDiagram
    USER ||--o{ SITE : "owns/manages"
    USER ||--o{ SITE_MEMBER : "membership"
    SITE ||--o{ SITE_MEMBER : "team"
    SITE ||--|| SITE_ACCESS : "visibility"
    SITE ||--o{ DEPLOYMENT : "versions"
    SITE ||--o{ SITE_ANALYTICS : "metrics"
    SITE ||--o{ DOMAIN_VERIFICATION : "custom domains"

    USER {
        text id PK
        text email UK
        text name
    }

    SITE {
        text id PK
        text subdomain UK
        text customDomain
        text name
    }

    SITE_MEMBER {
        text siteId FK
        text userId FK
        text role
    }

    SITE_ACCESS {
        text siteId FK
        text accessType
    }

    DEPLOYMENT {
        text id PK
        text siteId FK
        text status
        text storagePath
    }

    SITE_ANALYTICS {
        text siteId FK
        text date
        integer views
    }

    DOMAIN_VERIFICATION {
        text siteId FK
        text domain UK
        text status
    }
```

## Table Summary

| Table                 | Purpose                    | Key Fields                                  |
| --------------------- | -------------------------- | ------------------------------------------- |
| `user`                | User accounts              | email, name, emailVerified                  |
| `session`             | Active login sessions      | token, expiresAt, userId                    |
| `account`             | OAuth/credential providers | providerId, password                        |
| `verification`        | Email verification tokens  | identifier, value, expiresAt                |
| `site`                | Hosted websites            | subdomain, customDomain, activeDeploymentId |
| `site_member`         | Team membership            | siteId, userId, role                        |
| `site_access`         | Visibility settings        | accessType, passwordHash                    |
| `site_invite`         | Visitor invitations        | email, expiresAt                            |
| `deployment`          | Site versions              | storagePath, status, fileCount              |
| `site_analytics`      | Traffic metrics            | date, path, views, bandwidth                |
| `domain_verification` | Custom domain DNS          | domain, verificationToken, status           |

## Role Hierarchy

```mermaid
graph TD
    OWNER[Owner] --> ADMIN[Admin]
    ADMIN --> EDITOR[Editor]
    EDITOR --> VIEWER[Viewer]

    OWNER_PERMS["• Delete site<br/>• Transfer ownership<br/>• All admin permissions"]
    ADMIN_PERMS["• Manage members<br/>• Update settings<br/>• All editor permissions"]
    EDITOR_PERMS["• Deploy sites<br/>• Upload files<br/>• All viewer permissions"]
    VIEWER_PERMS["• View site<br/>• View analytics<br/>• View deployments"]

    OWNER --- OWNER_PERMS
    ADMIN --- ADMIN_PERMS
    EDITOR --- EDITOR_PERMS
    VIEWER --- VIEWER_PERMS
```

## Access Types

```mermaid
graph LR
    subgraph "Site Visibility Options"
        PUBLIC[Public] --> |"Anyone can view"| WORLD((🌍))
        PASSWORD[Password] --> |"Requires password"| LOCK((🔒))
        PRIVATE[Private] --> |"Invited users only"| INVITE((✉️))
        OWNER_ONLY[Owner Only] --> |"Team members only"| TEAM((👥))
    end
```
