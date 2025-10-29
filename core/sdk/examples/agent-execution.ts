/**
 * Agent Execution Example
 * 
 * This example demonstrates how to execute agents and wait for results
 */

import { NeonHubClient } from '../src';

async function main() {
  const client = new NeonHubClient({
    baseURL: process.env.NEONHUB_API_URL || 'http://localhost:3001',
    apiKey: process.env.NEONHUB_API_KEY || 'test-key'
  });

  try {
    console.log('🚀 Executing agent...\n');

    // Execute an agent
    const result = await client.agents.execute({
      agent: 'content-agent',
      input: {
        topic: 'AI-Powered Marketing Automation in 2025',
        tone: 'professional',
        audience: 'B2B marketers',
        wordCount: 500
      },
      organizationId: 'org_test'
    });

    console.log('Job ID:', result.id);
    console.log('Status:', result.status);

    // If not immediately completed, wait for it
    if (result.status !== 'completed') {
      console.log('\n⏳ Waiting for completion...\n');
      
      const completed = await client.agents.waitForCompletion(result.id, {
        timeout: 60000, // 60 seconds
        pollInterval: 2000 // Poll every 2 seconds
      });

      console.log('✅ Agent completed!');
      console.log('Output:', JSON.stringify(completed.output, null, 2));
      
      if (completed.metrics) {
        console.log('\nMetrics:', JSON.stringify(completed.metrics, null, 2));
      }
    } else {
      console.log('✅ Agent completed immediately!');
      console.log('Output:', result.output);
    }

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

