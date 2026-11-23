import { pixx } from "../../../lib-pixxblack";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/pix-status?id=<id da cobrança>&ref=ARM-...  ->  { paid: boolean, status }
export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const id = q.get("id") || "", ref = q.get("ref") || "";
  if (!UUID.test(id) || !/^ARM-[0-9]+-[A-Z0-9]+$/.test(ref)) return Response.json({ paid: false, error: "parâmetros inválidos" }, { status: 400 });
  try {
    const { ok, json } = await pixx(`/charges/${id}`);
    // só vale se a cobrança for MESMO daquele pedido
    if (!ok || !json || json.external_reference !== ref) return Response.json({ paid: false, status: "unknown" });
    return Response.json({ paid: json.status === "paid", status: json.status });
  } catch {
    return Response.json({ paid: false, status: "error" });
  }
}
