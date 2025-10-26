import { NextResponse } from "next/server";
import { r } from "@/src/lib/route-map";
import { getBrandVoiceKpisFallback } from "@/src/server/brand-voice-data";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  if (API) {
    try {
      const upstream = await fetch(`${API.replace(/\/$/, "")}/${r("analytics_brandVoiceKpis")}`, {
        cache: "no-store",
      });
      if (upstream.ok) {
        const result = await upstream.json();
        if (result && typeof result === "object" && "ok" in result) {
          if (result.ok) {
            return NextResponse.json(result.data ?? null);
          }
          return NextResponse.json({ error: result.error ?? "Request failed" }, { status: 502 });
        }
        return NextResponse.json(result);
      }
    } catch {
      // fall back to local metrics
    }
  }

  try {
    const kpis = await getBrandVoiceKpisFallback();
    return NextResponse.json(kpis);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load KPIs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

