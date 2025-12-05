# CPD Cleanup - Agent 5

Assigned duplications (largest first, ~1400 tokens total):

## Clone 1 (83 tokens)
**Files:** `apps/static/src/index.ts` [27:3-35:2] ↔ `packages/api/src/lib/serve-static.ts` [216:5-224:37]
**Action:** Extract shared static file serving logic to common utility.

## Clone 2 (83 tokens)
**Files:** `packages/api/src/lib/api-key-auth.ts` [26:4-34:4] ↔ `packages/api/src/lib/password.ts` [8:9-14:7]
**Action:** Extract shared hashing/crypto utility.

## Clone 3 (82 tokens)
**Files:** `packages/api/src/routers/deployment.ts` [165:9-172:50] ↔ `packages/api/src/routers/upload.ts` [139:22-146:37]
**Action:** Extract shared deployment/upload response handling.

## Clone 4 (82 tokens)
**Files:** `packages/api/src/integration.test.ts` [234:2-239:6] ↔ `packages/api/src/integration.test.ts` [225:2-230:5]
**Action:** Extract repeated integration test pattern.

## Clone 5 (82 tokens)
**Files:** `apps/web/src/routes/sites/index.test.tsx` [71:2-78:21] ↔ `apps/web/src/routes/sites/$siteId/settings.test.tsx` [96:15-101:15]
**Action:** Extract shared sites test assertion.

## Clone 6 (82 tokens)
**Files:** `apps/web/src/routes/sites/$siteId/index.test.tsx` [298:9-308:16] ↔ `apps/web/src/routes/sites/$siteId/index.test.tsx` [280:7-290:20]
**Action:** Extract repeated site index test pattern.

## Clone 7 (82 tokens)
**Files:** `apps/web/src/routes/sites/$siteId/index.test.tsx` [316:13-326:14] ↔ `apps/web/src/routes/sites/$siteId/index.test.tsx` [280:7-290:20]
**Action:** Same as Clone 6 - consolidate patterns.

## Clone 8 (82 tokens)
**Files:** `apps/web/src/components/sign-in-form.test.tsx` [89:17-99:17] ↔ `apps/web/src/components/sign-up-form.test.tsx` [112:17-122:17]
**Action:** Extract shared sign-in/sign-up form test pattern.

## Clone 9 (81 tokens)
**Files:** `apps/web/src/components/user-menu.test.tsx` [165:39-175:6] ↔ `apps/web/src/components/user-menu.test.tsx` [149:22-158:2]
**Action:** Extract repeated user menu test pattern.

## Clone 10 (80 tokens)
**Files:** `apps/web/src/components/sign-in-form.tsx` [47:9-61:3] ↔ `apps/web/src/components/sign-up-form.tsx` [49:9-63:3]
**Action:** Extract shared form submission logic.

## Clone 11 (79 tokens)
**Files:** `apps/web/src/components/settings/sessions-manager.test.tsx` [80:7-89:44] ↔ `apps/web/src/components/settings/sessions-manager.test.tsx` [67:7-75:18]
**Action:** Extract repeated sessions manager test setup.

## Clone 12 (79 tokens)
**Files:** `apps/web/src/components/settings/profile-form.test.tsx` [6:1-17:11] ↔ `apps/web/src/components/settings/sessions-manager.test.tsx` [5:1-16:13]
**Action:** Extract shared settings test imports.

## Clone 13 (79 tokens)
**Files:** `apps/web/src/components/sign-up-form.test.tsx` [18:1-29:11] ↔ `apps/web/src/components/settings/sessions-manager.test.tsx` [5:1-16:13]
**Action:** Extract shared test imports/setup.

## Clone 14 (78 tokens)
**Files:** `packages/api/src/exploratory.test.ts` [18:7-24:54] ↔ `packages/api/src/regression.test.ts` [48:7-53:2]
**Action:** Extract shared exploratory/regression test pattern.

## Clone 15 (78 tokens)
**Files:** `apps/web/src/components/settings/profile-form.test.tsx` [203:12-213:5] ↔ `apps/web/src/components/settings/profile-form.test.tsx` [138:11-148:6]
**Action:** Extract repeated profile form test pattern.

## Clone 16 (77 tokens)
**Files:** `apps/web/src/components/settings/sessions-manager.test.tsx` [95:7-103:17] ↔ `apps/web/src/components/settings/sessions-manager.test.tsx` [67:7-75:18]
**Action:** Extract repeated sessions manager test pattern.

## Clone 17 (77 tokens)
**Files:** `apps/web/src/components/settings/sessions-manager.test.tsx` [110:7-118:10] ↔ `apps/web/src/components/settings/sessions-manager.test.tsx` [67:7-75:18]
**Action:** Same as Clone 16 - consolidate patterns.

## Clone 18 (79 tokens)
**Files:** `apps/web/src/components/settings/sessions-manager.test.tsx` [125:7-134:27] ↔ `apps/web/src/components/settings/sessions-manager.test.tsx` [67:7-75:18]
**Action:** Same as Clone 16 - consolidate patterns.

## Clone 19 (75 tokens)
**Files:** `apps/web/src/components/mode-toggle.test.tsx` [99:8-108:7] ↔ `apps/web/src/components/mode-toggle.test.tsx` [76:7-85:8]
**Action:** Extract repeated mode toggle test pattern.

## Clone 20 (74 tokens)
**Files:** `packages/api/src/routers/access.ts` [169:2-176:48] ↔ `packages/api/src/routers/api-key.ts` [46:2-53:6]
**Action:** Extract shared access/api-key validation logic.

## Clone 21 (69 tokens)
**Files:** `apps/web/src/components/sign-up-form.test.tsx` [216:7-223:7] ↔ `apps/web/src/test/test-utils.tsx` [143:3-146:6]
**Action:** Use test-utils consistently instead of duplicating.

## Clone 22 (69 tokens)
**Files:** `apps/web/src/components/mode-toggle.test.tsx` [80:7-86:2] ↔ `apps/web/src/components/mode-toggle.test.tsx` [55:7-61:7]
**Action:** Extract repeated mode toggle test pattern.

---
**Total: ~1732 tokens across 22 clones (includes smaller ones to balance workload)**
