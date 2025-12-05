# CPD Cleanup - Agent 2

Assigned duplications (largest first, ~1400 tokens total):

## Clone 1 (128 tokens)
**Files:** `apps/web/src/routes/dashboard.test.tsx` [37:20-53:13] ↔ `apps/web/src/routes/sites/index.test.tsx` [43:2-59:4]
**Action:** Extract shared dashboard/sites test setup to common fixture.

## Clone 2 (123 tokens)
**Files:** `packages/api/src/routers/github.ts` [261:2-277:9] ↔ `packages/api/src/routers/github.ts` [221:3-237:6]
**Action:** Extract duplicated GitHub API logic into shared helper function.

## Clone 3 (123 tokens)
**Files:** `apps/web/src/routes/gate/denied.test.tsx` [7:2-22:2] ↔ `apps/web/src/routes/gate/login.test.tsx` [10:2-25:7]
**Action:** Extract shared gate test setup to common utility.

## Clone 4 (123 tokens)
**Files:** `apps/web/src/routes/sites/$siteId/analytics.test.tsx` [10:1-23:4] ↔ `apps/web/src/routes/sites/$siteId/index.test.tsx` [7:1-20:10]
**Action:** Extract shared site route test imports/setup.

## Clone 5 (122 tokens)
**Files:** `apps/web/src/routes/dashboard.test.tsx` [64:13-78:2] ↔ `apps/web/src/routes/sites/index.test.tsx` [76:10-90:7]
**Action:** Extract shared rendering/assertion pattern.

## Clone 6 (121 tokens)
**Files:** `apps/web/src/components/user-menu.test.tsx` [129:7-140:19] ↔ `apps/web/src/components/user-menu.test.tsx` [113:7-124:13]
**Action:** Extract repeated user menu test pattern into helper.

## Clone 7 (121 tokens)
**Files:** `apps/web/src/components/user-menu.test.tsx` [145:7-156:11] ↔ `apps/web/src/components/user-menu.test.tsx` [113:7-124:13]
**Action:** Same as above - consolidate with Clone 6.

## Clone 8 (118 tokens)
**Files:** `apps/web/src/components/header.test.tsx` [4:1-19:10] ↔ `apps/web/src/components/user-menu.test.tsx` [5:1-20:2]
**Action:** Extract shared header/user-menu test setup.

## Clone 9 (116 tokens)
**Files:** `packages/api/src/routers/analytics.test.ts` [16:2-29:2] ↔ `packages/api/src/test-utils/mock-db.ts` [41:2-54:7]
**Action:** Use mock-db utility consistently instead of duplicating.

## Clone 10 (115 tokens)
**Files:** `apps/web/src/routes/sites/$siteId/analytics.test.tsx` [213:7-224:20] ↔ `apps/web/src/routes/sites/$siteId/analytics.test.tsx` [196:7-208:29]
**Action:** Extract repeated analytics test assertion pattern.

## Clone 11 (115 tokens)
**Files:** `apps/web/src/components/user-menu.test.tsx` [209:7-220:6] ↔ `apps/web/src/components/user-menu.test.tsx` [113:7-204:7]
**Action:** Consolidate user menu test patterns.

---
**Total: ~1325 tokens across 11 clones**
