# Jest Coverage Configuration Guide

**Purpose**: Ensure coverage reports are generated in CI/CD for automated quality gates

**Status**: ✅ Production-Ready Configuration

---

## Overview

The release workflow requires `coverage/coverage-summary.json` to validate coverage thresholds. This guide ensures your Jest configuration generates the correct report format.

---

## Required Jest Configuration

### Minimal Required Setup

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageReporters: ['json-summary', 'lcov', 'text'],
  // ... other config
};
```

### Comprehensive Production Setup

```javascript
// jest.config.js
const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/*.test.{ts,tsx}'
  ],
  
  // IMPORTANT: Include 'json-summary' reporter
  coverageReporters: [
    'text',           // Terminal output
    'json-summary',   // JSON summary for CI/CD parsing
    'lcov',           // HTML report
    'html',           // Visual report
  ],
  
  // Set thresholds that match release requirements
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 95,        // Match release requirement
      statements: 95
    }
  },
  
  // Other settings
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  passWithNoTests: true
};

module.exports = config;
```

---

## Coverage Report Location

### Generated Files

When `pnpm test -- --coverage` runs, Jest generates:

```
coverage/
├── coverage-summary.json      ✅ Used by CI/CD gates
├── lcov.info                  ✅ For code coverage services
├── index.html                 ✅ Visual coverage report
└── (source code with coverage)
```

### CI/CD Expects

**File**: `coverage/coverage-summary.json`
**Format**: JSON
**Required Fields**:
```json
{
  "total": {
    "lines": { "pct": 95.5 },
    "statements": { "pct": 95.5 },
    "functions": { "pct": 90.0 },
    "branches": { "pct": 85.0 }
  }
}
```

---

## Running Coverage Reports

### Local Development

```bash
# Generate coverage report
pnpm test -- --coverage

# View HTML report
open coverage/index.html
```

### CI/CD (Automated)

```bash
pnpm test -- --coverage
# Workflow automatically parses coverage/coverage-summary.json
# Enforces ≥95% coverage threshold
```

---

## Verification Checklist

- [x] Jest configured with `collectCoverage: true`
- [x] `coverageReporters` includes `json-summary`
- [x] Coverage threshold set to ≥95% (matches release requirement)
- [x] `collectCoverageFrom` excludes node_modules
- [x] Test files excluded from coverage
- [x] HTML report generated for visual inspection
- [x] Coverage directory in .gitignore (optional, recommended)

---

## Troubleshooting

### Issue: `coverage/coverage-summary.json` not found

**Solution**:
1. Verify `collectCoverage: true` in jest.config.js
2. Verify `json-summary` in `coverageReporters`
3. Run: `pnpm test -- --coverage --verbose`
4. Check for test errors preventing coverage generation

### Issue: Coverage percentage lower than expected

**Solution**:
1. Check `collectCoverageFrom` includes all source files
2. Run: `pnpm test -- --coverage --verbose`
3. Review HTML report: `open coverage/index.html`
4. Add tests for uncovered lines

### Issue: Workflow coverage gate fails

**Solution**:
1. Run `pnpm test -- --coverage` locally
2. Check `coverage/coverage-summary.json` exists
3. Extract coverage: `cat coverage/coverage-summary.json | jq '.total.lines.pct'`
4. Compare with 95% threshold requirement

---

## Integration with Release Workflow

### Workflow Step

```yaml
- name: Run tests with coverage
  run: pnpm test -- --coverage

- name: Check coverage thresholds
  run: |
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    echo "Test coverage: $COVERAGE%"
    if (( $(echo "$COVERAGE < 95" | bc -l) )); then
      echo "❌ Coverage below 95% threshold"
      exit 1
    fi
```

### Requirements

- Jest configured correctly ✅
- `pnpm test -- --coverage` generates report ✅
- CI can read and parse JSON ✅
- Threshold check passes ✅

---

## Best Practices

1. **Set thresholds**: Match release requirement (95%)
2. **Generate HTML**: Keep visual reports for team review
3. **Exclude boilerplate**: Don't count generated code
4. **Test important paths**: Focus on business logic
5. **Monitor trends**: Use codecov or similar services
6. **Document coverage**: Include in pull request descriptions

---

## References

- [Jest Coverage Documentation](https://jestjs.io/docs/coverage)
- [ts-jest Configuration](https://kulshekhar.github.io/ts-jest/)
- [Coverage Reporters](https://jestjs.io/docs/configuration#coveragereporters-arraystring)

---

**Status**: ✅ Configuration verified and production-ready
**Last Updated**: October 23, 2024
