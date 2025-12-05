# PageHaven - System Design

## High-Level Architecture

```mermaid
flowchart TB
    subgraph CLIENTS["👤 Clients"]
        BROWSER[Web Browser]
        CLI[CLI Tool]
    end

    subgraph CLOUDFLARE["☁️ Cloudflare Edge"]
        subgraph WORKERS["Workers Runtime"]
            WEB_WORKER[Web App Worker<br/>React SPA]
            API_WORKER[API Server Worker<br/>Hono + oRPC]
            STATIC_WORKER[Static Site Worker<br/>Content Serving]
        end

        D1[(D1 Database<br/>SQLite)]
        R2[(R2 Storage<br/>Site Files)]
        KV[(KV Store<br/>Cache)]
    end

    BROWSER --> WEB_WORKER
    BROWSER --> STATIC_WORKER
    CLI --> API_WORKER

    WEB_WORKER <--> |oRPC| API_WORKER
    API_WORKER <--> D1
    API_WORKER <--> R2
    API_WORKER <--> KV
    STATIC_WORKER <--> R2
    STATIC_WORKER <--> KV
    STATIC_WORKER <--> D1
```

## Detailed Component Architecture

```mermaid
flowchart TB
    subgraph FRONTEND["🖥️ Frontend (apps/web)"]
        direction TB
        REACT[React 19]
        ROUTER[TanStack Router<br/>File-based routing]
        QUERY[TanStack Query<br/>Server state]
        UI[shadcn/ui + Tailwind<br/>Components]

        REACT --> ROUTER
        REACT --> QUERY
        REACT --> UI
    end

    subgraph API_LAYER["🔌 API Layer (packages/api)"]
        direction TB
        ORPC[oRPC<br/>Type-safe RPC]

        subgraph ROUTERS["Routers"]
            SITE_R[Site Router]
            DEPLOY_R[Deployment Router]
            UPLOAD_R[Upload Router]
            ACCESS_R[Access Router]
            DOMAIN_R[Domain Router]
            ANALYTICS_R[Analytics Router]
        end

        ORPC --> ROUTERS
    end

    subgraph BACKEND["⚙️ Backend (apps/server)"]
        direction TB
        HONO[Hono<br/>HTTP Framework]
        AUTH[Better-Auth<br/>Authentication]
        MIDDLEWARE[Middleware<br/>CORS, Auth, Logging]

        HONO --> MIDDLEWARE
        MIDDLEWARE --> AUTH
    end

    subgraph DATA["💾 Data Layer (packages/db)"]
        direction TB
        DRIZZLE[Drizzle ORM]
        SCHEMA[Schema Definitions]
        MIGRATIONS[Migrations]

        DRIZZLE --> SCHEMA
        DRIZZLE --> MIGRATIONS
    end

    subgraph STORAGE["📦 Storage"]
        D1_DB[(Cloudflare D1<br/>SQLite)]
        R2_BUCKET[(Cloudflare R2<br/>Object Storage)]
    end

    FRONTEND <--> |HTTP/oRPC| API_LAYER
    API_LAYER <--> BACKEND
    BACKEND <--> AUTH
    BACKEND <--> DATA
    DATA <--> D1_DB
    API_LAYER <--> R2_BUCKET
```

## Request Flow - Site Deployment

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web App
    participant A as API Server
    participant DB as D1 Database
    participant R2 as R2 Storage

    U->>W: Upload files
    W->>A: POST /upload/getUploadUrl
    A->>A: Validate session & permissions
    A->>R2: Generate presigned URL
    R2-->>A: Presigned URL
    A-->>W: Upload URL + deployment ID

    W->>R2: PUT files directly
    R2-->>W: Upload complete

    W->>A: POST /upload/confirmUpload
    A->>DB: Create deployment record
    A->>DB: Update site.activeDeploymentId
    A-->>W: Deployment live

    U->>W: View site
    W-->>U: Redirect to subdomain.pagehaven.dev
```

## Request Flow - Static Site Serving

```mermaid
sequenceDiagram
    participant V as Visitor
    participant SW as Static Worker
    participant KV as KV Cache
    participant DB as D1 Database
    participant R2 as R2 Storage

    V->>SW: GET mysite.pagehaven.dev/page.html

    SW->>KV: Check cache for site config
    alt Cache hit
        KV-->>SW: Site config (access type, deployment)
    else Cache miss
        SW->>DB: Query site by subdomain
        DB-->>SW: Site record
        SW->>KV: Cache site config
    end

    alt Public site
        SW->>R2: Fetch /deployments/{id}/page.html
        R2-->>SW: File content
        SW-->>V: 200 OK + content
    else Password protected
        SW-->>V: 401 + password form
        V->>SW: POST password
        SW->>SW: Verify password hash
        SW-->>V: Set cookie + redirect
    else Private site
        SW-->>V: 401 + login redirect
    end
