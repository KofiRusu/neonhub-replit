import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { MemoryRagService } from "./rag/memory.service.js";
import type {
  ConsentStatus,
  IdentityDescriptor,
  MemoryQueryOptions,
  MemoryRecord,
  NoteInput,
} from "../types/agentic.js";

const _identityTypes = ["email", "phone", "handle"] as const;

type IdentityType = (typeof _identityTypes)[number];

type IdentityPayload = Pick<Prisma.IdentityCreateManyInput, "type" | "value" | "channel">;

function ensureIdentifier(ident: IdentityDescriptor): void {
  if (!ident.email && !ident.phone && !ident.handle && !ident.externalId) {
    throw new Error("At least one identifier (email, phone, handle, externalId) is required");
  }
}

function normalizeChannel(type: IdentityType): string {
  switch (type) {
    case "email":
      return "email";
    case "phone":
      return "sms";
    case "handle":
      return "dm";
    default:
      return "direct";
  }
}

const vectorToArray = (embedding: unknown): number[] | null => {
  if (!embedding) return null;
  if (Array.isArray(embedding)) {
    return embedding.map((value) => Number(value));
  }
  if (typeof embedding === "object" && embedding !== null) {
    const maybeBuffer = embedding as { values?: number[]; data?: number[] };
    if (Array.isArray(maybeBuffer.values)) return maybeBuffer.values.map((value) => Number(value));
    if (Array.isArray(maybeBuffer.data)) return maybeBuffer.data.map((value) => Number(value));
  }
  if (typeof embedding === "string") {
    try {
      const parsed = JSON.parse(embedding);
      return Array.isArray(parsed) ? parsed.map((value) => Number(value)) : null;
    } catch (err) {
      logger.warn({ err, embedding }, "Unable to parse embedding string");
    }
  }
  return null;
};

async function getPersonOrThrow(personId: string) {
  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) {
    throw new Error(`Person not found for id ${personId}`);
  }
  return person;
}

async function attachIdentities(
  tx: Prisma.TransactionClient,
  personId: string,
  organizationId: string,
  payloads: IdentityPayload[],
) {
  if (!payloads.length) return;
  await Promise.all(
    payloads.map((payload) =>
      tx.identity.upsert({
        where: {
          organizationId_type_value: {
            organizationId,
            type: payload.type,
            value: payload.value,
          },
        },
        update: { personId },
        create: {
          personId,
          organizationId,
          type: payload.type,
          value: payload.value,
          channel: payload.channel ?? normalizeChannel(payload.type as IdentityType),
        },
      }),
    ),
  );
}

function buildIdentityPayloads(ident: IdentityDescriptor): IdentityPayload[] {
  const payloads: IdentityPayload[] = [];
  if (ident.email) {
    payloads.push({ type: "email", value: ident.email.toLowerCase(), channel: "email" });
  }
  if (ident.phone) {
    payloads.push({ type: "phone", value: ident.phone, channel: "sms" });
  }
  if (ident.handle) {
    payloads.push({ type: "handle", value: ident.handle.toLowerCase(), channel: "dm" });
  }
  return payloads;
}

function buildIdentityWhere(ident: IdentityDescriptor) {
  const where: Prisma.IdentityWhereInput[] = [];
  if (ident.email) where.push({ type: "email", value: ident.email.toLowerCase() });
  if (ident.phone) where.push({ type: "phone", value: ident.phone });
  if (ident.handle) where.push({ type: "handle", value: ident.handle.toLowerCase() });
  return where;
}

async function persistPersonTraits(
  tx: Prisma.TransactionClient,
  personId: string,
  traits?: Record<string, unknown>,
) {
  if (!traits || !Object.keys(traits).length) return;
  await tx.person.update({
    where: { id: personId },
    data: {
      attributes: {
        ...(traits ?? {}),
      } as unknown as Prisma.JsonObject,
    },
  });
}

