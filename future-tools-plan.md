# Future Tools Plan

## Current Stack
- **Linting/Formatting**: Biome (via Ultracite)
- **Dead Code**: Knip

## Planned Additions

### Phase 1: Now
- [ ] **jscpd** — Copy-paste/duplication detection
  ```bash
  bun add -D jscpd
  ```

### Phase 2: With Tests
- [ ] **Vitest** — Unit testing with v8 coverage (LCOV output)

### Phase 3: CI Integration
- [ ] **SonarCloud** — Code smells, security, complexity metrics
  - Reads Vitest LCOV coverage natively
  - Best TypeScript + monorepo support
