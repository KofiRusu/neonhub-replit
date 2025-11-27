'use client'
import React from 'react'

export default function AIPreviewPage() {
  const [objective, setObjective] = React.useState('Announce NeonHub beta')
  const [channel, setChannel] = React.useState<'blog' | 'email' | 'social'>('blog')
  const [tone, setTone] = React.useState('modern')
  const [audience, setAudience] = React.useState('founders')
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<any>(null)

  async function run() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai/preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ objective, channel, tone, audience }),
      })
      const json = await res.json()
      setResult(json)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">AI Preview</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col text-sm">
          Objective
          <input
            className="mt-1 rounded-md bg-white/5 p-2 border border-white/10"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
          />
        </label>
        <label className="flex flex-col text-sm">
          Audience
          <input
            className="mt-1 rounded-md bg-white/5 p-2 border border-white/10"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          />
        </label>
        <label className="flex flex-col text-sm">
          Channel
          <select
            className="mt-1 rounded-md bg-white/5 p-2 border border-white/10"
            value={channel}
            onChange={(e) => setChannel(e.target.value as any)}
          >
            <option value="blog">Blog</option>
            <option value="email">Email</option>
            <option value="social">Social</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Tone
          <input
            className="mt-1 rounded-md bg-white/5 p-2 border border-white/10"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          />
        </label>
      </div>
      <button
        onClick={run}
        disabled={loading}
        className="rounded-lg px-4 py-2 bg-white/10 border border-white/20 hover:bg-white/15"
      >
        {loading ? 'Running…' : 'Run Preview'}
      </button>
      {result && (
        <section className="mt-4 space-y-3">
          <div>
            <b>Score:</b>{' '}
            {result.score?.total !== undefined ? `${(result.score.total * 100).toFixed(1)}%` : '—'}
          </div>
          <div className="whitespace-pre-wrap text-sm opacity-90">
            <b>Draft:</b>
            {'\n'}
            {result.draft}
          </div>
          <details className="text-sm opacity-80">
            <summary>Details</summary>
            <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </details>
        </section>
      )}
    </main>
  )
}
