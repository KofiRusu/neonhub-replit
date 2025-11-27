import { PrismaClient } from '@prisma/client';
import pino from 'pino';
import { ConversationMessage, ConversationSummary, EmbeddingProvider } from './types.js';

const logger = pino({ name: 'conversation-store' });

/**
 * Conversation memory store with embeddings and summaries
 */
export class ConversationStore {
  constructor(
    private prisma: PrismaClient,
    private embeddingProvider?: EmbeddingProvider
  ) {}

  /**
   * Add a message to conversation
   */
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system' | 'function',
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<ConversationMessage> {
    logger.info({ conversationId, role }, 'Adding conversation message');

    // Generate embedding if provider available
    let embedding: number[] | undefined;
    if (this.embeddingProvider && role !== 'system') {
      const embeddings = await this.embeddingProvider.embed([content]);
      embedding = embeddings[0];
    }

    const message: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      role,
      content,
      metadata,
      embedding,
      createdAt: new Date(),
    };

    // Store in database
    // await this.prisma.conversationMessage.create({ data: message })

    logger.info({ messageId: message.id }, 'Message added');
    return message;
  }

  /**
   * Get conversation history
   */
  async getHistory(
    conversationId: string,
    options: { limit?: number; offset?: number; before?: Date } = {}
  ): Promise<ConversationMessage[]> {
    logger.info({ conversationId, ...options }, 'Retrieving conversation history');

    // const messages = await this.prisma.conversationMessage.findMany({
    //   where: {
    //     conversationId,
    //     createdAt: options.before ? { lt: options.before } : undefined
    //   },
    //   orderBy: { createdAt: 'asc' },
    //   take: options.limit,
    //   skip: options.offset
    // })

    return [];
  }

  /**
   * Get recent messages
   */
  async getRecent(
    conversationId: string,
    count = 10
  ): Promise<ConversationMessage[]> {
    return this.getHistory(conversationId, { limit: count });
  }

  /**
   * Search messages by semantic similarity
   */
  async searchSimilar(
    conversationId: string,
    query: string,
    options: { topK?: number; minScore?: number } = {}
  ): Promise<Array<{ message: ConversationMessage; score: number }>> {
    if (!this.embeddingProvider) {
      throw new Error('Embedding provider required for similarity search');
    }

    logger.info({ conversationId, query }, 'Searching similar messages');

    // Generate query embedding
    const [queryEmbedding] = await this.embeddingProvider.embed([query]);

    // Vector similarity search using pgvector
    // const results = await this.prisma.$queryRaw`
    //   SELECT *, 1 - (embedding <=> ${queryEmbedding}::vector) as score
    //   FROM ConversationMessage
    //   WHERE conversation_id = ${conversationId}
    //   ORDER BY embedding <=> ${queryEmbedding}::vector
    //   LIMIT ${options.topK || 5}
    // `

    return [];
  }

  /**
   * Create conversation summary
   */
  async summarize(
    conversationId: string,
    summary: string,
    options: {
      topics?: string[];
      sentiment?: 'positive' | 'neutral' | 'negative';
      keyPoints?: string[];
    } = {}
  ): Promise<ConversationSummary> {
    logger.info({ conversationId }, 'Creating conversation summary');

    const summaryDoc: ConversationSummary = {
      conversationId,
      summary,
      topics: options.topics || [],
      sentiment: options.sentiment,
      keyPoints: options.keyPoints,
      createdAt: new Date(),
    };

    // await this.prisma.conversationSummary.create({ data: summaryDoc })

    logger.info({ conversationId }, 'Summary created');
    return summaryDoc;
  }

  /**
   * Get conversation summary
   */
  async getSummary(conversationId: string): Promise<ConversationSummary | null> {
    // return await this.prisma.conversationSummary.findUnique({
    //   where: { conversationId }
    // })
    return null;
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string): Promise<number> {
    logger.info({ conversationId }, 'Deleting conversation');

    // const messageCount = await this.prisma.conversationMessage.deleteMany({
    //   where: { conversationId }
    // })
    // await this.prisma.conversationSummary.delete({
    //   where: { conversationId }
    // })

    return 0;
  }

  /**
   * Get conversation statistics
   */
  async getStats(conversationId: string): Promise<{
    messageCount: number;
    byRole: Record<string, number>;
    duration: number; // milliseconds
    hasSummary: boolean;
  }> {
    // const messages = await this.prisma.conversationMessage.findMany({
    //   where: { conversationId },
    //   select: { role: true, createdAt: true }
    // })

    return {
      messageCount: 0,
      byRole: {},
      duration: 0,
      hasSummary: false,
    };
  }

  /**
   * Prune old messages beyond window
   */
  async pruneOldMessages(
    conversationId: string,
    keepCount = 50
  ): Promise<number> {
    logger.info({ conversationId, keepCount }, 'Pruning old messages');

    // Get messages to delete
    // const toDelete = await this.prisma.conversationMessage.findMany({
    //   where: { conversationId },
    //   orderBy: { createdAt: 'desc' },
    //   skip: keepCount,
    //   select: { id: true }
    // })

    // const deleted = await this.prisma.conversationMessage.deleteMany({
    //   where: { id: { in: toDelete.map(m => m.id) } }
    // })

    return 0;
  }
}

