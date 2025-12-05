# CPD Cleanup - Agent 1

Assigned duplications (largest first, ~1400 tokens total):

## Clone 1 (168 tokens)
**Files:** `apps/web/src/test/ui-mocks.tsx` [43:2-61:2] ↔ `apps/web/src/routes/sites/$siteId/settings.test.tsx` [42:2-60:2]
**Action:** Extract shared mock setup to a common test utility.

## Clone 2 (160 tokens)
**Files:** `apps/web/src/components/mode-toggle.test.tsx` [115:7-131:9] ↔ `apps/web/src/components/mode-toggle.test.tsx` [92:7-85:8]
**Action:** Extract repeated test pattern into helper function within the same file.

## Clone 3 (151 tokens)
**Files:** `apps/web/src/components/mode-toggle.test.tsx` [7:1-25:31] ↔ `apps/web/src/components/ui/sonner.test.tsx` [6:1-24:28]
**Action:** Extract shared test setup/imports to common test utilities.

## Clone 4 (146 tokens)
**Files:** `packages/api/src/routers/api-key.ts` [113:7-129:6] ↔ `packages/api/src/routers/api-key.ts` [86:2-101:6]
**Action:** Extract duplicated API key logic into a shared helper function.

## Clone 5 (143 tokens)
**Files:** `packages/api/src/routers/domain.test.ts` [15:2-30:2] ↔ `packages/api/src/test-utils/mock-db.ts` [42:2-57:6]
**Action:** Consolidate mock DB setup - use the mock-db utility consistently.

## Clone 6 (136 tokens)
**Files:** `apps/web/src/components/settings/profile-form.test.tsx` [235:11-251:6] ↔ `apps/web/src/components/settings/profile-form.test.tsx` [205:2-221:8]
**Action:** Extract repeated test assertion pattern into helper.

## Clone 7 (132 tokens)
**Files:** `apps/web/src/routes/sites/$siteId/deploy.test.tsx` [43:12-55:11] ↔ `apps/web/src/routes/sites/$siteId/settings.test.tsx` [93:7-105:5]
**Action:** Extract shared site test setup to common fixture.

## Clone 8 (132 tokens)
**Files:** `apps/web/src/routes/sites/index.test.tsx` [33:16-44:2] ↔ `apps/web/src/routes/sites/$siteId/settings.test.tsx` [60:2-70:14]
**Action:** Extract shared test wrapper/setup to common utility.

---
**Total: ~1168 tokens across 8 clones**
