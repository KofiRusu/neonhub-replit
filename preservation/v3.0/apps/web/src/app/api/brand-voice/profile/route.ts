import { NextResponse } from "next/server";
import { r } from "@/src/lib/route-map";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  if (!API) return NextResponse.json({ error: "Set NEXT_PUBLIC_API_URL" }, { status: 500 });
  const r0 = await fetch(`${API.replace(/\/$/, "")}/${r("brandVoice_profile")}`, { cache: "no-store" });
  return new NextResponse(r0.body, {
    status: r0.status,
    headers: { "content-type": r0.headers.get("content-type") ?? "application/json" },
  });
}


