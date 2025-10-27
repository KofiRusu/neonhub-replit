import { NextResponse } from "next/server";
import { r } from "@/src/lib/route-map";
import { getBrandProfileFallback } from "@/src/server/brand-voice-data";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  if (API) {
    try {
      const upstream = await fetch(`${API.replace(/\/$/, "")}/${r("brandVoice_profile")}`, {
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
      // fall through to local data
    }
  }

  try {
    const profile = await getBrandProfileFallback();
    return NextResponse.json(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load brand profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

