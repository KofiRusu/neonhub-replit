# Phase 3 Preparation — Zero-Hit Utility Coverage & Prometheus Integration

**Prepared:** November 3, 2025  
**Phase 2 Completion:** 95% ✅  
**Target:** 90% Overall Backend Readiness  
**Timeline:** 7-10 days

---

## Phase 3 Objectives

### Primary Goals
1. **Achieve 80%+ branch coverage** for all zero-hit legacy utilities in `apps/api/src/lib/`
2. **Integrate Prometheus metrics** with real telemetry data
3. **Validate seeding pipeline** with live database
4. **Rebuild and package** `@neonhub/predictive-engine`
5. **Update readiness scores** to reflect validated improvements

### Success Criteria
- ✅ All 8 zero-hit utilities have ≥80% branch coverage
- ✅ `/metrics` endpoint exposes real-time telemetry (agent runs, circuit breaker, API latency)
- ✅ Agent memory seeding executes successfully in staging
- ✅ Predictive engine package built and validated
- ✅ Overall backend readiness: 70% → 85%+

---

## Phase 3 Task Breakdown

### Track 1: Zero-Hit Utility Coverage (4-5 days)

#### High-Priority Utilities (Infrastructure-Critical)

##### 1. `apps/api/src/lib/metrics.ts` — Prometheus Metrics Helper
**Estimated Effort:** 0.5 days  
**Priority:** P0 (CRITICAL)  
**Current Coverage:** 0%  
**Target Coverage:** 90%+

**Test Cases Required:**
- Counter increment/decrement operations
- Histogram recording (p50, p95, p99 quantiles)
- Gauge setting/updating
- Label registration and validation
- Metric name sanitization
- Edge cases: invalid metric names, duplicate registrations

**Dependencies:** None (pure utility)

**Acceptance Criteria:**
- ✅ All public methods covered
- ✅ Edge cases tested (empty labels, special chars in names)
- ✅ Integration with Prometheus client validated

---

##### 2. `apps/api/src/lib/prisma.ts` — Prisma Client Singleton
**Estimated Effort:** 0.5 days  
**Priority:** P0 (CRITICAL)  
**Current Coverage:** 0%  
**Target Coverage:** 85%+

**Test Cases Required:**
- Singleton pattern: ensure single instance created
- Connection pooling configuration
- Error handling: connection failures, timeout
- Transaction management (if exposed)
- Middleware registration (logging, telemetry)
- Graceful shutdown/disconnect

**Dependencies:** Mock Prisma client (use `jest-mock-extended`)

**Acceptance Criteria:**
- ✅ Singleton behavior validated (same instance returned)
- ✅ Connection error handling tested
- ✅ Middleware registration verified
- ✅ No real database calls in unit tests

---

##### 3. `apps/api/src/lib/openai.ts` — OpenAI Client Wrapper
**Estimated Effort:** 1 day  
**Priority:** P0 (CRITICAL)  
**Current Coverage:** 0%  
**Target Coverage:** 80%+

**Test Cases Required:**
- API key validation and initialization
- Chat completion requests (streaming + non-streaming)
- Embedding generation (single + batch)
- Error handling: rate limits, invalid API key, network errors
- Retry logic with exponential backoff
- Timeout handling
- Response parsing and validation

**Dependencies:** Mock OpenAI SDK

**Acceptance Criteria:**
- ✅ All API methods covered (completions, embeddings)
- ✅ Error scenarios tested (401, 429, 500)
- ✅ Retry logic validated
- ✅ No real OpenAI API calls in tests

---

#### Medium-Priority Utilities (Operational)

##### 4. `apps/api/src/lib/requestUser.ts` — Auth/User Extraction
**Estimated Effort:** 0.5 days  
**Priority:** P1 (HIGH)  
**Current Coverage:** 0%  
**Target Coverage:** 85%+

