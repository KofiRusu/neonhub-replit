# Changelog

All notable changes to the NeonHub SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-28

### Added

- **Initial SDK Release** 🎉
- Core HTTP client with automatic retry and exponential backoff
- Comprehensive type system with Prisma type re-exports
- Error handling with typed exception classes:
  - `NeonHubError` - Base error class
  - `APIError` - HTTP errors
  - `AgentError` - Agent execution errors
  - `ValidationError` - Input validation errors
  - `RateLimitError` - Rate limit errors
  - `AuthenticationError` - Auth failures
  - `AuthorizationError` - Permission errors
  - `NotFoundError` - Resource not found
  - `TimeoutError` - Request timeouts

#### Modules

- **Agents Module** (`client.agents`)
  - `list()` - List all agents
  - `get(id)` - Get agent by ID
  - `execute(input)` - Execute agent
  - `getJob(jobId)` - Get job status
  - `listJobs(params)` - List agent jobs
  - `waitForCompletion(jobId)` - Wait for job completion

- **Content Module** (`client.content`)
  - `generate(input)` - Generate content
  - `listDrafts(params)` - List content drafts
  - `getDraft(id)` - Get draft by ID
  - `updateDraft(id, updates)` - Update draft
  - `deleteDraft(id)` - Delete draft
  - `list(params)` - List published content
  - `get(id)` - Get content by ID
  - `publish(draftId)` - Publish draft

- **Campaigns Module** (`client.campaigns`)
  - `create(input)` - Create campaign
  - `list(params)` - List campaigns
  - `get(id)` - Get campaign by ID
  - `update(id, updates)` - Update campaign
  - `delete(id)` - Delete campaign
  - `getMetrics(campaignId)` - Get campaign metrics
  - `start(campaignId)` - Start campaign
  - `pause(campaignId)` - Pause campaign
  - `stop(campaignId)` - Stop campaign

- **Marketing Module** (`client.marketing`)
  - `getMetrics(params)` - Get marketing metrics
  - `listCampaigns(params)` - List marketing campaigns
  - `getCampaign(id)` - Get campaign by ID
  - `listLeads(params)` - List leads
  - `getLead(id)` - Get lead by ID
  - `updateLead(id, updates)` - Update lead

- **Orchestration Module** (`client.orchestration`)
  - `execute(input)` - Execute orchestration workflow
  - `getStatus(runId)` - Get orchestration status
  - `listRuns(params)` - List orchestration runs
  - `waitForCompletion(runId)` - Wait for completion

#### Features

- TypeScript-first with full type definitions
- Automatic retries with exponential backoff
- Request timeout handling
- API key and access token authentication
- Custom headers support
- Debug logging
- Comprehensive test suite (>95% coverage)
- Working examples for all modules

### Documentation

- Complete README with quickstart guide
- API reference documentation
- 5 working examples
- TypeScript type exports

### Development

- Jest test framework configured
- ESLint for code quality
- TypeScript strict mode
- tsup for building (CJS + ESM)

---

## Future Releases

### [1.1.0] - Planned

- SEO module
- Documents module
- Team management module
- WebSocket support for real-time updates
- Pagination helpers
- Batch operations
- Streaming responses

### [1.2.0] - Planned

- Webhook verification utilities
- Rate limit information in responses
- Request caching
- Response interceptors
- Request interceptors

---

[1.0.0]: https://github.com/NeonHub3A/neonhub/releases/tag/sdk-v1.0.0

