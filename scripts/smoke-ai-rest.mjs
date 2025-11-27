#!/usr/bin/env node

const origin = process.env.API_ORIGIN || 'http://localhost:3001';

async function main() {
  const payload = {
    objective: 'Hello world post',
    channel: 'blog',
    tone: 'modern',
    audience: 'devs',
  };
  const res = await fetch(`${origin}/api/ai/preview`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  console.log('status=', res.status);
  console.log(text.slice(0, 400));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
