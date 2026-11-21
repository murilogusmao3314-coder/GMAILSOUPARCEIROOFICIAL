export const dynamic = "force-dynamic";

// Postback da PinguPag. Deve responder 200 para confirmar o recebimento.
// (O status que o site usa vem de /api/pix-status, que consulta a PinguPag diretamente.)
export async function POST(req) {
  try {
    const p = await req.json();
    console.log("[pingupag webhook]", p.external_id, p.status, p.amount);
  } catch {}
  return Response.json({ received: true });
}
