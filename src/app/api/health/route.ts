import { readCatalog } from "@/lib/repository";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { bundle, origin, warning } = await readCatalog();
    return Response.json({ status: warning ? "degraded" : "ok", revision: bundle.revision, catalog: origin, models: bundle.models.length, news: bundle.news.length }, { status: warning ? 503 : 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
