// Air-gap analytics: returns mock summary/trends without external deps.
export type Period = '24h'|'7d'|'30d'|'90d';
export function getSummary(period: Period = '30d'){
  return {
    period,
    totals: { events: 12345, jobsProcessed: 678, conversions: 42, successRate: 0.94 },
    agents: [
      { name: 'ContentAgent', success: 182, fail: 6, avgMs: 320 },
      { name: 'SEOAgent',     success: 140, fail: 9, avgMs: 410 },
      { name: 'EmailAgent',   success: 220, fail: 4, avgMs: 290 },
    ]
  };
}
export function getTrends(period: Period = '30d'){
  return Array.from({length: 12}, (_,i)=>({ t: i, value: Math.round(50 + 10*Math.sin(i)) }));
}
