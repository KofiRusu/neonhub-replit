import type { Prisma, MessageRole, ConversationKind } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { logger } from "../lib/logger.js";
import { connectById } from "../lib/mappers.js";

const PARTICIPANTS_KEY = "participants";
const READ_BY_KEY = "readBy";
const LEGACY_KEY = "legacy";
const SUBJECT_KEY = "subject";
const TAGS_KEY = "tags";

type JsonValue = Prisma.JsonValue;
type JsonObject = Prisma.JsonObject;

interface ConversationMetadata {
  participants: string[];
  subject?: string;
  tags?: string[];
  legacy?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

interface MessageMetadata {
  subject?: string;
  receiverId?: string;
  replyToId?: string;
  attachments?: string[];
  readBy: string[];
  legacy?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

const toJsonValue = (value: unknown): JsonValue => value as JsonValue;

const uniqueStrings = (values: Array<string | null | undefined>) => {
  const result = new Set<string>();
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      result.add(value);
    }
  }
  return Array.from(result);
};

const metadataRecord = (value: JsonValue | null | undefined): JsonObject => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return { ...(value as JsonObject) };
};

const ensureStringArray = (input: unknown): string[] => {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
};

const sanitizeExtras = (input: Record<string, unknown> | undefined, reserved: string[]): Record<string, unknown> | undefined => {
  if (!input) {
    return undefined;
  }
  const clone: Record<string, unknown> = { ...input };
  for (const key of reserved) {
    delete clone[key];
  }
  return Object.keys(clone).length ? clone : undefined;
};

const participantsFromMetadata = (value: JsonValue | null | undefined): string[] => {
  const record = metadataRecord(value);
  const raw = record[PARTICIPANTS_KEY];
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((entry): entry is string => typeof entry === "string");
};

const hasRead = (value: JsonValue | null | undefined, userId: string) => {
  if (!userId) {
    return false;
  }
  const metadata = messageMetadataFrom(value);
  return metadata.readBy.includes(userId);
};

const serializeConversationMetadata = (metadata: ConversationMetadata): JsonObject => {
  const record: JsonObject = {};
  if (metadata.participants.length) {
    record[PARTICIPANTS_KEY] = metadata.participants;
  }
  if (metadata.subject) {
    record[SUBJECT_KEY] = metadata.subject;
  }
  if (metadata.tags?.length) {
    record[TAGS_KEY] = metadata.tags;
  }
  if (metadata.legacy && Object.keys(metadata.legacy).length) {
    record[LEGACY_KEY] = metadata.legacy;
  }
  if (metadata.extra && Object.keys(metadata.extra).length) {
    for (const [key, value] of Object.entries(metadata.extra)) {
      if (value !== undefined) {
        record[key] = value as JsonValue;
      }
    }
  }
  return record;
};

const serializeMessageMetadata = (metadata: MessageMetadata): JsonObject => {
  const record: JsonObject = {};
  if (metadata.subject) {
    record[SUBJECT_KEY] = metadata.subject;
  }
  if (metadata.receiverId) {
    record.receiverId = metadata.receiverId;
  }
  if (metadata.replyToId) {
    record.replyToId = metadata.replyToId;
  }
  if (metadata.attachments?.length) {
    record.attachments = metadata.attachments;
  }
  record[READ_BY_KEY] = metadata.readBy;
  if (metadata.legacy && Object.keys(metadata.legacy).length) {
    record[LEGACY_KEY] = metadata.legacy;
  }
  if (metadata.extra && Object.keys(metadata.extra).length) {
    for (const [key, value] of Object.entries(metadata.extra)) {
      if (value !== undefined) {
        record[key] = value as JsonValue;
      }
    }
  }
  return record;
};

const conversationMetadataFrom = (value: JsonValue | null | undefined): ConversationMetadata => {
  const record = metadataRecord(value);
  const extras: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(record)) {
    if (![PARTICIPANTS_KEY, SUBJECT_KEY, TAGS_KEY, LEGACY_KEY].includes(key)) {
      extras[key] = val as unknown;
    }
  }
  return {
    participants: ensureStringArray(record[PARTICIPANTS_KEY]),
    subject: typeof record[SUBJECT_KEY] === "string" ? (record[SUBJECT_KEY] as string) : undefined,
    tags: ensureStringArray(record[TAGS_KEY]),
    legacy:
      record[LEGACY_KEY] && typeof record[LEGACY_KEY] === "object" && !Array.isArray(record[LEGACY_KEY])
        ? (record[LEGACY_KEY] as Record<string, unknown>)
        : undefined,
    extra: Object.keys(extras).length ? extras : undefined,
  };
};

