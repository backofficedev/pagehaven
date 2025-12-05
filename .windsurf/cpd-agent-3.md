# CPD Cleanup - Agent 3

Assigned duplications (largest first, ~1400 tokens total):

## Clone 1 (112 tokens)
**Files:** `apps/web/src/components/settings/profile-form.test.tsx` [208:7-221:6] ↔ `apps/web/src/components/settings/profile-form.test.tsx` [182:10-195:11]
**Action:** Extract repeated profile form test assertion pattern.

## Clone 2 (109 tokens)
**Files:** `apps/web/src/components/header.test.tsx` [24:1-37:20] ↔ `apps/web/src/components/ui/sonner.test.tsx` [6:1-19:39]
**Action:** Extract shared test setup/mocks to common utility.

## Clone 3 (104 tokens)
**Files:** `apps/web/src/routes/sites/$siteId/settings.test.tsx` [548:5-559:21] ↔ `apps/web/src/routes/sites/$siteId/settings.test.tsx` [331:5-341:10]
**Action:** Extract repeated settings test pattern into helper.

## Clone 4 (102 tokens)
**Files:** `apps/web/src/routes/sites/$siteId/analytics.test.tsx` [26:2-38:15] ↔ `apps/web/src/routes/sites/$siteId/index.test.tsx` [31:11-42:17]
**Action:** Extract shared site route test setup.

## Clone 5 (100 tokens)
**Files:** `apps/web/src/routes/sites/$siteId/settings.test.tsx` [581:7-592:45] ↔ `apps/web/src/routes/sites/$siteId/settings.test.tsx` [308:7-318:64]
**Action:** Extract repeated settings assertion pattern.

## Clone 6 (99 tokens)
**Files:** `apps/web/src/components/ui/dropdown-menu.test.tsx` [260:13-274:11] ↔ `apps/web/src/components/ui/dropdown-menu.test.tsx` [231:2-245:11]
**Action:** Extract repeated dropdown menu test pattern.

## Clone 7 (98 tokens)
**Files:** `apps/web/src/routes/gate/login.test.tsx` [10:2-21:5] ↔ `apps/web/src/routes/gate/password.test.tsx` [9:6-20:2]
**Action:** Extract shared gate test setup.

## Clone 8 (97 tokens)
**Files:** `apps/web/src/components/user-menu.test.tsx` [193:7-202:13] ↔ `apps/web/src/components/user-menu.test.tsx` [113:7-122:11]
**Action:** Extract repeated user menu test pattern.

## Clone 9 (93 tokens)
**Files:** `apps/web/src/routes/sites/$siteId/analytics.test.tsx` [35:2-48:10] ↔ `apps/web/src/routes/sites/$siteId/index.test.tsx` [44:15-57:11]
**Action:** Extract shared site route test assertions.

## Clone 10 (93 tokens)
**Files:** `apps/web/src/components/settings/profile-form.test.tsx` [165:11-176:6] ↔ `apps/web/src/components/settings/profile-form.test.tsx` [140:2-151:8]
**Action:** Extract repeated profile form test pattern.

## Clone 11 (93 tokens)
**Files:** `apps/web/src/components/sign-in-form.tsx` [33:9-45:8] ↔ `apps/web/src/components/sign-up-form.tsx` [34:9-46:7]
**Action:** Extract shared form field component or hook.

## Clone 12 (92 tokens)
**Files:** `apps/web/src/routes/dashboard.test.tsx` [272:7-288:16] ↔ `apps/web/src/routes/sites/index.test.tsx` [276:7-292:16]
**Action:** Extract shared dashboard/sites test pattern.

## Clone 13 (91 tokens)
**Files:** `apps/web/src/routes/sites/index.tsx` [75:13-84:16] ↔ `apps/web/src/routes/sites/$siteId/settings.tsx` [190:12-199:8]
**Action:** Extract shared UI component or pattern.

---
**Total: ~1383 tokens across 13 clones**
