# QA Sentinel CI/CD Integration Guide

This guide covers the integration of QA Sentinel into CI/CD pipelines for automated quality assurance and regression prevention.

## Overview

QA Sentinel integrates seamlessly with popular CI/CD platforms including GitHub Actions, GitLab CI, and Jenkins. The integration provides:

- **Pre-merge validation gates**
- **Automated benchmark comparison**
- **Real-time anomaly detection**
- **Comprehensive audit trails**
- **Self-healing triggers**

## GitHub Actions Integration

### Basic Setup

Create `.github/workflows/qa-sentinel.yml`:

```yaml
name: QA Sentinel Validation

on:
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'core/**'
      - 'apps/**'
      - 'modules/**'

  push:
    branches: [ main ]

jobs:
  qa-sentinel-validation:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build QA Sentinel
        run: |
          cd core/qa-sentinel
          npm run build

      - name: Setup test database
        run: |
          npm run db:migrate
          npm run db:seed:test

      - name: Run QA Sentinel validation
        id: qa-validation
        run: |
          if [ "${{ github.event_name }}" = "pull_request" ]; then
            ./scripts/ci-cd/qa-sentinel-trigger.sh validate "${{ github.run_id }}" "${{ github.event.number }}"
          else
            ./scripts/ci-cd/qa-sentinel-trigger.sh full "${{ github.run_id }}"
          fi
        env:
          NODE_ENV: test
          CI: true
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/neonhub_test
          REDIS_URL: redis://localhost:6379
          QA_SENTINEL_ENABLED: true

      - name: Generate QA report
        if: always()
        run: |
          ./scripts/ci-cd/qa-sentinel-trigger.sh report

      - name: Upload QA artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: qa-sentinel-results-${{ github.run_id }}
          path: |
            logs/qa-sentinel-*.log
            reports/qa-sentinel-*.json
          retention-days: 30

      - name: Comment PR with QA results
        if: github.event_name == 'pull_request' && always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const path = require('path');

            const reportsDir = 'reports';
            const reportFiles = fs.readdirSync(reportsDir)
              .filter(file => file.startsWith('qa-sentinel-report-'))
              .sort()
              .reverse();

            if (reportFiles.length > 0) {
              const reportPath = path.join(reportsDir, reportFiles[0]);
              const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

              const comment = `
            ## 🤖 QA Sentinel Validation Results

            **Status:** ${report.status === 'success' ? '✅ Passed' : '❌ Failed'}

            ### Test Results
            - **Total Tests:** ${report.totalTests}
            - **Passed:** ${report.passedTests}
            - **Failed:** ${report.failedTests}
            - **Coverage:** ${report.coverage}%

            ### Quality Metrics
            - **Performance Score:** ${report.performanceScore}/100
            - **Anomalies Detected:** ${report.anomaliesDetected}

            ### Recommendations
            ${report.recommendations.map(rec => `- ${rec}`).join('\n')}

            [View detailed report](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})
              `;

              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            }

      - name: Fail build on QA failure
        if: steps.qa-validation.outcome == 'failure'
        run: |
          echo "QA Sentinel validation failed"
          exit 1
```

### Advanced Configuration

#### Parallel Testing

```yaml
jobs:
  qa-sentinel-validation:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test-type: [unit, integration, e2e]

    steps:
      - name: Run QA Sentinel ${{ matrix.test-type }} tests
        run: |
          ./scripts/ci-cd/qa-sentinel-trigger.sh ${{ matrix.test-type }} "${{ github.run_id }}"
```

#### Conditional Execution

```yaml
jobs:
  qa-sentinel-validation:
    runs-on: ubuntu-latest
    if: |
      github.event_name == 'pull_request' ||
      (github.event_name == 'push' && contains(github.event.head_commit.message, '[qa-skip]') == false)
```

#### Performance Regression Alerts

```yaml
performance-regression-alert:
  runs-on: ubuntu-latest
  needs: qa-sentinel-validation
  if: failure() && github.event_name == 'push'

  steps:
    - name: Create performance regression issue
      uses: actions/github-script@v7
      with:
        script: |
          github.rest.issues.create({
            owner: context.repo.owner,
            repo: context.repo.repo,
            title: '🚨 Performance Regression Detected',
            body: `Performance regression detected in ${{ github.sha }}`,
            labels: ['performance', 'regression', 'urgent']
          });
```

## GitLab CI Integration