const messageMetadataFrom = (value: JsonValue | null | undefined): MessageMetadata => {
  const record = metadataRecord(value);
  const extras: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(record)) {
    if (![SUBJECT_KEY, READ_BY_KEY, LEGACY_KEY, "receiverId", "replyToId", "attachments"].includes(key)) {
      extras[key] = val as unknown;
    }
  }
  const readBy = Array.isArray(record[READ_BY_KEY])
    ? ensureStringArray(record[READ_BY_KEY])
    : typeof record[READ_BY_KEY] === "object" && record[READ_BY_KEY]
    ? Object.keys(record[READ_BY_KEY] as Record<string, unknown>)
    : [];
  return {
    subject: typeof record[SUBJECT_KEY] === "string" ? (record[SUBJECT_KEY] as string) : undefined,
    receiverId: typeof record.receiverId === "string" ? (record.receiverId as string) : undefined,
    replyToId: typeof record.replyToId === "string" ? (record.replyToId as string) : undefined,
    attachments: ensureStringArray(record.attachments),
    readBy,
    legacy:
      record[LEGACY_KEY] && typeof record[LEGACY_KEY] === "object" && !Array.isArray(record[LEGACY_KEY])
        ? (record[LEGACY_KEY] as Record<string, unknown>)
        : undefined,
    extra: Object.keys(extras).length ? extras : undefined,
  };
};

async function resolveOrganizationId(userId?: string): Promise<string | undefined> {
  if (!userId) {
    return undefined;
  }

  const membership = await prisma.organizationMembership.findFirst({
    where: { userId },
    select: { organizationId: true },
  });

  return membership?.organizationId ?? undefined;
}

async function mergeConversationParticipants(conversationId: string, participants: string[]): Promise<void> {
  const additions = uniqueStrings(participants);
  if (additions.length === 0) {
    return;
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { metadata: true },
  });

  if (!conversation) {
    return;
  }

  const metadata = conversationMetadataFrom(conversation.metadata);
  const existing = metadata.participants;
  const merged = Array.from(new Set([...existing, ...additions]));

  if (merged.length === existing.length) {
    return;
  }

  const serialized = serializeConversationMetadata({
    ...metadata,
    participants: merged,
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { metadata: serialized },
  });
}

export interface CreateConversationInput {
  organizationId?: string;
  createdById?: string;
  title?: string;
  participants?: string[];
  subject?: string;
  tags?: string[];
  kind?: ConversationKind;
  status?: string;
  metadata?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

export interface CreateMessageInput {
  conversationId?: string;
  threadId?: string;
  receiverId?: string;
  subject?: string;
  body: string;
  replyToId?: string;
  attachments?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface AddMessageInput {
  conversationId: string;
  authorId?: string;
  role?: MessageRole;
  content: unknown;
  metadata?: MessageMetadata;
}

async function findConversationIds(userId: string): Promise<string[]> {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { createdById: userId },
        {
          metadata: {
            path: [PARTICIPANTS_KEY],
            array_contains: userId,
          },
        },
      ],
    },
    select: { id: true },
  });

  return conversations.map(conversation => conversation.id);
}

export async function createConversation(input: CreateConversationInput) {
  const participants = uniqueStrings(input.participants ?? []);
  const tags = uniqueStrings(input.tags ?? []);

  const combinedMetadata = {
    ...(input.metadata ?? {}),
    ...(input.extra ?? {}),
  } as Record<string, unknown>;

  let legacy: Record<string, unknown> | undefined;
  if (combinedMetadata[LEGACY_KEY] && typeof combinedMetadata[LEGACY_KEY] === "object") {
    legacy = combinedMetadata[LEGACY_KEY] as Record<string, unknown>;
    delete combinedMetadata[LEGACY_KEY];
  }

  const extras = sanitizeExtras(combinedMetadata, [PARTICIPANTS_KEY, SUBJECT_KEY, TAGS_KEY, READ_BY_KEY]);

  const conversationMetadata = serializeConversationMetadata({
    participants,
    subject: input.subject,
    tags,
    legacy,
    extra: extras,
  });

  const organizationId =
    input.organizationId ?? (await resolveOrganizationId(input.createdById)) ?? (await resolveOrganizationId(participants[0]));

  if (!organizationId) {
    throw new Error("Organization context not found for conversation");
  }

  const organization = connectById(organizationId)!;
  const createdBy = connectById(input.createdById);
  const kind: ConversationKind = input.kind ?? "support";
  const status = input.status ?? "active";

  const metadataToPersist = Object.keys(conversationMetadata).length ? conversationMetadata : undefined;

  const conversation = await prisma.conversation.create({
    data: {
      title: input.title ?? input.subject ?? "Conversation",
      kind,
      status,
      organization,
      ...(createdBy ? { createdBy } : {}),
      ...(metadataToPersist ? { metadata: metadataToPersist } : {}),
    },
  });

  logger.info({ conversationId: conversation.id, kind, status }, "Conversation created");
  return conversation;
}

