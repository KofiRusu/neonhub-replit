"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { http } from "@/src/lib/api";
import { r } from "@/src/lib/route-map";

type KpiData = {
  toneConsistency: number;
  readability: number;
  recentWins: number;
  alerts: number;
};

export default function InsightsStrip() {
  const [kpis, setKpis] = useState<KpiData | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    async function fetchKpis() {
      try {
        // GET /analytics/brand-voice-kpis
        const data = await http<KpiData>(r("analytics_brandVoiceKpis"));
        if (!mounted) return;
        setKpis(data);
      } catch {
        if (!mounted) return;
        setKpis(undefined);
      }
    }
    void fetchKpis();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-white/10 text-white/90">Tone Consistency: {kpis?.toneConsistency ?? "—"}%</Badge>
      <Badge className="bg-white/10 text-white/90">Readability: {kpis?.readability ?? "—"}</Badge>
      <Badge className="bg-white/10 text-white/90">Recent Wins: {kpis?.recentWins ?? "—"}</Badge>
      <Badge className="bg-white/10 text-white/90">Alerts: {kpis?.alerts ?? "—"}</Badge>
    </div>
  );
}


