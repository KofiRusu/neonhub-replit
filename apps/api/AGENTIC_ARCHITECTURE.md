# LoopDrive Agentic Architecture (API side)

## Overview
LoopDrive v1 introduces an identity-first interaction loop that coordinates person graph enrichment, channel-specific orchestration, and budget control. The API layer now exposes cohesive services and routes that wire these loop stages to queues and downstream workers.

```
Identity → Compose → Guardrail → Send → Event Intake → Learning → Budget
```

- **Identity graph**: New Prisma models (`Person`, `Identity`, `Consent`, `Topic`, `Objective`, `MemEmbedding`, `Note`, `Event`) anchor cross-channel data.
- **Execution layer**: Core services (`PersonService`, `BrandVoiceService`, `EventIntakeService`, `LearningService`, `BudgetService`) provide deterministic entry points that agents and routes share.
- **Queues**: BullMQ queues (`email.*`, `sms.*`, `social.*`, `intake.*`, `learning.tune`, `budget.execute`) allow composition/sending/learning tasks to run asynchronously against Redis.
- **Agents**: Email/SMS/Social agents coordinate identity resolution, brand voice composition, deliverability, and event logging.
- **Routes**: REST endpoints expose compose/guardrail, person memory/consent, SMS + social messaging hooks, and budget planning/execution.

## Key Files

| Area | Path |
| --- | --- |
| Prisma schema + models | `apps/api/prisma/schema.prisma` |
| Migration | `apps/api/prisma/migrations/20251101093000_add_agentic_models/migration.sql` |
| Shared types | `apps/api/src/types/agentic.ts` |
| Services | `apps/api/src/services/person.service.ts`, `brand-voice.service.ts`, `event-intake.service.ts`, `learning-loop.service.ts`, `budget.service.ts` |
| Agents | `apps/api/src/agents/EmailAgent.ts`, `SMSAgent.ts`, `SocialMessagingAgent.ts` |
| Routes | `apps/api/src/routes/brand-voice.ts`, `person.ts`, `sms.ts`, `social.ts`, `budget.ts` |
| Queues | `apps/api/src/queues/index.ts` |
| Tests | `apps/api/src/__tests__/agentic-services.test.ts` |

## Service & Agent Flow

1. **Identity resolution** (`PersonService.resolve`) normalises email/phone/handle and attaches consents, topics, and notes. Memory snapshots use `MemEmbedding` records.
2. **Composition** (`BrandVoiceService.compose`) pulls brand voice templates, person memory, topics, and snippets to craft channel-specific variants. Guardrails flag disallowed copy and enforce channel limits.
3. **Messaging agents**:
   - `EmailAgent.sendPersonalized` performs consent + deliverability checks, enqueues compose/send jobs, sends via Resend, and records an `Event`.
   - `SMSAgent.send` mirrors the flow for Twilio and honours TCPA consent.
   - `SocialMessagingAgent.sendDM` adapts tonality to Instagram/X/Reddit/WhatsApp limits and logs DM events.
4. **Event intake** (`EventIntakeService`) normalises raw events, classifies engagement state, inserts event rows, and stores embeddings (via pgvector) for personalised recall.
5. **Learning loop** updates snippet win-rates, topic weights, and cadence recommendations off of event history.
6. **Budget service** locks allocations against `BudgetProfile` records, posts ledger debits, and offers reconciliation endpoints.
7. **Queues** decouple heavy compose/send/learn/budget work; each queue name aligns with a downstream worker slot.

## API Surface

- `POST /api/brand-voice/compose` – compose branded messaging variants.
- `POST /api/brand-voice/guardrail` – check/redact copy for violations.
- `GET /api/brand-voice/prompt/:useCase?brandId=` – retrieve prompt packs for SDK/UI.
- `POST /api/person/resolve` – upsert global person identities.
- `GET /api/person/:id/memory` – fetch personal memory snapshots.
- `GET /api/person/:id/topics` – list learned interests.
- `POST /api/person/:id/consent` – record consent provenance.
- `POST /api/sms/send` – queue + send personalised SMS.
- `POST /api/sms/inbound` – Twilio webhook for replies.
- `POST /api/social/:platform/dm` – send cross-platform DMs.
- `POST /api/social/:platform/inbound` – webhook handler for inbound social responses.
- `POST /api/budget/plan` – create LoopDrive budget allocations.
- `POST /api/budget/execute` – mark allocations executing and emit ledger entries.
- `POST /api/budget/reconcile` – close out allocations.
- `GET /api/budget/ledger?workspaceId=&start=&end=` – view ledger snapshots.

## Next Steps

- Attach queue workers (compose/send/learning/budget) to consume BullMQ jobs.
- Expand route-level auth to verify organisation access on person/budget calls.
- Integrate platform-specific connectors (Meta/X/Reddit/WhatsApp) once the integration layer lands.
- Extend coverage with scenario tests covering route + queue interactions.
