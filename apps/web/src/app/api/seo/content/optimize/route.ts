import { NextResponse } from "next/server";
import { r } from "@/src/lib/route-map";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({}));

  if (!API) {
    return NextResponse.json(
      { ok: false, error: "API URL not configured" },
      { status: 503 }
    );
  }

  try {
    const upstream = await fetch(
      `${API.replace(/\/$/, "")}/${r("seo_contentOptimize")}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: req.headers.get("cookie") || "",
        },
        body: JSON.stringify(payload),
      }
    );

    if (upstream.ok) {
      const result = await upstream.json();
      return NextResponse.json(result);
    }

    const errorData = await upstream.json().catch(() => ({ error: "Request failed" }));
    return NextResponse.json(
      { ok: false, error: errorData.error || "Request failed" },
      { status: upstream.status }
    );
  } catch (_error) {
    return NextResponse.json(
      { ok: false, error: "Failed to connect to API" },
      { status: 502 }
    );
  }
}
