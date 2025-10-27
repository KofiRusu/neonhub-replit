import { NextRequest, NextResponse } from "next/server";
import { r } from "@/src/lib/route-map";
import { searchKnowledgeFallback } from "@/src/server/brand-voice-data";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.toString();

  if (API) {
    try {
      const upstream = await fetch(
        `${API.replace(/\/$/, "")}/${r("brandVoice_search")}${search ? `?${search}` : ""}`,
        { cache: "no-store" },
      );
      if (upstream.ok) {
        const result = await upstream.json();
        if (result && typeof result === "object" && "ok" in result) {
          if (result.ok) {
            return NextResponse.json(result.data ?? []);
          }
          return NextResponse.json({ error: result.error ?? "Request failed" }, { status: 502 });
        }
        return NextResponse.json(result);
      }
    } catch {
      // fall through to local implementation
    }
  }

  try {
    const filters = {
      type: req.nextUrl.searchParams.get("type") ?? undefined,
      agent: req.nextUrl.searchParams.get("agent") ?? undefined,
    };
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const items = await searchKnowledgeFallback(q, filters);
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load knowledge index";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

