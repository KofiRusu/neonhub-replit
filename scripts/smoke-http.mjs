#!/usr/bin/env node

const ORIGIN = process.env.API_ORIGIN || 'http://localhost:3001'

async function get(path) {
  const res = await fetch(ORIGIN + path)
  const text = await res.text()
  return { status: res.status, body: text }
}

async function post(path, payload, headers = {}) {
  const res = await fetch(ORIGIN + path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  return { status: res.status, body: text }
}

;(async () => {
  console.log('== Smoke: /api/health ==')
  console.log(await get('/api/health'))

  console.log('== Smoke: Stripe webhook (mock) ==')
  console.log(
    await post(
      '/api/webhooks/stripe',
      { id: 'evt_mock_123', type: 'payment_intent.succeeded' },
      { 'X-Mock-Event': 'payment_intent.succeeded' }
    )
  )

  console.log('== Smoke: internal settlement ==')
  console.log(await post('/api/internal/settlement', {}))
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
