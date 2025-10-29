/**
 * Basic Usage Example
 * 
 * This example demonstrates basic SDK initialization and usage
 */

import { NeonHubClient } from '../src';

async function main() {
  // Initialize the client
  const client = new NeonHubClient({
    baseURL: process.env.NEONHUB_API_URL || 'http://localhost:3001',
    apiKey: process.env.NEONHUB_API_KEY || 'test-key',
    debug: true
  });

  console.log('NeonHub SDK Version:', NeonHubClient.version);

  try {
    // Test connectivity
    const health = await client.ping();
    console.log('API Health:', health);

    // List agents
    const agents = await client.agents.list({ limit: 5 });
    console.log(`Found ${agents.length} agents`);

    // List content drafts
    const drafts = await client.content.listDrafts({ limit: 10 });
    console.log(`Found ${drafts.length} drafts`);

    console.log('\n✅ Basic usage example completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export default main;