### Basic .gitlab-ci.yml

```yaml
stages:
  - qa
  - deploy

qa-sentinel-validation:
  stage: qa
  image: node:20
  services:
    - postgres:15
    - redis:7-alpine
  variables:
    NODE_ENV: test
    CI: "true"
    QA_SENTINEL_ENABLED: "true"
    DATABASE_URL: "postgresql://postgres:postgres@postgres:5432/neonhub_test"
    REDIS_URL: "redis://redis:6379"
  before_script:
    - npm ci
    - cd core/qa-sentinel && npm run build
    - npm run db:migrate
    - npm run db:seed:test
  script:
    - |
      if [ "$CI_MERGE_REQUEST_IID" ]; then
        ./scripts/ci-cd/qa-sentinel-trigger.sh validate "$CI_JOB_ID" "$CI_MERGE_REQUEST_IID"
      else
        ./scripts/ci-cd/qa-sentinel-trigger.sh full "$CI_JOB_ID"
      fi
  artifacts:
    reports:
      junit: reports/junit-*.xml
    paths:
      - logs/
      - reports/
    expire_in: 1 week
  only:
    - merge_requests
    - main

qa-report-comment:
  stage: qa
  image: node:20
  script:
    - ./scripts/ci-cd/qa-sentinel-trigger.sh report
  dependencies:
    - qa-sentinel-validation
  only:
    - merge_requests
```

### GitLab MR Comments

```yaml
qa-comment:
  stage: qa
  image: node:20
  script:
    - apt-get update && apt-get install -y jq
    - |
      REPORT_FILE=$(ls reports/qa-sentinel-report-*.json | head -1)
      if [ -f "$REPORT_FILE" ]; then
        STATUS=$(jq -r '.status' "$REPORT_FILE")
        TESTS_TOTAL=$(jq -r '.totalTests' "$REPORT_FILE")
        TESTS_PASSED=$(jq -r '.passedTests' "$REPORT_FILE")
        COVERAGE=$(jq -r '.coverage' "$REPORT_FILE")

        BODY="## 🤖 QA Sentinel Results

**Status:** $STATUS
**Tests:** $TESTS_PASSED/$TESTS_TOTAL passed
**Coverage:** $COVERAGE%

[View Report]($CI_PROJECT_URL/-/jobs/$CI_JOB_ID/artifacts/browse)"

        curl -X POST \
          -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"body\": \"$BODY\"}" \
          "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests/$CI_MERGE_REQUEST_IID/notes"
      fi
  dependencies:
    - qa-sentinel-validation
  only:
    - merge_requests
```

## Jenkins Integration

### Jenkins Pipeline

```groovy
pipeline {
    agent any

    environment {
        NODE_ENV = 'test'
        CI = 'true'
        QA_SENTINEL_ENABLED = 'true'
        DATABASE_URL = credentials('neonhub-test-db-url')
        REDIS_URL = credentials('neonhub-redis-url')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup') {
            steps {
                sh 'npm ci'
                sh 'cd core/qa-sentinel && npm run build'
                sh 'npm run db:migrate'
                sh 'npm run db:seed:test'
            }
        }

        stage('QA Sentinel Validation') {
            steps {
                script {
                    def command = env.CHANGE_ID ?
                        "validate ${env.BUILD_NUMBER} ${env.CHANGE_ID}" :
                        "full ${env.BUILD_NUMBER}"

                    sh "./scripts/ci-cd/qa-sentinel-trigger.sh ${command}"
                }
            }
            post {
                always {
                    sh './scripts/ci-cd/qa-sentinel-trigger.sh report'
                    archiveArtifacts artifacts: 'logs/*.log, reports/*.json', fingerprint: true
                }
                failure {
                    script {
                        if (env.CHANGE_ID) {
                            pullRequest.comment('''
## 🤖 QA Sentinel Validation Failed

The QA Sentinel validation has failed. Please review the build artifacts for detailed results.

[View Build](${env.BUILD_URL})
                            ''')
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                allOf {
                    anyOf {
                        branch 'main'
                        tag pattern: 'v\\d+\\.\\d+\\.\\d+', comparator: 'REGEXP'
                    }
                    expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
                }
            }
            steps {
                // Deployment steps
            }
        }
    }

    post {
        always {
            sh './scripts/ci-cd/qa-sentinel-trigger.sh report'
            archiveArtifacts artifacts: 'logs/*.log, reports/*.json', allowEmptyArchive: true
        }
    }
}
```