**Test Cases Required:**
- JWT token parsing and validation
- User extraction from request headers
- Session validation
- Permission/role checking
- Edge cases: expired tokens, malformed headers, missing auth

**Dependencies:** Mock JWT library

---

##### 5. `apps/api/src/lib/raw-body.ts` — Request Body Parser
**Estimated Effort:** 0.5 days  
**Priority:** P1 (HIGH)  
**Current Coverage:** 0%  
**Target Coverage:** 80%+

**Test Cases Required:**
- JSON body parsing
- Form data parsing
- Buffer handling for large payloads
- Content-Type detection
- Error handling: invalid JSON, oversized payloads
- Stream processing

---

#### Low-Priority Utilities (Analytics/Integration)

##### 6. `apps/api/src/lib/leadScraper.ts` — Analytics/Scraping Utility
**Estimated Effort:** 1 day  
**Priority:** P2 (MEDIUM)  
**Current Coverage:** 0%  
**Target Coverage:** 75%+

**Test Cases Required:**
- URL validation and sanitization
- HTML parsing and data extraction
- Rate limiting compliance
- Error handling: 404, timeout, malformed HTML
- Pagination handling

**Dependencies:** Mock Puppeteer/Cheerio

---

##### 7. `apps/api/src/lib/search.ts` — Search Utilities
**Estimated Effort:** 0.5 days  
**Priority:** P2 (MEDIUM)  
**Current Coverage:** 0%  
**Target Coverage:** 75%+

**Test Cases Required:**
- Query parsing and sanitization
- Filter application
- Sorting logic
- Pagination
- Full-text search integration

---

##### 8. `apps/api/src/lib/socialApiClient.ts` — Social Media API Client
**Estimated Effort:** 1 day  
**Priority:** P2 (MEDIUM)  
**Current Coverage:** 0%  
**Target Coverage:** 75%+

**Test Cases Required:**
- OAuth flow handling
- API endpoint wrappers (Twitter, LinkedIn, Facebook)
- Rate limit handling per platform
- Response normalization
- Error handling: expired tokens, API changes

---

### Track 2: Prometheus Integration (2-3 days)

#### Task 2.1: Metrics Endpoint Enhancement
**Effort:** 1 day

**Current State:** `/metrics` endpoint exists but may have mock data

**Actions Required:**
1. Audit current `/metrics` implementation in `apps/api/src/routes/metrics.ts`
2. Ensure real telemetry data is exposed:
   - `agent_runs_total` (counter by agent type and status)
   - `agent_run_duration_seconds` (histogram with p50, p95, p99)
   - `circuit_breaker_failures_total` (counter by service)
   - `api_request_duration_seconds` (histogram by route and method)
   - `db_query_duration_seconds` (histogram)
   - `active_connections` (gauge)
3. Add labels: `agent_type`, `status`, `route`, `method`, `service`
4. Verify Prometheus scraping configuration

**Validation:**
```bash
curl -s http://localhost:4100/metrics | grep -E "agent_runs_total|agent_run_duration_seconds|circuit_breaker"
```

---

#### Task 2.2: Grafana Dashboard Setup
**Effort:** 1 day

**Deliverables:**
1. `infra/grafana/dashboards/neonhub-overview.json` — System health dashboard
   - Request rate, latency (p50, p95, p99)
   - Error rate by endpoint
   - Database connection pool stats
   - Active WebSocket connections

2. `infra/grafana/dashboards/neonhub-agents.json` — Agent telemetry dashboard
   - Agent runs per minute (by type)
   - Agent run duration distribution
   - Success/failure rates
   - Circuit breaker trips

3. `infra/grafana/dashboards/neonhub-business.json` — Business metrics dashboard
   - Content generation counts
   - Campaign executions
   - User engagement metrics

