# Future Tools Plan

## Current Stack
- **Linting/Formatting**: Biome (via Ultracite)
- **Dead Code**: Knip

## Implemented Tools

### Phase 1: Copy-Paste Detection ✅
- [x] **jscpd** — Copy-paste/duplication detection
  - Config: `.jscpd.json`
  - Run: `bun run cpd`
  - Threshold: 15% (current: ~12%)

### Phase 2: Testing ✅
- [x] **Vitest** — Unit testing with v8 coverage (LCOV output)
  - Config: `vitest.config.ts`
  - Run: `bun run test` or `bun run test:coverage`
  - Coverage output: `coverage/lcov.info`

### Phase 3: CI Integration ✅
- [x] **SonarCloud** — Code smells, security, complexity metrics
  - Config: `sonar-project.properties`
  - CI: `.github/workflows/ci.yml`
  - **Setup required**:
    1. Create project at sonarcloud.io
    2. Update `sonar.organization` and `sonar.projectKey` in `sonar-project.properties`
    3. Add `SONAR_TOKEN` secret to GitHub repository

## Commands
```bash
bun run test           # Run tests
bun run test:coverage  # Run tests with coverage
bun run cpd            # Check for code duplication
bunx ultracite check   # Lint check
bunx ultracite fix     # Lint fix
```