## CircleCI Integration

### .circleci/config.yml

```yaml
version: 2.1

executors:
  node-executor:
    docker:
      - image: cimg/node:20
      - image: cimg/postgres:15
        environment:
          POSTGRES_PASSWORD: postgres
      - image: cimg/redis:7

commands:
  setup-qa-sentinel:
    steps:
      - checkout
      - run: npm ci
      - run:
          name: Build QA Sentinel
          command: cd core/qa-sentinel && npm run build
      - run: npm run db:migrate
      - run: npm run db:seed:test

workflows:
  qa-sentinel:
    jobs:
      - qa-validation:
          filters:
            branches:
              only: /.*/
      - qa-benchmark:
          requires:
            - qa-validation
          filters:
            branches:
              only: main

jobs:
  qa-validation:
    executor: node-executor
    environment:
      NODE_ENV: test
      CI: true
      QA_SENTINEL_ENABLED: true
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/neonhub_test
      REDIS_URL: redis://localhost:6379
    steps:
      - setup-qa-sentinel
      - run:
          name: Run QA Sentinel Validation
          command: |
            if [ -n "$CIRCLE_PULL_REQUEST" ]; then
              PR_NUMBER=$(echo $CIRCLE_PULL_REQUEST | sed 's/.*\/\([0-9]*\)$/\1/')
              ./scripts/ci-cd/qa-sentinel-trigger.sh validate "$CIRCLE_BUILD_NUM" "$PR_NUMBER"
            else
              ./scripts/ci-cd/qa-sentinel-trigger.sh full "$CIRCLE_BUILD_NUM"
            fi
      - run:
          name: Generate QA Report
          command: ./scripts/ci-cd/qa-sentinel-trigger.sh report
          when: always
      - store_artifacts:
          path: logs/
      - store_artifacts:
          path: reports/

  qa-benchmark:
    executor: node-executor
    environment:
      NODE_ENV: test
      CI: true
      QA_SENTINEL_ENABLED: true
    steps:
      - setup-qa-sentinel
      - run:
          name: Run Benchmark Comparison
          command: ./scripts/ci-cd/qa-sentinel-trigger.sh benchmark "$CIRCLE_SHA1"
      - store_artifacts:
          path: reports/benchmark-*.json
```

## Environment Variables

### Required Variables

```bash
# QA Sentinel Configuration
QA_SENTINEL_ENABLED=true
QA_SENTINEL_CI_MODE=true

# Build Context
QA_SENTINEL_BUILD_ID="build-123"
QA_SENTINEL_PIPELINE_ID="pipeline-456"
QA_SENTINEL_PR_NUMBER="789"

# Database and Cache
DATABASE_URL="postgresql://user:pass@localhost:5432/neonhub_test"
REDIS_URL="redis://localhost:6379"

# ML Configuration
QA_SENTINEL_ML_MODEL_PATH="./models/test-generator"
QA_SENTINEL_CONFIDENCE_THRESHOLD=0.85

# CI Platform Specific
GITHUB_SHA="abc123"          # GitHub Actions
GITLAB_OID="def456"          # GitLab CI
BUILD_ID="ghi789"            # Jenkins
CIRCLE_SHA1="jkl012"         # CircleCI
```

### Optional Variables

```bash
# Monitoring Configuration
QA_SENTINEL_MONITORING_INTERVAL=30000
QA_SENTINEL_ALERT_ERROR_RATE=0.05
QA_SENTINEL_ALERT_RESPONSE_TIME=2000

# Benchmarking
QA_SENTINEL_BASELINE_VERSION="v5.0"
QA_SENTINEL_ANOMALY_THRESHOLD=0.95

# Self-Healing
QA_SENTINEL_AUTO_REPAIR=true
QA_SENTINEL_ESCALATION_THRESHOLD=5

# Logging
QA_SENTINEL_LOG_LEVEL="info"
QA_SENTINEL_LOG_FILE="./logs/qa-sentinel-ci.log"
```

## Custom Scripts

### Pre-validation Hook

```bash
#!/bin/bash
# scripts/ci-cd/pre-qa-validation.sh

echo "Running pre-QA validation checks..."

# Check code quality
npm run lint
npm run type-check

# Security scan
npm audit --audit-level moderate

# Check test coverage baseline
npx nyc check-coverage --lines 80 --functions 80 --branches 80

echo "Pre-QA validation completed"
```

