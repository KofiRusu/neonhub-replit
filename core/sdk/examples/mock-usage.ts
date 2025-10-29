/**
 * Example: Using SDK with Mock Transport
 * Run this while backend APIs are being built
 */

import { NeonHubClient, setTransport } from '../src';
import { mockTransport } from '../src/mocks';

async function main() {
  // Enable mock transport
  setTransport(mockTransport);

  // Initialize client (API key not needed for mocks)
  const client = new NeonHubClient({
    baseURL: 'http://localhost:4000',
    apiKey: 'mock-key',
  });

  console.log('🎭 Running SDK with Mock Transport\n');

  // 1. Resolve person
  console.log('1️⃣  Resolving person...');
  const person = await client.person.resolve({
    email: 'jane.doe@example.com',
  });
  console.log('   Person ID:', person.person.id);
  console.log('   Name:', person.person.firstName, person.person.lastName);
  console.log('');

  // 2. Get personal memory
  console.log('2️⃣  Fetching memory...');
  const memories = await client.person.getMemory(person.person.id, {
    limit: 5,
  });
  console.log(`   Found ${memories.length} memories:`);
  memories.forEach((m) => console.log(`   - ${m.text.substring(0, 60)}...`));
  console.log('');

  // 3. Compose personalized email
  console.log('3️⃣  Composing email...');
  const composition = await client.voice.compose({
    brandId: 'brand_demo',
    channel: 'email',
    objective: 'demo_book',
    personId: person.person.id,
    constraints: {
      maxLength: 500,
    },
  });
  console.log('   Subject:', composition.subject);
  console.log('   Body:', composition.body.substring(0, 100) + '...');
  console.log(`   Variants: ${composition.variants.length}`);
  console.log('');

  // 4. Run guardrail check
  console.log('4️⃣  Running guardrail check...');
  const check = await client.voice.guardrail(
    'Contact me at bad@email.com or 555-123-4567',
    'email',
    'brand_demo'
  );
  console.log('   Safe:', check.safe);
  console.log('   Violations:', check.violations);
  if (check.redacted) {
    console.log('   Redacted:', check.redacted);
  }
  console.log('');

  // 5. Send email
  console.log('5️⃣  Sending email...');
  const sendResult = await client.send.email({
    personId: person.person.id,
    brandId: 'brand_demo',
    objective: 'demo_book',
    utmParams: {
      source: 'sdk',
      medium: 'email',
      campaign: 'demo',
    },
  });
  console.log('   Send ID:', sendResult.id);
  console.log('   Status:', sendResult.status);
  console.log('');

  // 6. Get timeline
  console.log('6️⃣  Fetching timeline...');
  const timeline = await client.events.getTimeline(person.person.id, {
    limit: 10,
  });
  console.log(`   Found ${timeline.length} events:`);
  timeline.forEach((e) => console.log(`   - ${e.type} at ${new Date(e.ts).toLocaleTimeString()}`));
  console.log('');

  // 7. Budget planning
  console.log('7️⃣  Creating budget plan...');
  const plan = await client.budget.plan({
    workspaceId: 'ws_demo',
    objectives: [
      {
        type: 'demo_book',
        priority: 10,
        targetMetric: 'conversions',
        targetValue: 50,
      },
    ],
    constraints: {
      totalBudget: 500000, // $5000
      period: 'monthly',
      minROAS: 2.5,
    },
    strategy: 'bandit',
  });
  console.log('   Plan ID:', plan.id);
  console.log('   Predicted conversions:', plan.predictions.totalConversions);
  console.log('   Predicted ROAS:', plan.predictions.averageROAS);
  console.log('   Channel breakdown:');
  plan.channels.forEach((c) =>
    console.log(`   - ${c.channel}: $${c.budget / 100} (${c.estimatedConversions} conversions)`)
  );
  console.log('');

  console.log('✅ All mock operations completed successfully!');
}

// Run example
main().catch(console.error);