export async function addMessage(input: AddMessageInput) {
  const author = connectById(input.authorId);
  const metadataPayload = input.metadata ? serializeMessageMetadata(input.metadata) : undefined;

  const message = await prisma.message.create({
    data: {
      conversation: { connect: { id: input.conversationId } },
      ...(author ? { author } : {}),
      role: input.role ?? "user",
      contentJson: toJsonValue(input.content),
      ...(metadataPayload ? { metadata: metadataPayload } : {}),
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  logger.info({ messageId: message.id, conversationId: input.conversationId }, "Message stored");
  return message;
}

export async function sendMessage(senderId: string, input: CreateMessageInput) {
  const conversationId = input.conversationId ?? input.threadId;
  const participants = uniqueStrings([senderId, input.receiverId]);
  const metadataSource =
    input.metadata && typeof input.metadata === "object"
      ? (input.metadata as Record<string, unknown>)
      : undefined;

  const normalizedSubject =
    input.subject ?? (typeof metadataSource?.[SUBJECT_KEY] === "string" ? (metadataSource[SUBJECT_KEY] as string) : undefined);

  const attachments = input.attachments ?? ensureStringArray(metadataSource?.attachments);
  const receiverId = input.receiverId ?? (typeof metadataSource?.receiverId === "string" ? (metadataSource.receiverId as string) : undefined);
  const replyToId = input.replyToId ?? (typeof metadataSource?.replyToId === "string" ? (metadataSource.replyToId as string) : undefined);

  const metadataLegacy =
    metadataSource && typeof metadataSource[LEGACY_KEY] === "object" && !Array.isArray(metadataSource[LEGACY_KEY])
      ? (metadataSource[LEGACY_KEY] as Record<string, unknown>)
      : undefined;

  const tagCandidates = [
    ...(input.tags ?? []),
    ...(Array.isArray(metadataSource?.[TAGS_KEY]) ? ensureStringArray(metadataSource[TAGS_KEY]) : []),
  ];
  const tags = uniqueStrings(tagCandidates);

  const conversationExtra = sanitizeExtras(metadataSource, [
    SUBJECT_KEY,
    TAGS_KEY,
    READ_BY_KEY,
    "receiverId",
    "replyToId",
    "attachments",
    LEGACY_KEY,
  ]);

  const messageExtra = sanitizeExtras(metadataSource, [
    SUBJECT_KEY,
    TAGS_KEY,
    READ_BY_KEY,
    "receiverId",
    "replyToId",
    "attachments",
    LEGACY_KEY,
  ]);

  let conversationIdToUse: string;

  if (conversationId) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true },
    });
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    conversationIdToUse = conversation.id;
  } else {
    const organizationId =
      (await resolveOrganizationId(senderId)) ?? (await resolveOrganizationId(receiverId));

    const conversation = await createConversation({
      organizationId,
      createdById: senderId,
      participants,
      subject: normalizedSubject,
      tags,
      metadata: conversationExtra,
    });
    conversationIdToUse = conversation.id;
  }

  await mergeConversationParticipants(conversationIdToUse, participants);

  if (normalizedSubject || tags.length || (conversationExtra && Object.keys(conversationExtra).length)) {
    const existing = await prisma.conversation.findUnique({
      where: { id: conversationIdToUse },
      select: { metadata: true },
    });

    let conversationMetadata = conversationMetadataFrom(existing?.metadata ?? null);
    let metadataChanged = false;

    if (normalizedSubject && conversationMetadata.subject !== normalizedSubject) {
      conversationMetadata = { ...conversationMetadata, subject: normalizedSubject };
      metadataChanged = true;
    }

    if (tags.length) {
      const mergedTags = Array.from(new Set([...(conversationMetadata.tags ?? []), ...tags]));
      if (JSON.stringify(mergedTags) !== JSON.stringify(conversationMetadata.tags ?? [])) {
        conversationMetadata = { ...conversationMetadata, tags: mergedTags };
        metadataChanged = true;
      }
    }

    if (conversationExtra && Object.keys(conversationExtra).length) {
      conversationMetadata = {
        ...conversationMetadata,
        extra: { ...(conversationMetadata.extra ?? {}), ...conversationExtra },
      };
      metadataChanged = true;
    }

    if (metadataChanged) {
      await prisma.conversation.update({
        where: { id: conversationIdToUse },
        data: { metadata: serializeConversationMetadata(conversationMetadata) },
      });
    }
  }

  const messageMetadata: MessageMetadata = {
    subject: normalizedSubject,
    receiverId,
    replyToId,
    attachments,
    readBy: [senderId],
    legacy: metadataLegacy,
    extra: messageExtra,
  };

  return addMessage({
    conversationId: conversationIdToUse,
    authorId: senderId,
    role: "user",
    content: {
      body: input.body,
    },
    metadata: messageMetadata,
  });
}

