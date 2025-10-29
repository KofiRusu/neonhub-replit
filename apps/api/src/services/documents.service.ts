import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { logger } from "../lib/logger.js";

const TYPE_KEY = "type";
const TAGS_KEY = "tags";
const VERSION_KEY = "version";
const PREVIOUS_KEY = "previousDocumentId";

export interface CreateDocumentInput {
  title: string;
  content: string;
  status?: string;
  type?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  status?: string;
  type?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
}

const toRecord = (value: Prisma.JsonValue | null | undefined): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return { ...(value as Record<string, unknown>) };
};

const mergeMetadata = (
  existing: Prisma.JsonValue | null | undefined,
  updates: Record<string, unknown | undefined | null>
): Prisma.InputJsonValue | undefined => {
  const base = toRecord(existing);

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      continue;
    }
    if (value === null) {
      delete base[key];
      continue;
    }
    base[key] = value;
  }

  return Object.keys(base).length ? (base as Prisma.InputJsonValue) : undefined;
};

async function resolveOrganizationId(userId: string): Promise<string> {
  const membership = await prisma.organizationMembership.findFirst({
    where: { userId },
    select: { organizationId: true },
  });

  if (!membership) {
    throw new Error("Organization context not found");
  }

  return membership.organizationId;
}

export async function createDocument(userId: string, input: CreateDocumentInput) {
  try {
    const organizationId = await resolveOrganizationId(userId);

    const metadataPayload: Record<string, unknown> = {
      ...(input.metadata ?? {}),
    };

    if (input.type) {
      metadataPayload[TYPE_KEY] = input.type;
    }
    if (input.tags) {
      metadataPayload[TAGS_KEY] = input.tags;
    }
    metadataPayload[VERSION_KEY] = 1;

    const metadata = mergeMetadata(null, metadataPayload);

    const document = await prisma.document.create({
      data: {
        title: input.title,
        content: input.content,
        ...(input.status ? { status: input.status } : {}),
        ...(metadata ? { metadata } : {}),
        owner: {
          connect: { id: userId },
        },
        organization: {
          connect: { id: organizationId },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info({ documentId: document.id, userId }, "Document created");
    return document;
  } catch (error) {
    logger.error({ error, userId }, "Failed to create document");
    throw error;
  }
}

export async function getDocuments(userId: string, filters?: { status?: string; type?: string }) {
  try {
    const where: Prisma.DocumentWhereInput = {
      ownerId: userId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.type
        ? {
            metadata: {
              path: [TYPE_KEY],
              equals: filters.type,
            },
          }
        : {}),
    };

    const documents = await prisma.document.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return documents;
  } catch (error) {
    logger.error({ error, userId }, "Failed to fetch documents");
    throw error;
  }
}

export async function getDocumentById(documentId: string, userId: string) {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    return document;
  } catch (error) {
    logger.error({ error, documentId, userId }, "Failed to fetch document");
    throw error;
  }
}

export async function updateDocument(documentId: string, userId: string, input: UpdateDocumentInput) {
  try {
    const existing = await prisma.document.findFirst({
      where: {
        id: documentId,
        ownerId: userId,
      },
    });

    if (!existing) {
      throw new Error("Document not found");
    }

    const metadataUpdates: Record<string, unknown | null> = {
      ...(input.metadata ?? {}),
    };

    if (input.type !== undefined) {
      metadataUpdates[TYPE_KEY] = input.type;
    }
    if (input.tags !== undefined) {
      metadataUpdates[TAGS_KEY] = input.tags;
    }

    const metadata = mergeMetadata(existing.metadata, metadataUpdates);

    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.content ? { content: input.content } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(metadata !== undefined ? { metadata } : {}),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info({ documentId, userId }, "Document updated");
    return document;
  } catch (error) {
    logger.error({ error, documentId, userId }, "Failed to update document");
    throw error;
  }
}

export async function createDocumentVersion(documentId: string, userId: string) {
  try {
    const original = await prisma.document.findFirst({
      where: {
        id: documentId,
        ownerId: userId,
      },
    });

    if (!original) {
      throw new Error("Document not found");
    }

    const originalMetadata = toRecord(original.metadata);
    const currentVersion = typeof originalMetadata[VERSION_KEY] === "number" ? (originalMetadata[VERSION_KEY] as number) : 1;

    const newMetadata = {
      ...originalMetadata,
      [VERSION_KEY]: currentVersion + 1,
      [PREVIOUS_KEY]: documentId,
    } as Record<string, unknown>;

    const newVersion = await prisma.document.create({
      data: {
        title: `${original.title} (v${currentVersion + 1})`,
        content: original.content,
        status: "draft",
        metadata: newMetadata as Prisma.InputJsonValue,
        owner: {
          connect: { id: userId },
        },
        organization: {
          connect: { id: original.organizationId },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info({ documentId, newVersionId: newVersion.id, userId }, "Document version created");
    return newVersion;
  } catch (error) {
    logger.error({ error, documentId, userId }, "Failed to create document version");
    throw error;
  }
}

export async function deleteDocument(documentId: string, userId: string) {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        ownerId: userId,
      },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    logger.info({ documentId, userId }, "Document deleted");
    return { success: true };
  } catch (error) {
    logger.error({ error, documentId, userId }, "Failed to delete document");
    throw error;
  }
}
