"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { http } from "@/src/lib/api";
import { r } from "@/src/lib/route-map";

type KpiApiData = {
  toneConsistency: number;
  readability: number;
  recentWins: number;
  alerts: number;
};

type KpiSummary = {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
};

interface InsightsStripProps {
  kpis?: KpiSummary[];
}

export default function InsightsStrip({ kpis: overrideKpis }: InsightsStripProps) {
  const [kpis, setKpis] = useState<KpiApiData | undefined>(undefined);

  useEffect(() => {
    if (overrideKpis) {
      return;
    }
    let mounted = true;
    async function fetchKpis() {
      try {
        // GET /analytics/brand-voice-kpis
        const data = await http<KpiApiData>(r("analytics_brandVoiceKpis"));
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
  }, [overrideKpis]);

  if (overrideKpis && overrideKpis.length > 0) {
    return (
      <div className="flex flex-wrap gap-2">
        {overrideKpis.map(({ label, value }) => (
          <Badge key={label} className="bg-white/10 text-white/90">
            {label}: {value}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-white/10 text-white/90">Tone Consistency: {kpis?.toneConsistency ?? "—"}%</Badge>
      <Badge className="bg-white/10 text-white/90">Readability: {kpis?.readability ?? "—"}</Badge>
      <Badge className="bg-white/10 text-white/90">Recent Wins: {kpis?.recentWins ?? "—"}</Badge>
      <Badge className="bg-white/10 text-white/90">Alerts: {kpis?.alerts ?? "—"}</Badge>
    </div>
  );
}

