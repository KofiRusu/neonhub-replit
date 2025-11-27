# @neonhub/memory-rag

Memory & RAG (Retrieval Augmented Generation) system with profile, conversation, and knowledge base stores using pgvector.

## Features

- 👤 **Profile Store** - User preferences, facts, and personalization
- 💬 **Conversation Store** - Chat history with embeddings and summaries
- 📚 **Knowledge Base** - Document ingestion, chunking, and vector search
- 🔍 **Semantic Search** - pgvector-powered similarity search
- 🎯 **Type-Safe** - Zod schemas for all data structures
- 📊 **Statistics** - Usage tracking and analytics

## Installation

```bash
pnpm add @neonhub/memory-rag
```

## Prerequisites

### Prisma Schema

Add these models to your `schema.prisma`:

```prisma
model ProfileMemory {
  id String @id
  userId String
  key String
  value Json
  category String?
  confidence Float @default(1.0)
  source String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  expiresAt DateTime?

  @@unique([userId, key])
  @@index([userId, category])
}

model ConversationMessage {
  id String @id
  conversationId String
  role String
  content String @db.Text
  metadata Json?
  embedding Unsupported("vector(1536)")?
  createdAt DateTime @default(now())

  @@index([conversationId, createdAt])
}

model ConversationSummary {
  conversationId String @id
  summary String @db.Text
  topics String[]
  sentiment String?
  keyPoints String[]
  createdAt DateTime @default(now())
}

model KBDocument {
  id String @id
  type String
  entityId String?
  title String
  content String @db.Text
  metadata Json?
  tags String[]
  version String @default("1.0.0")
  status String @default("published")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  chunks KBChunk[]

  @@index([type, entityId])
  @@index([status])
}

model KBChunk {
  id String @id
  documentId String
  content String @db.Text
  embedding Unsupported("vector(1536)")
  metadata Json?
  chunkIndex Int
  tokens Int?
  createdAt DateTime @default(now())

  document KBDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@index([documentId])
}
```

### Enable pgvector

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Create indexes for better performance
CREATE INDEX ON "ConversationMessage" USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON "KBChunk" USING ivfflat (embedding vector_cosine_ops);
```

## Usage

### Profile Store

```typescript
import { PrismaClient } from '@prisma/client';
import { ProfileStore } from '@neonhub/memory-rag';

const prisma = new PrismaClient();
const profileStore = new ProfileStore(prisma);

// Store user preference
await profileStore.set('user_123', 'preferred_tone', 'professional', {
  category: 'preferences',
  confidence: 0.9,
  source: 'user_input',
  ttl: 86400 * 30, // 30 days
});

// Get preference
const tone = await profileStore.get('user_123', 'preferred_tone');

// Get all preferences
const prefs = await profileStore.getAll('user_123', { category: 'preferences' });

// Search
const results = await profileStore.search('user_123', 'tone');

// Stats
const stats = await profileStore.getStats('user_123');
```

### Conversation Store

```typescript
import { ConversationStore, SimpleEmbeddingProvider } from '@neonhub/memory-rag';

// Create embedding provider (integrate with @neonhub/llm-adapter)
const embeddingProvider = new SimpleEmbeddingProvider(
  async (texts) => {
    // Your embedding logic
    return await adapter.embed({ texts, model: 'text-embedding-ada-002' });
  },
  1536 // dimension
);

const conversationStore = new ConversationStore(prisma, embeddingProvider);

// Add messages
await conversationStore.addMessage('conv_123', 'user', 'What is AI?');
await conversationStore.addMessage('conv_123', 'assistant', 'AI is...');

// Get history
const history = await conversationStore.getHistory('conv_123', { limit: 50 });

// Semantic search in conversation
const similar = await conversationStore.searchSimilar(
  'conv_123',
  'machine learning',
  { topK: 5, minScore: 0.7 }
);

// Create summary
await conversationStore.summarize('conv_123', 'Discussion about AI concepts', {
  topics: ['AI', 'machine learning'],
  sentiment: 'positive',
  keyPoints: ['AI definition', 'ML applications'],
});

// Prune old messages
await conversationStore.pruneOldMessages('conv_123', 100);
```

### Knowledge Base Store

```typescript
import { KBStore } from '@neonhub/memory-rag';

const kbStore = new KBStore(prisma, embeddingProvider);

