# CPD Cleanup Plan Overview

**Total clones found:** 69
**Total duplicated tokens:** ~6,806

## Agent Assignments

| Agent | Clones | Est. Tokens | Primary Focus                                         |
| ----- | ------ | ----------- | ----------------------------------------------------- |
| 1     | 8      | ~1,168      | Test utilities, API key logic, mock-db                |
| 2     | 11     | ~1,325      | Dashboard/sites tests, GitHub router, user-menu tests |
| 3     | 13     | ~1,383      | Profile form tests, settings tests, sign-in/up forms  |
| 4     | 15     | ~1,298      | Analytics tests, deploy tests, tabs/dropdown tests    |
| 5     | 22     | ~1,632      | Static serving, crypto utils, smaller patterns        |

## Common Refactoring Strategies

1. **Test Setup Duplication** - Extract to `apps/web/src/test/test-utils.tsx` or create new utilities
2. **Mock DB Patterns** - Consolidate in `packages/api/src/test-utils/mock-db.ts`
3. **Form Components** - Extract shared form field components/hooks
4. **Router Logic** - Extract shared validation/response handling utilities
5. **Crypto/Auth** - Create shared utility in `packages/utils`

## Coordination Notes

- **Agent 1 & 2** may both touch `user-menu.test.tsx` - coordinate on test utility extraction
- **Agent 3 & 5** both have sign-in/sign-up form clones - one handles `.tsx`, other handles `.test.tsx`
- **Agent 4 & 5** both have sessions-manager patterns - Agent 4 handles larger, Agent 5 handles smaller

## Verification

After cleanup, run:
```bash
bun cpd
bun check-types
bun test
```

Target: Reduce duplicated tokens from 6,806 to <2,000