**Configuration:**
- Data source: Prometheus (http://prometheus:9090)
- Refresh interval: 30s
- Time range: Last 1h, 6h, 24h, 7d

---

#### Task 2.3: Alerting Rules
**Effort:** 0.5 days

**Alerts to Define:**
1. **High Error Rate:** > 5% errors over 5 minutes
2. **Slow Requests:** p95 latency > 2s
3. **Database Connections:** > 80% pool utilization
4. **Circuit Breaker:** > 10 trips per minute
5. **Agent Failures:** > 20% failure rate over 10 minutes

**File:** `infra/prometheus/rules/neonhub-alerts.yml`

**Integration:** Slack webhook notifications (already configured in CI/CD)

---

### Track 3: Seeding & Packaging (1-2 days)

#### Task 3.1: Validate Seeding Pipeline
**Effort:** 0.5 days

**Prerequisites:** Database connectivity restored

**Steps:**
1. Execute seeding script:
   ```bash
   export DATABASE_URL="postgresql://neondb_owner:npg_r2D7UIdgPsVX@ep-polished-flower-aefsjkya-pooler.c-2.us-east-2.aws.neon.tech/neondb"
   pnpm run seed-agent-memory
   ```

2. Verify seeding results:
   ```bash
   cat /tmp/seed-agent-memory.log
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM agent_memories;"
   psql $DATABASE_URL -c "SELECT agent, COUNT(*) FROM agent_memories GROUP BY agent;"
   psql $DATABASE_URL -c "\d+ agent_memories;"
   ```

3. Test vector similarity queries:
   ```sql
   SELECT key, content, 
          1 - (embedding <=> '[0.1, 0.2, ...]'::vector) AS similarity
   FROM agent_memories
   WHERE agent = 'ContentAgent'
   ORDER BY similarity DESC
   LIMIT 5;
   ```

4. Verify IVFFLAT index performance:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM agent_memories
   WHERE agent = 'ContentAgent'
   ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
   LIMIT 10;
   ```

**Acceptance Criteria:**
- ✅ All agents seeded with expected memory counts
- ✅ Vector similarity queries return correct results
- ✅ IVFFLAT index used in query plans
- ✅ No seeding errors in logs

---

#### Task 3.2: Rebuild Predictive Engine
**Effort:** 0.5 days

**Prerequisites:** Network connectivity restored

**Steps:**
1. Clean and rebuild:
   ```bash
   pnpm store prune && pnpm cache clean
   pnpm install --frozen-lockfile
   pnpm --filter @neonhub/predictive-engine build
   pnpm --filter @neonhub/predictive-engine pack
   ```

2. Record tarball checksum:
   ```bash
   shasum -a 256 modules/predictive-engine/neonhub-predictive-engine-*.tgz > PREDICTIVE_ENGINE_CHECKSUM.txt
   ```

3. Validate integration:
   ```bash
   pnpm --filter @neonhub/backend-v3.2 exec jest \
     --config jest.integration.config.js \
     --runInBand \
     src/__tests__/agent-learning.integration.spec.ts
   ```

4. Regenerate coverage:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" pnpm --filter @neonhub/backend-v3.2 test:coverage
   ```

**Acceptance Criteria:**
- ✅ Package builds without errors
- ✅ Integration tests pass
- ✅ Coverage metrics unchanged (parity with previous run)
- ✅ Checksum documented in release notes

---

## Phase 3 Timeline

### Week 1 (Days 1-5)
- **Days 1-2:** High-priority utilities (`metrics.ts`, `prisma.ts`, `openai.ts`)
- **Days 3-4:** Medium-priority utilities (`requestUser.ts`, `raw-body.ts`)
- **Day 5:** Low-priority utilities (start `leadScraper.ts`, `search.ts`)

### Week 2 (Days 6-10)
- **Days 6-7:** Complete low-priority utilities, Prometheus integration
- **Day 8:** Grafana dashboards and alerting rules
- **Day 9:** Seeding validation and predictive engine rebuild
- **Day 10:** Final validation, documentation updates, Phase 3 wrap-up report

---

## Dependencies & Prerequisites

### External Dependencies
- ✅ Network connectivity (for `pnpm install`)
- ✅ Database connectivity (for seeding validation)
- ✅ npm registry access (for package rebuild)

### Internal Dependencies
- ✅ Phase 2 completion (95% done)
- ✅ Test infrastructure in place (Jest + mocking libraries)
- ✅ CI/CD workflows operational

### Blocker Resolution Strategy
- **Network/DB Offline:** Proceed with test file creation (can validate later)
- **Registry Offline:** Document rebuild steps, execute when available

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Connectivity delays extend timeline | HIGH | MEDIUM | Parallelize test creation (no network needed) |
| Coverage targets not met | LOW | MEDIUM | Focus on high-priority files first, adjust targets if needed |
| Prometheus integration complexity | MEDIUM | HIGH | Use existing `/metrics` endpoint, incremental enhancement |
| Seeding failures in production | LOW | HIGH | Test thoroughly in staging, add rollback procedures |

---

## Success Metrics

### Coverage Targets
- **High-Priority Files:** 80%+ branch coverage (metrics.ts, prisma.ts, openai.ts)
- **Medium-Priority Files:** 75%+ branch coverage (requestUser.ts, raw-body.ts)
- **Low-Priority Files:** 70%+ branch coverage (leadScraper.ts, search.ts, socialApiClient.ts)
- **Overall Backend:** 70% → 85%+ lines/branches

### Operational Targets
- **Prometheus Metrics:** ≥10 custom metrics exposed
- **Grafana Dashboards:** 3 dashboards (overview, agents, business)
- **Alerting Rules:** 5+ alerts configured with Slack integration
- **Seeding Success Rate:** 100% (all agents seeded without errors)

### Documentation Targets
- **Phase 3 Wrap-Up Report:** Comprehensive validation summary
- **Test Coverage Report:** Per-file breakdown with gap analysis
- **Prometheus Setup Guide:** Configuration and dashboard usage
- **Seeding Runbook:** Operational procedures for production

---

## Deliverables Checklist

### Code Artifacts
- [ ] 8 new test files (`*.spec.ts`) for zero-hit utilities
- [ ] Enhanced `/metrics` endpoint with real telemetry
- [ ] 3 Grafana dashboard JSON files
- [ ] Prometheus alerting rules YAML
- [ ] Seeding validation scripts

### Documentation
- [ ] `PHASE3_WRAPUP_REPORT.md` — Comprehensive validation summary
- [ ] `TEST_COVERAGE_REPORT.md` — Per-file coverage breakdown
- [ ] `PROMETHEUS_SETUP_GUIDE.md` — Dashboard and alerting configuration
- [ ] `SEEDING_RUNBOOK.md` — Operational procedures for agent memory seeding

### Validation Artifacts
- [ ] `apps/api/coverage/coverage-summary.json` — Updated coverage metrics
- [ ] `PREDICTIVE_ENGINE_CHECKSUM.txt` — Package tarball hash
- [ ] `/tmp/seed-agent-memory.log` — Seeding execution log
- [ ] Prometheus metrics snapshot (exported from `/metrics`)

---

## Phase 3 → Phase 4 Transition Criteria

Phase 3 is considered **complete** when:
1. ✅ All 8 zero-hit utilities have test coverage ≥75%
2. ✅ Overall backend readiness ≥85%
3. ✅ Prometheus metrics endpoint validated with real data
4. ✅ Grafana dashboards operational
5. ✅ Seeding pipeline validated in staging
6. ✅ Predictive engine rebuilt and integrated
7. ✅ Phase 3 wrap-up report published

**Phase 4 Focus:** Production deployment readiness (90%+ overall, security hardening, load testing)

---

**Prepared By:** Neon Autonomous Development Agent  
**Review Date:** November 3, 2025  
**Next Review:** After connectivity restoration + Phase 3 kickoff

