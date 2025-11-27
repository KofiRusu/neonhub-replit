import { r } from "@/src/lib/route-map";
import { seoAuditFallback } from "@/src/server/brand-voice-data";
import { proxyToBackend } from "@/src/lib/api-proxy";

export async function POST(req: Request) {
  return proxyToBackend(req, {
    endpoint: r("seo_audit"),
    fallback: seoAuditFallback,
  });
}