export async function getMessages(userId: string, filters?: { threadId?: string; unreadOnly?: boolean }) {
  const conversationIds = filters?.threadId ? [filters.threadId] : await findConversationIds(userId);

  if (conversationIds.length === 0) {
    return [];
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: { in: conversationIds } },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!filters?.unreadOnly) {
    return messages;
  }

  return messages.filter(message => message.authorId !== userId && !hasRead(message.metadata, userId));
}

export async function getMessageById(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      conversation: {
        select: {
          metadata: true,
        },
      },
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!message) {
    throw new Error("Message not found");
  }

  const participants = participantsFromMetadata(message.conversation?.metadata ?? null);
  if (participants.length && !participants.includes(userId) && message.authorId !== userId) {
    throw new Error("Unauthorized");
  }

  return message;
}

export async function markMessageAsRead(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error("Message not found");
  }

  const parsedMetadata = messageMetadataFrom(message.metadata);

  if (parsedMetadata.readBy.includes(userId)) {
    return message;
  }

  parsedMetadata.readBy = Array.from(new Set([...parsedMetadata.readBy, userId]));

  return prisma.message.update({
    where: { id: messageId },
    data: { metadata: serializeMessageMetadata(parsedMetadata) },
  });
}

export async function markThreadAsRead(conversationId: string, userId: string) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    select: { id: true, authorId: true, metadata: true },
  });

  let updated = 0;

  for (const message of messages) {
    if (message.authorId === userId || hasRead(message.metadata, userId)) {
      continue;
    }

    const metadata = messageMetadataFrom(message.metadata);
    metadata.readBy = Array.from(new Set([...metadata.readBy, userId]));
    await prisma.message.update({
      where: { id: message.id },
      data: { metadata: serializeMessageMetadata(metadata) },
    });
    updated += 1;
  }

  return { success: true, count: updated };
}

export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, authorId: true },
  });

  if (!message) {
    throw new Error("Message not found");
  }

  if (message.authorId !== userId) {
    throw new Error("Unauthorized");
  }

  await prisma.message.delete({ where: { id: messageId } });
  return { success: true };
}

export async function getUnreadCount(userId: string) {
  const conversationIds = await findConversationIds(userId);
  if (conversationIds.length === 0) {
    return { count: 0 };
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: { in: conversationIds } },
    select: { authorId: true, metadata: true },
  });

  const count = messages.filter(message => message.authorId !== userId && !hasRead(message.metadata, userId)).length;
  return { count };
}

export async function getThreads(userId: string) {
  const conversationIds = await findConversationIds(userId);
  if (conversationIds.length === 0) {
    return [];
  }

  const [conversations, messages] = await Promise.all([
    prisma.conversation.findMany({
      where: { id: { in: conversationIds } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.message.findMany({
      where: { conversationId: { in: conversationIds } },
      select: { conversationId: true, authorId: true, metadata: true },
    }),
  ]);

  const unreadByConversation = new Map<string, number>();
  for (const message of messages) {
    if (message.authorId === userId) {
      continue;
    }
    if (hasRead(message.metadata, userId)) {
      continue;
    }
    unreadByConversation.set(message.conversationId, (unreadByConversation.get(message.conversationId) ?? 0) + 1);
  }

  return conversations.map(conversation => ({
    id: conversation.id,
    title: conversation.title,
    metadata: conversation.metadata,
    participants: participantsFromMetadata(conversation.metadata),
    unreadCount: unreadByConversation.get(conversation.id) ?? 0,
  }));
}
