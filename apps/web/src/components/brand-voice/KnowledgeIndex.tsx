"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KnowledgeItem } from "@/src/types/brand-voice";
import { http } from "@/src/lib/api";
import { r } from "@/src/lib/route-map";

type Filters = { type?: string; agent?: string };

export default function KnowledgeIndex() {
  const [q, setQ] = useState("");
  const [filters] = useState<Filters>({});
  const [items, setItems] = useState<KnowledgeItem[] | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    async function fetchIndex() {
      try {
        // GET /brand-voice/search?q=...&type=...&agent=...
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (filters.type) params.set("type", filters.type);
        if (filters.agent) params.set("agent", filters.agent);
        const data = await http<KnowledgeItem[]>(`${r("brandVoice_search")}${params.toString() ? `?${params.toString()}` : ""}`);
        if (!mounted) return;
        setItems(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setItems(undefined);
      }
    }
    void fetchIndex();
    return () => {
      mounted = false;
    };
  }, [q, filters]);

  const hasData = (items?.length ?? 0) > 0;

  return (
    <Card className="backdrop-blur supports-[backdrop-filter]:bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Knowledge Index</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input placeholder="Search docs, briefs, references…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {!hasData && (
          <div className="text-sm text-white/70">
            No knowledge data. TODO: Wire to <code>api.brandVoice.search.query()</code> and render results with actions: Open, Copy ref, Insert.
          </div>
        )}
        {hasData && (
          <div className="space-y-2">
            {items!.map((it) => (
              <div key={it.id} className="flex items-center justify-between text-sm text-white/80">
                <div>
                  <div className="font-medium text-white">{it.title}</div>
                  <div className="text-white/60 text-xs">{it.type} · {it.ref}</div>
                </div>
                <div className="flex gap-2 text-xs">
                  <button className="text-neon-blue">Open</button>
                  <button className="text-neon-purple">Copy ref</button>
                  <button className="text-neon-green">Insert</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


