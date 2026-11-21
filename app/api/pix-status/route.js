import { pingu } from "../../../lib-pingupag";

export const dynamic = "force-dynamic";

// GET /api/pix-status?ref=ARM-...  ->  { paid: boolean, status }
export async function GET(req) {
  const ref = new URL(req.url).searchParams.get("ref") || "";
  if (!/^ARM-[0-9]+-[A-Z0-9]+$/.test(ref)) return Response.json({ paid: false, error: "ref inválida" }, { status: 400 });
  try {
    const { ok, json } = await pingu(`/gateway/v1/query?action=list_transactions&external_id=${encodeURIComponent(ref)}`);
    const tx = ok && Array.isArray(json) ? json[0] : null;
    const status = tx?.status || "unknown";
    return Response.json({ paid: status === "approved", status });
  } catch {
    return Response.json({ paid: false, status: "error" });
  }
}
