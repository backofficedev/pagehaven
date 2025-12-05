# PageHaven Roadmap

## Current Status

### Code Quality ✅
- **Biome**: All checks pass
- **Type Safety**: All type checks pass
- **Code Duplication**: 0% (jscpd)
- **Unused Code**: None (knip)
- **Total Tests**: 631 passing
- **Test Coverage**: 
  - Web: ~75% statements, ~71% branches
  - DB: ~40% statements (schema files have low coverage due to Drizzle ORM patterns)

### Implemented Features ✅
1. **Authentication** - Sign up, sign in, sign out, password reset
2. **Site Management** - Create, edit, delete sites
3. **File Upload & Deployment** - Upload files, deploy to R2
4. **Subdomain Hosting** - site.pagehaven.dev
5. **Access Control** - Public, password, private, owner-only
6. **Team Collaboration** - Invite members, role-based permissions
7. **Deployment History** - View history, promote deployments
8. **Analytics** - Views, visitors, bandwidth tracking
9. **Custom Domains** - Domain verification, DNS setup
10. **CLI** - Command-line deployment tool

### E2E Test Coverage ✅
- `auth.spec.ts` - Authentication flows
- `dashboard.spec.ts` - Dashboard functionality
- `sites.spec.ts` - Site management
- `deploy.spec.ts` - Basic deployment
- `deploy-advanced.spec.ts` - Advanced deployment scenarios
- `site-access-control.spec.ts` - Access control
- `analytics.spec.ts` - Analytics
- `settings.spec.ts` - Site settings
- `user-settings.spec.ts` - User settings
- `password-reset.spec.ts` - Password reset flow
- `home.spec.ts` - Home page

## Improvement Roadmap

### Phase 1: Test Coverage Improvements 🎯
**Goal**: Increase test coverage to 80%+

#### Progress
- ✅ Added settings.tsx tests (pending states, invite form, null values, radio selection)
- ✅ Added password gate error handling tests
- 🔄 In progress: deploy.tsx coverage improvement

#### Priority Areas (Low Coverage)
1. `apps/web/src/routes/sites/$siteId/deploy.tsx` - 24.28% → 80%
2. `apps/web/src/routes/sites/$siteId/settings.tsx` - 59.42% → 80%
3. `apps/web/src/routes/sites/index.tsx` - 90.9% ✅
4. `packages/db/src/schema/*.ts` - Schema validation tests

### Phase 2: Performance Optimizations 🚀
1. **Bundle Size Analysis** - Analyze and optimize bundle sizes
2. **Code Splitting** - Lazy load routes and components
3. **Image Optimization** - Add image optimization for uploaded assets
4. **Caching Strategy** - Implement proper cache headers for static assets

### Phase 3: Feature Enhancements 🌟
1. **GitHub Integration** - Deploy from GitHub repositories
2. **Preview Deployments** - Create preview URLs for branches
3. **Asset Optimization** - Minify CSS/JS, optimize images on upload
4. **Webhooks** - Notify external services on deployment events
5. **API Keys** - Allow programmatic access to API

### Phase 4: Developer Experience 🛠️
1. **API Documentation** - Generate OpenAPI docs from oRPC
2. **CLI Improvements** - Add more commands (rollback, logs, etc.)
3. **Local Development** - Improve local dev experience with hot reload

### Phase 5: Enterprise Features 💼
1. **Organizations** - Multi-tenant support
2. **Audit Logs** - Track all actions
3. **SSO/SAML** - Enterprise authentication
4. **Usage Quotas** - Bandwidth and storage limits

## Technical Debt

### Addressed ✅
- Biome-ignore comments reviewed and improved
- No barrel files in source code
- No code duplication
- No unused exports

### Remaining
- [ ] Consider extracting common test patterns into shared utilities
- [ ] Add error boundary components for better error handling
- [ ] Implement proper loading states with skeletons

## Metrics to Track
- Test coverage percentage
- Bundle size (KB)
- Lighthouse scores
- API response times
- Deployment success rate
