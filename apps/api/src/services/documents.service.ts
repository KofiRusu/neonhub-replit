import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { logger } from '../lib/logger.js';

export interface CreateDocumentInput {
  title: string;
  content: string;
  type?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  type?: string;
  status?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export async function createDocument(userId: string, input: CreateDocumentInput) {
  try {
    const document = await prisma.document.create({
      data: {
        title: input.title,
        content: input.content,
        type: input.type || 'general',
        tags: input.tags || [],
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
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

    logger.info({ documentId: document.id, userId }, 'Document created');
    return document;
  } catch (error) {
    logger.error({ error, userId }, 'Failed to create document');
    throw error;
  }
}

export async function getDocuments(userId: string, filters?: { status?: string; type?: string }) {
  try {
    const where: any = { ownerId: userId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.type) {
      where.type = filters.type;
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
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
    logger.error({ error, userId }, 'Failed to fetch documents');
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
        versions: {
          orderBy: { version: 'desc' },
          take: 5,
        },
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    return document;
  } catch (error) {
    logger.error({ error, documentId, userId }, 'Failed to fetch document');
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
      throw new Error('Document not found');
    }

    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.content && { content: input.content }),
        ...(input.type && { type: input.type }),
        ...(input.status && { status: input.status }),
        ...(input.tags && { tags: input.tags }),
        ...(input.metadata && { metadata: input.metadata as Prisma.InputJsonValue }),
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

    logger.info({ documentId, userId }, 'Document updated');
    return document;
  } catch (error) {
    logger.error({ error, documentId, userId }, 'Failed to update document');
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
      throw new Error('Document not found');
    }

    const newVersion = await prisma.document.create({
      data: {
        title: `${original.title} (v${original.version + 1})`,
        content: original.content,
        type: original.type,
        status: 'draft',
        version: original.version + 1,
        tags: original.tags,
        metadata: original.metadata,
        ownerId: userId,
        parentId: documentId,
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

    logger.info({ documentId, newVersionId: newVersion.id, userId }, 'Document version created');
    return newVersion;
  } catch (error) {
    logger.error({ error, documentId, userId }, 'Failed to create document version');
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
      throw new Error('Document not found');
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    logger.info({ documentId, userId }, 'Document deleted');
    return { success: true };
  } catch (error) {
    logger.error({ error, documentId, userId }, 'Failed to delete document');
    throw error;
  }
}
