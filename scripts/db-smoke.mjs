#!/usr/bin/env node
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

const models = [
  'organization',
  'user',
  'organizationMembership',
  'organizationRole',
  'organizationPermission',
  'rolePermission',
  'brand',
  'brandVoice',
  'brandAsset',
  'embeddingSpace',
  'agent',
  'agentCapability',
  'agentConfig',
  'agentRun',
  'agentRunMetric',
  'agentJob',
  'tool',
  'toolExecution',
  'conversation',
  'message',
  'dataset',
  'document',
  'chunk',
  'campaign',
  'campaignMetric',
  'marketingCampaign',
  'marketingLead',
  'marketingTouchpoint',
  'marketingMetric',
  'content',
  'contentDraft',
  'emailSequence',
  'socialPost',
  'aBTest',
  'connector',
  'connectorAuth',
  'triggerConfig',
  'actionConfig',
  'credential',
  'auditLog',
  'apiKey',
  'person',
  'identity',
  'consent',
  'event',
  'note',
  'memEmbedding',
  'topic',
  'objective',
  'task',
  'feedback',
  'budgetProfile',
  'budgetAllocation',
  'budgetTransaction',
  'budgetLedger',
  'payment',
  'payout',
  'snippetLibrary',
  'persona',
  'keyword',
  'editorialCalendar',
  'modelVersion',
  'trainingJob',
  'inferenceEndpoint',
  'metricEvent',
  'userSettings',
  'subscription',
  'invoice',
  'usageRecord',
  'account',
  'session',
  'verificationToken',
  'teamMember',
];

async function runSmokeTests() {
  console.log('\n📊 Database Smoke Test\n');
  console.log('═'.repeat(60));
  
  const results = [];
  let totalRows = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const model of models) {
    try {
      const count = await prisma[model].count();
      const status = count > 0 ? '✅' : '⚪';
      const line = `${status} ${model.padEnd(30)} ${count.toString().padStart(6)}`;
      console.log(line);
      results.push({ model, count, status: 'success' });
      totalRows += count;
      successCount++;
    } catch (err) {
      const line = `❌ ${model.padEnd(30)} ERROR: ${err.message}`;
      console.log(line);
      results.push({ model, count: 0, status: 'error', error: err.message });
      errorCount++;
    }
  }

  console.log('═'.repeat(60));
  console.log(`\n📈 Summary:`);
  console.log(`   Models checked:     ${models.length}`);
  console.log(`   Successful queries: ${successCount}`);
  console.log(`   Failed queries:     ${errorCount}`);
  console.log(`   Total rows:         ${totalRows.toLocaleString()}`);
  
  // Highlight key omni-channel tables
  console.log(`\n🔌 Omni-Channel Infrastructure:`);
  const connectorCount = results.find(r => r.model === 'connector')?.count || 0;
  const connectorAuthCount = results.find(r => r.model === 'connectorAuth')?.count || 0;
  const agentCount = results.find(r => r.model === 'agent')?.count || 0;
  const toolCount = results.find(r => r.model === 'tool')?.count || 0;
  
  console.log(`   Connectors:         ${connectorCount} (expected: 15+)`);
  console.log(`   Connector Auths:    ${connectorAuthCount}`);
  console.log(`   Agents:             ${agentCount}`);
  console.log(`   Tools:              ${toolCount}`);
  
  // Highlight vector-enabled tables
  console.log(`\n🧠 Vector-Enabled Tables:`);
  const brandVoiceCount = results.find(r => r.model === 'brandVoice')?.count || 0;
  const messageCount = results.find(r => r.model === 'message')?.count || 0;
  const chunkCount = results.find(r => r.model === 'chunk')?.count || 0;
  const agentMemoryCount = results.find(r => r.model === 'agentMemory')?.count || 0;
  
  console.log(`   BrandVoice:         ${brandVoiceCount} (with embeddings)`);
  console.log(`   Messages:           ${messageCount} (with embeddings)`);
  console.log(`   Chunks:             ${chunkCount} (with embeddings)`);
  console.log(`   AgentMemory:        ${agentMemoryCount} (with embeddings)`);
  
  console.log('\n');
  
  if (errorCount > 0) {
    console.error(`⚠️  ${errorCount} model(s) failed. Check schema and migrations.`);
    process.exit(1);
  }
  
  await prisma.$disconnect();
}

runSmokeTests().catch((error) => {
  console.error('❌ Smoke test failed:', error);
  process.exit(1);
});