export const PersonService = {
  memory: new MemoryRagService(),
  async resolve(ident: IdentityDescriptor): Promise<string> {
    ensureIdentifier(ident);
    const { organizationId, externalId } = ident;

    return prisma.$transaction(async (tx) => {
      const identityMatches = buildIdentityWhere(ident);

      let personId: string | null = null;

      if (identityMatches.length) {
        const identity = await tx.identity.findFirst({
          where: {
            organizationId,
            OR: identityMatches,
          },
          select: {
            id: true,
            personId: true,
            type: true,
            value: true,
          },
        });
        if (identity?.personId) {
          personId = identity.personId;
        }
      }

      if (!personId && externalId) {
        const existing = await tx.person.findUnique({
          where: {
            organizationId_externalId: {
              organizationId,
              externalId,
            },
          },
          select: { id: true },
        });
        if (existing) {
          personId = existing.id;
        }
      }

      if (!personId) {
        const directMatch = await tx.person.findFirst({
          where: {
            organizationId,
            OR: [
              ident.email ? { primaryEmail: ident.email.toLowerCase() } : undefined,
              ident.phone ? { primaryPhone: ident.phone } : undefined,
              ident.handle ? { primaryHandle: ident.handle.toLowerCase() } : undefined,
              externalId ? { externalId } : undefined,
            ].filter(Boolean) as Prisma.PersonWhereInput[],
          },
          select: { id: true },
        });
        if (directMatch) {
          personId = directMatch.id;
        }
      }

      if (!personId) {
        if (ident.createIfMissing === false) {
          throw new Error("Person not found for provided identifiers");
        }
        const created = await tx.person.create({
          data: {
            organizationId,
            externalId: externalId ?? undefined,
            displayName: ident.traits?.name as string | undefined,
            primaryEmail: ident.email?.toLowerCase(),
            primaryPhone: ident.phone,
            primaryHandle: ident.handle?.toLowerCase(),
            attributes: (ident.traits as Prisma.JsonValue | undefined) ?? undefined,
          },
          select: { id: true },
        });
        personId = created.id;
      } else {
        await tx.person.update({
          where: { id: personId },
          data: {
            primaryEmail: ident.email?.toLowerCase() ?? undefined,
            primaryPhone: ident.phone ?? undefined,
            primaryHandle: ident.handle?.toLowerCase() ?? undefined,
            ...(ident.traits ? { attributes: ident.traits as Prisma.JsonValue } : {}),
          },
        });
      }

      const payloads = buildIdentityPayloads(ident);
      await attachIdentities(tx, personId, organizationId, payloads);
      await persistPersonTraits(tx, personId, ident.traits);

      return personId;
    });
  },

  async getMemory(personId: string, opts: MemoryQueryOptions = {}): Promise<MemoryRecord[]> {
    const limit = opts.limit && opts.limit > 0 ? opts.limit : undefined;
    const memories = await prisma.memEmbedding.findMany({
      where: {
        personId,
        ...(opts.since ? { createdAt: { gte: opts.since } } : {}),
      },
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: limit } : {}),
      include: {
        sourceEvent: opts.includeEvents ?? false,
      },
    });

    return memories.map((memory) => ({
      id: memory.id,
      personId: memory.personId,
      label: memory.label,
      summary: (memory.metadata as Record<string, unknown> | null)?.summary as string | undefined,
      embedding: opts.includeVectors === false ? null : vectorToArray((memory as { embedding?: unknown }).embedding),
      metadata: memory.metadata as Record<string, unknown> | null,
      sourceEventId: memory.sourceEventId,
      createdAt: memory.createdAt,
      expiresAt: memory.expiresAt,
    }));
  },

  async updateTopic(personId: string, topic: string, weight: number): Promise<void> {
    const person = await getPersonOrThrow(personId);
    await prisma.topic.upsert({
      where: {
        personId_name: {
          personId,
          name: topic.toLowerCase(),
        },
      },
      create: {
        personId,
        organizationId: person.organizationId,
        name: topic.toLowerCase(),
        weight,
      },
      update: {
        weight,
      },
    });
  },

  async addNote(personId: string, note: string | NoteInput, authorId?: string): Promise<void> {
    const person = await getPersonOrThrow(personId);
    const payload = typeof note === "string" ? { body: note } : note;

    const created = await prisma.note.create({
      data: {
        personId,
        organizationId: person.organizationId,
        authorId: authorId ?? null,
        body: payload.body,
        tags: payload.tags ?? [],
        visibility: payload.visibility ?? "internal",
      },
    });

    try {
      await this.memory.storeSnippet({
        organizationId: person.organizationId,
        personId,
        label: "support_note",
        text: payload.body,
        category: "support",
        metadata: {
          tags: payload.tags ?? [],
          visibility: payload.visibility ?? "internal",
          authorId: authorId ?? null,
          noteId: created.id,
        },
      });
    } catch (error) {
      logger.warn({ error, personId }, "Failed to store support note memory");
    }
  },

  async getConsent(personId: string, channel: string): Promise<ConsentStatus | null> {
    const consent = await prisma.consent.findFirst({
      where: { personId, channel },
      orderBy: { updatedAt: "desc" },
    });
    return (consent?.status ?? null) as ConsentStatus | null;
  },
};