```

## Monorepo Structure

```mermaid
flowchart TB
    subgraph REPO["📁 pagehaven/"]
        subgraph APPS["apps/"]
            WEB["web/<br/>React Frontend"]
            SERVER["server/<br/>Hono API"]
            STATIC["static/<br/>Site Serving"]
        end

        subgraph PACKAGES["packages/"]
            API["api/<br/>oRPC Routers"]
            AUTH["auth/<br/>Better-Auth Config"]
            DB["db/<br/>Drizzle Schema"]
            CLI_PKG["cli/<br/>Deploy CLI"]
            CONFIG["config/<br/>Shared TSConfig"]
            INFRA["infra/<br/>Alchemy IaC"]
        end

        subgraph TOOLING["Root Config"]
            TURBO[turbo.json<br/>Build orchestration]
            BIOME[biome.json<br/>Lint & format]
            VITEST[vitest.config.ts<br/>Unit tests]
            PLAYWRIGHT[playwright.config.ts<br/>E2E tests]
        end
    end

    WEB --> API
    WEB --> AUTH
    SERVER --> API
    SERVER --> AUTH
    SERVER --> DB
    STATIC --> DB
    API --> DB
    API --> AUTH
```

## Technology Stack

```mermaid
mindmap
    root((PageHaven))
        Frontend
            React 19
            TanStack Router
            TanStack Query
            TailwindCSS
            shadcn/ui
            Lucide Icons
        Backend
            Hono
            oRPC
            Better-Auth
            Zod
        Database
            Drizzle ORM
            SQLite / D1
        Storage
            Cloudflare R2
            KV Cache
        Infrastructure
            Cloudflare Workers
            Alchemy IaC
            Turborepo
        Tooling
            Bun
            TypeScript
            Biome
            Vitest
            Playwright
            Husky
```

## Deployment Pipeline

```mermaid
flowchart LR
    subgraph DEV["Development"]
        CODE[Code Changes]
        LINT[Biome Check]
        TEST[Vitest + Playwright]
    end

    subgraph CI["CI/CD"]
        HUSKY[Husky Pre-commit]
        TURBO[Turbo Build]
        TYPES[Type Check]
    end

    subgraph DEPLOY["Deployment"]
        ALCHEMY[Alchemy]
        CF[Cloudflare Workers]
    end

    CODE --> HUSKY
    HUSKY --> LINT
    LINT --> TEST
    TEST --> TURBO
    TURBO --> TYPES
    TYPES --> ALCHEMY
    ALCHEMY --> CF
```

## Data Flow Overview

```mermaid
flowchart LR
    subgraph INPUT["Input"]
        USER_ACTION[User Action]
        FILE_UPLOAD[File Upload]
        VISITOR_REQ[Visitor Request]
    end

    subgraph PROCESS["Processing"]
        AUTH_CHECK{Auth Check}
        PERM_CHECK{Permission Check}
        BUSINESS[Business Logic]
    end

    subgraph OUTPUT["Output"]
        DB_WRITE[(Database Write)]
        R2_WRITE[(R2 Storage)]
        RESPONSE[HTTP Response]
    end

    USER_ACTION --> AUTH_CHECK
    FILE_UPLOAD --> AUTH_CHECK
    VISITOR_REQ --> AUTH_CHECK

    AUTH_CHECK -->|Authenticated| PERM_CHECK
    AUTH_CHECK -->|Public| BUSINESS
    AUTH_CHECK -->|Denied| RESPONSE

    PERM_CHECK -->|Allowed| BUSINESS
    PERM_CHECK -->|Denied| RESPONSE

    BUSINESS --> DB_WRITE
    BUSINESS --> R2_WRITE
    BUSINESS --> RESPONSE
```

## Security Model

```mermaid
flowchart TB
    subgraph AUTH_LAYER["Authentication Layer"]
        SESSION[Session Token<br/>HTTP-only Cookie]
        OAUTH[OAuth Providers<br/>GitHub, Google]
        CREDENTIALS[Email/Password<br/>Hashed with Argon2]
    end

    subgraph AUTHZ_LAYER["Authorization Layer"]
        ROLE_CHECK[Role-based Access<br/>owner > admin > editor > viewer]
        SITE_ACCESS[Site Visibility<br/>public, password, private, owner_only]
    end

    subgraph PROTECTION["Protection"]
        CORS[CORS Policy]
        CSRF[CSRF Protection]
        RATE_LIMIT[Rate Limiting]
        INPUT_VAL[Input Validation<br/>Zod Schemas]
    end

    AUTH_LAYER --> AUTHZ_LAYER
    AUTHZ_LAYER --> PROTECTION
```