### Post-validation Hook

```bash
#!/bin/bash
# scripts/ci-cd/post-qa-validation.sh

echo "Running post-QA validation tasks..."

# Generate coverage report
npm run coverage:report

# Update baseline if needed
if [ "$UPDATE_BASELINE" = "true" ]; then
    ./scripts/ci-cd/qa-sentinel-trigger.sh update-baseline
fi

# Send notifications
if [ "$CI" = "true" ] && [ -n "$SLACK_WEBHOOK" ]; then
    ./scripts/ci-cd/notify-slack.sh
fi

echo "Post-QA validation completed"
```

## Troubleshooting

### Common Issues

#### QA Sentinel Build Failures

```bash
# Check Node.js version
node --version

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript compilation
cd core/qa-sentinel && npx tsc --noEmit
```

#### Database Connection Issues

```bash
# Test database connection
psql "$DATABASE_URL" -c "SELECT 1;"

# Check database logs
docker logs postgres_container

# Reset test database
npm run db:reset:test
```

#### Permission Issues

```bash
# Make scripts executable
chmod +x scripts/ci-cd/qa-sentinel-trigger.sh

# Check file permissions
ls -la scripts/ci-cd/

# Ensure proper user permissions for CI
whoami
id -u
```

#### Memory Issues

```yaml
# Increase memory limits
jobs:
  qa-sentinel-validation:
    runs-on: ubuntu-latest
    env:
      NODE_OPTIONS: --max-old-space-size=4096
```

### Debug Mode

Enable detailed logging:

```bash
export DEBUG=qa-sentinel:*
export QA_SENTINEL_LOG_LEVEL=debug
./scripts/ci-cd/qa-sentinel-trigger.sh validate "debug-build" "123"
```

### Performance Optimization

#### Parallel Execution

```yaml
jobs:
  qa-parallel:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]

    steps:
      - run: |
          ./scripts/ci-cd/qa-sentinel-trigger.sh test:parallel ${{ matrix.shard }} 4
```

#### Caching

```yaml
steps:
  - uses: actions/cache@v3
    with:
      path: |
        ~/.npm
        node_modules
        core/qa-sentinel/node_modules
      key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

## Monitoring and Alerting

### CI Health Dashboard

Monitor QA Sentinel performance across CI runs:

```bash
# Generate CI health report
./scripts/ci-cd/qa-sentinel-trigger.sh ci:health

# View failure trends
./scripts/ci-cd/qa-sentinel-trigger.sh ci:trends
```

### Alert Configuration

```yaml
# Alert on QA failures
alerts:
  - name: QA Validation Failure
    condition: qa.status == 'failure'
    channels: [slack, email]
    severity: high

  - name: Performance Regression
    condition: benchmark.regression_detected == true
    channels: [slack, github-issue]
    severity: critical

  - name: Coverage Drop
    condition: qa.coverage < 75
    channels: [email]
    severity: medium
```

## Best Practices

### 1. Gate Configuration
- Set appropriate quality gates for your project
- Balance speed vs. quality requirements
- Use different thresholds for different branches

### 2. Test Organization
- Categorize tests by execution time and importance
- Use parallel execution for faster feedback
- Implement smart test selection based on changes

### 3. Baseline Management
- Regularly update performance baselines
- Automate baseline updates for stable releases
- Monitor baseline drift over time

### 4. Failure Handling
- Implement proper retry logic for flaky tests
- Use quarantine for intermittently failing tests
- Set up proper alerting for critical failures

### 5. Resource Management
- Configure appropriate resource limits
- Use spot instances for cost optimization
- Implement proper cleanup of test resources

### 6. Security
- Use secrets management for sensitive configuration
- Scan dependencies regularly
- Implement proper access controls for QA results

## Migration Guide

### From v3.x to v5.1

1. **Update CI Configuration**
   - Replace old QA scripts with QA Sentinel triggers
   - Update environment variables
   - Modify artifact collection

2. **Database Migration**
   - Run new migration scripts
   - Update test data seeding
   - Configure connection pooling

3. **Monitoring Setup**
   - Configure QA Sentinel dashboard
   - Set up alerting rules
   - Update monitoring dashboards

4. **Team Training**
   - Train developers on new QA workflow
   - Update documentation
   - Establish support channels

---

**Last Updated**: October 2025
**QA Sentinel Version**: 5.1.0