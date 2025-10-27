import { NextResponse } from "next/server";
import { r } from "@/src/lib/route-map";
import { generateEmailSequenceFallback } from "@/src/server/brand-voice-data";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({}));

  if (API) {
    try {
      const upstream = await fetch(`${API.replace(/\/$/, "")}/${r("email_sequence")}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (upstream.ok) {
        const result = await upstream.json();
        if (result && typeof result === "object" && "ok" in result) {
          if (result.ok) {
            return NextResponse.json(result);
          }
          return NextResponse.json({ ok: false, error: result.error ?? "Request failed" }, { status: 502 });
        }
        return NextResponse.json(result);
      }
    } catch {
      // fall through to fallback
    }
  }

  const data = generateEmailSequenceFallback(payload);
  return NextResponse.json({ ok: true, data });
}
