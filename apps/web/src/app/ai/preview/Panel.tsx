'use client'
import React from 'react'

type Task = {
  objective: string
  channel?: 'blog' | 'email' | 'social'
  tone?: string
  audience?: string
}

async function runREST(task: Task) {
  const res = await fetch('/api/ai/preview', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(task),
  })
  return res.json()
}

export default function Panel() {
  const [task, setTask] = React.useState<Task>({
    objective: 'Announce NeonHub beta',
    channel: 'blog',
    tone: 'modern',
    audience: 'founders',
  })
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<any>(null)

  async function run() {
    setLoading(true)
    setData(null)
    try {
      const trpcRunner = (typeof window !== 'undefined' && (window as any).__ai_trpc__) as
        | undefined
        | ((payload: Task) => Promise<any>)
      if (trpcRunner) {
        setData(await trpcRunner(task))
      } else {
        setData(await runREST(task))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="rounded-md bg-white/5 p-2 border border-white/10"
          value={task.objective}
          onChange={(e) => setTask({ ...task, objective: e.target.value })}
        />
        <input
          className="rounded-md bg-white/5 p-2 border border-white/10"
          value={task.audience}
          placeholder="audience"
          onChange={(e) => setTask({ ...task, audience: e.target.value })}
        />
        <select
          className="rounded-md bg-white/5 p-2 border border-white/10"
          value={task.channel}
          onChange={(e) => setTask({ ...task, channel: e.target.value as Task['channel'] })}
        >
          <option value="blog">Blog</option>
          <option value="email">Email</option>
          <option value="social">Social</option>
        </select>
        <input
          className="rounded-md bg-white/5 p-2 border border-white/10"
          value={task.tone}
          placeholder="tone"
          onChange={(e) => setTask({ ...task, tone: e.target.value })}
        />
      </div>
      <button
        onClick={run}
        disabled={loading}
        className="rounded-lg px-4 py-2 bg-white/10 border border-white/20 hover:bg-white/15"
      >
        {loading ? 'Running…' : 'Run Preview'}
      </button>
      {data && (
        <div className="space-y-2">
          <div>
            <b>Score:</b>{' '}
            {data?.score?.total !== undefined ? `${(data.score.total * 100).toFixed(1)}%` : '—'}
          </div>
          <pre className="text-xs whitespace-pre-wrap overflow-auto border border-white/10 rounded p-3 bg-white/5">
            {data?.draft || ''}
          </pre>
        </div>
      )}
    </section>
  )
}
