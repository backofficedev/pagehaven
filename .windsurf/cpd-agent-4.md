# CPD Cleanup - Agent 4

Assigned duplications (largest first, ~1400 tokens total):

## Clone 1 (90 tokens)
**Files:** `packages/api/src/routers/analytics.test.ts` [372:7-385:13] ↔ `packages/api/src/routers/analytics.test.ts` [328:7-341:13]
**Action:** Extract repeated analytics test assertion pattern.

## Clone 2 (90 tokens)
**Files:** `apps/web/src/components/settings/sessions-manager.test.tsx` [155:7-164:29] ↔ `apps/web/src/components/settings/sessions-manager.test.tsx` [140:7-149:9]
**Action:** Extract repeated sessions manager test pattern.

## Clone 3 (90 tokens)
**Files:** `apps/web/src/components/sign-in-form.test.tsx` [149:17-158:10] ↔ `apps/web/src/components/sign-up-form.test.tsx` [174:12-183:10]
**Action:** Extract shared sign-in/sign-up form test pattern.

## Clone 4 (89 tokens)
**Files:** `apps/web/src/routes/sites/index.test.tsx` [44:2-55:13] ↔ `apps/web/src/routes/sites/$siteId/settings.test.tsx` [70:2-81:3]
**Action:** Extract shared sites test setup.

## Clone 5 (87 tokens)
**Files:** `packages/api/src/routers/upload.test.ts` [19:2-28:2] ↔ `packages/api/src/routers/upload.ts` [72:7-82:2]
**Action:** Extract shared upload validation logic.

## Clone 6 (89 tokens)
**Files:** `packages/api/src/routers/site.test.ts` [122:2-127:2] ↔ `packages/api/src/routers/site.ts` [129:7-135:2]
**Action:** Extract shared site validation logic.

## Clone 7 (86 tokens)
**Files:** `packages/api/src/routers/analytics.test.ts` [4:22-13:8] ↔ `packages/api/src/routers/domain.test.ts` [7:65-16:2]
**Action:** Extract shared test imports/setup.

## Clone 8 (86 tokens)
**Files:** `packages/utils/src/format.test.ts` [5:3-13:33] ↔ `packages/cli/src/commands/deploy.test.ts` [405:5-413:33]
**Action:** Extract shared format test utilities.

## Clone 9 (86 tokens)
**Files:** `apps/web/src/components/header.test.tsx` [35:2-49:31] ↔ `apps/web/src/components/user-menu.test.tsx` [20:2-34:36]
**Action:** Extract shared header/user-menu test setup.

## Clone 10 (85 tokens)
**Files:** `packages/api/src/routers/deployment.ts` [46:4-54:7] ↔ `packages/api/src/routers/upload.ts` [118:20-127:6]
**Action:** Extract shared deployment/upload validation logic.

## Clone 11 (84 tokens)
**Files:** `packages/cli/src/commands/deploy.test.ts` [330:7-342:12] ↔ `packages/cli/src/commands/deploy.test.ts` [202:7-214:9]
**Action:** Extract repeated deploy test pattern.

## Clone 12 (84 tokens)
**Files:** `apps/web/src/routes/dashboard.test.tsx` [29:2-37:20] ↔ `apps/web/src/routes/sites/$siteId/settings.test.tsx` [59:2-67:2]
**Action:** Extract shared dashboard test setup.

## Clone 13 (84 tokens)
**Files:** `apps/web/src/routes/sites/$siteId/settings.test.tsx` [357:7-365:21] ↔ `apps/web/src/routes/sites/$siteId/settings.test.tsx` [332:7-339:10]
**Action:** Extract repeated settings test pattern.

## Clone 14 (84 tokens)
**Files:** `apps/web/src/components/ui/tabs.test.tsx` [118:7-127:7] ↔ `apps/web/src/components/ui/tabs.test.tsx` [23:7-32:2]
**Action:** Extract repeated tabs test pattern.

## Clone 15 (84 tokens)
**Files:** `apps/web/src/components/settings/change-password-form.test.tsx` [2:1-16:15] ↔ `apps/web/src/components/settings/sessions-manager.test.tsx` [2:1-16:13]
**Action:** Extract shared settings test imports/setup.

---
**Total: ~1298 tokens across 15 clones**