// Ingest document
await kbStore.ingest(
  'brand',
  'Brand Voice Guidelines',
  `Our brand voice is professional yet friendly...`,
  {
    entityId: 'brand_xyz',
    tags: ['voice', 'guidelines'],
    metadata: { author: 'Marketing Team' },
    chunkSize: 500,
    chunkOverlap: 50,
  }
);

// Retrieve relevant chunks
const results = await kbStore.retrieve('What is our brand voice?', {
  topK: 5,
  minScore: 0.75,
  filters: {
    type: 'brand',
    entityId: 'brand_xyz',
    status: 'published',
  },
});

for (const result of results) {
  console.log('Score:', result.score);
  console.log('Content:', result.chunk.content);
  console.log('Document:', result.document.title);
}

// Update document
await kbStore.updateDocument('doc_123', {
  content: 'Updated content...',
  status: 'published',
});

// Search documents
const docs = await kbStore.searchDocuments({
  type: 'product',
  tags: ['features'],
  query: 'pricing',
});

// Stats
const stats = await kbStore.getStats();
console.log(stats); // { totalDocuments, totalChunks, byType, byStatus }
```

## RAG Pattern

Complete RAG implementation example:

```typescript
import { OpenAIAdapter } from '@neonhub/llm-adapter';
import { KBStore, SimpleEmbeddingProvider } from '@neonhub/memory-rag';

async function ragQuery(query: string, entityId?: string) {
  // 1. Retrieve relevant context
  const context = await kbStore.retrieve(query, {
    topK: 5,
    minScore: 0.7,
    filters: { entityId, status: 'published' },
  });

  // 2. Format context for prompt
  const contextText = context
    .map((r, i) => `[${i + 1}] ${r.chunk.content}`)
    .join('\n\n');

  // 3. Generate response with context
  const response = await llmAdapter.chat({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Answer the question based on the following context:\n\n${contextText}`,
      },
      {
        role: 'user',
        content: query,
      },
    ],
  });

  // 4. Return with citations
  return {
    answer: response.content,
    sources: context.map((r) => ({
      title: r.document.title,
      score: r.score,
      excerpt: r.chunk.content.substring(0, 200),
    })),
  };
}

// Usage
const result = await ragQuery('What are our product features?', 'product_123');
console.log(result.answer);
console.log('Sources:', result.sources);
```

## Embedding Integration

Integrate with LLM adapter:

```typescript
import { OpenAIAdapter } from '@neonhub/llm-adapter';
import { SimpleEmbeddingProvider } from '@neonhub/memory-rag';

const adapter = new OpenAIAdapter({ apiKey: process.env.OPENAI_API_KEY! });

const embeddingProvider = new SimpleEmbeddingProvider(
  async (texts) => {
    return await adapter.embed({
      texts,
      model: 'text-embedding-ada-002',
    });
  },
  1536
);
```

## Vector Search Strategies

### Cosine Similarity

```sql
-- Find most similar chunks
SELECT *, 1 - (embedding <=> $1::vector) as score
FROM "KBChunk"
ORDER BY embedding <=> $1::vector
LIMIT 5;
```

### With Filters

```sql
SELECT c.*, d.*, 1 - (c.embedding <=> $1::vector) as score
FROM "KBChunk" c
JOIN "KBDocument" d ON c."documentId" = d.id
WHERE d.type = $2 AND d.status = 'published'
ORDER BY c.embedding <=> $1::vector
LIMIT $3;
```

## Performance Tips

1. **Index Strategy**: Use IVFFlat for large datasets (>100K vectors)
2. **Chunking**: Balance between context (larger chunks) and precision (smaller chunks)
3. **Overlap**: 10-20% overlap helps maintain context across chunks
4. **Caching**: Cache frequent queries and embeddings
5. **Batch Operations**: Generate embeddings in batches for efficiency

## Testing

```bash
pnpm test
```

## Migration

If migrating from an existing system:

```typescript
// Export from old system
const oldData = await oldSystem.export();

// Import to new system
for (const doc of oldData.documents) {
  await kbStore.ingest(
    doc.type,
    doc.title,
    doc.content,
    { entityId: doc.entityId, tags: doc.tags }
  );
}

// Rebuild embeddings if needed
await kbStore.rebuildEmbeddings();
```

## License

MIT

