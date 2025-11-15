# Instructions for LLMs Working on PageHaven

## Overview
PageHaven is a multi-tenant static-site hosting platform built with TanStack Start and Cloudflare.

## Critical Files to Reference

1. **[plan.md](plan.md)** - Complete specification and architecture
   - Full tech stack details
   - Database schema
   - Multi-tenant authorization model
   - API routes structure
   - Expected deliverables

2. **[development_log.md](development_log.md)** - What's been completed
   - Completed phases with dates
   - Current state of implementation
   - Known issues or deviations from plan

## Working Principles

### 🚨 Golden Rule: Keep the Site Working
- **Always test after changes**: Run `pnpm dev` to verify the app still works
- **Incremental progress**: Complete one phase at a time
- **Test before committing**: Ensure no breaking changes

### 📝 Documentation Requirements
**After completing ANY work, you MUST update [development_log.md](development_log.md):**
- Add date and phase completed
- List what was implemented/changed
- Note any deviations from plan.md
- Document what was tested

### 🔄 Development Workflow
1. Read plan.md to understand the feature/phase
2. Read development_log.md to see what's already done
3. Implement changes incrementally
4. Test with `pnpm dev`
5. **Update development_log.md** ✅
6. Commit if appropriate

## Project Structure

```
src/
├── db/
│   ├── schema.ts       # Drizzle database schema
│   ├── queries.ts      # Database query helpers
│   └── index.ts        # DB client
├── routes/
│   ├── __root.tsx      # Root layout
│   ├── index.tsx       # Landing page
│   ├── demo/           # Demo routes (can be removed later)
│   └── app/            # Protected dashboard routes (to be created)
├── integrations/
│   └── workos/         # WorkOS authentication
└── components/         # Shared UI components
```

## Common Commands

```bash
# Development
pnpm dev              # Start dev server on port 3000

# Database (Drizzle + SQLite)
pnpm db:generate      # Generate migration from schema changes
pnpm db:migrate       # Apply migrations to database
pnpm db:push          # Push schema directly (dev only)
pnpm db:studio        # Open Drizzle Studio

# Code Quality
pnpm lint             # Lint code
pnpm format           # Format code
pnpm check            # Check formatting and linting

# Production
pnpm build            # Build for production
pnpm deploy           # Deploy to Cloudflare (when configured)
```

## Tech Stack Reference

- **Framework**: TanStack Start v1 RC
- **Database**: SQLite via Drizzle ORM (dev), D1 (production)
- **Auth**: WorkOS
- **Styling**: Tailwind CSS + Shadcn UI
- **Deployment**: Cloudflare Workers (eventually)

## Phase-by-Phase Implementation

Follow the phases in plan.md sequentially:
1. Database Foundation
2. Authentication Flow
3. Dashboard Routes
4. Control Plane API
5. Content Management
6. Edge Worker for Static Sites
7. Domain Management
8. Production Cloudflare Setup

## Questions or Stuck?

- Review plan.md section 14 for full requirements
- Check development_log.md for implementation details
- Ensure WorkOS env vars are set in .env.local
- Test database with `pnpm db:studio`
