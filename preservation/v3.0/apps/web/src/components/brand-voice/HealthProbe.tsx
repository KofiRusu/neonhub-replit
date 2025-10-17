"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE, http } from "@/src/lib/api";
import { r, type RouteKey } from "@/src/lib/route-map";

type Probe = { k: RouteKey; method: "GET" | "POST" };
type Result = { k: RouteKey; path: string; method: string; status: number };

const PROBES: Probe[] = [
  { k: "content_generatePost", method: "POST" },
  { k: "seo_audit", method: "POST" },
  { k: "email_sequence", method: "POST" },
  { k: "support_reply", method: "POST" },
  { k: "trends_brief", method: "POST" },
  { k: "analytics_execSummary", method: "POST" },
  { k: "brandVoice_profile", method: "GET" },
  { k: "brandVoice_search", method: "GET" },
  { k: "analytics_brandVoiceKpis", method: "GET" },
];

export default function HealthProbe() {
  const [results, setResults] = useState<Result[] | null>(null);

  useEffect(() => {
    let mounted = true;
    async function run() {
      const out: Result[] = [];
      for (const p of PROBES) {
        try {
          const path = r(p.k);
          const url = `api/${path}`;
          const res = await fetch(`/${url}`, {
            method: p.method,
            headers: p.method === "POST" ? { "content-type": "application/json" } : undefined,
            body: p.method === "POST" ? "{}" : undefined,
            cache: "no-store",
          });
          out.push({ k: p.k, path, method: p.method, status: res.status });
        } catch {
          out.push({ k: p.k, path: r(p.k), method: p.method, status: 0 });
        }
      }
      if (mounted) setResults(out);
    }
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Card className="backdrop-blur supports-[backdrop-filter]:bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Brand Voice Endpoint Health</CardTitle>
      </CardHeader>
      <CardContent>
        {!API_BASE && (
          <div className="text-amber-300 text-sm mb-3 bg-amber-500/10 border border-amber-400/30 rounded p-2">
            Set NEXT_PUBLIC_API_URL in .env.local to point to your backend.
          </div>
        )}
        {!results && <div className="text-sm text-white/60">Probing…</div>}
        {results && (
          <div className="text-sm space-y-1">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="text-white/80">
                  <span className="text-white/60 mr-2">{r.method}</span>
                  /{r.path}
                </div>
                <span className="text-xs text-white/60 px-2 py-0.5 rounded border border-white/10 bg-white/5 mr-2">{r.k}</span>
                <div className={r.status === 200 ? "text-emerald-400" : r.status === 404 ? "text-amber-300" : "text-rose-300"}>
                  {r.status || "ERR"}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


