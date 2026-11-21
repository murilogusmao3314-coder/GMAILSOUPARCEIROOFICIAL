import { verifyToken, pingu, sendUtmify } from "../../../lib-pingupag";

export const dynamic = "force-dynamic";

// Proteção extra (melhor esforço): ignora o mesmo aviso repetido em poucos minutos nesta instância.
// A garantia real contra duplicidade é o orderId fixo (UTMify) e o event_id fixo (Meta).
const recent = globalThis.__recentWebhooks || (globalThis.__recentWebhooks = new Map());

// Postback da PinguPag (POST). É o ÚNICO ponto que envia a venda ao UTMify.
// A Meta recebe o Purchase da própria UTMify (Pixel + API de Conversões com deduplicação) — não enviamos nada à Meta daqui.
// - Só aceita chamadas com o token assinado (?d=...) que nós mesmos geramos na criação do Pix.
// - Confirma o status direto na API da PinguPag antes de contar a venda.
// - É idempotente: reenvios usam o mesmo orderId (UTMify) e o mesmo event_id (Meta) — não duplicam.
export async function POST(req) {
  const url = new URL(req.url);
  const tok = verifyToken(url.searchParams.get("d"));
  if (!tok) return Response.json({ error: "token inválido" }, { status: 401 });

  let p;
  try { p = await req.json(); } catch { return Response.json({ error: "json inválido" }, { status: 400 }); }
  const ref = tok.ref;
  if (p.external_id && p.external_id !== ref) return Response.json({ error: "referência não confere" }, { status: 400 });

  const status = String(p.status || "");
  const map = { approved: "paid", failed: "refused", refunded: "refunded", chargeback: "chargedback" };
  const utmStatus = map[status];
  console.log("[webhook]", ref, status, p.amount);
  if (!utmStatus) return Response.json({ received: true, ignored: status }); // pending/processing/under_review

  const dedupeKey = `${ref}:${status}`;
  if (recent.has(dedupeKey) && Date.now() - recent.get(dedupeKey) < 10 * 60 * 1000) return Response.json({ received: true, duplicate: true });

  const customer = { name: p.customer?.name || "", email: p.customer?.email || "", phone: p.customer?.phone || "", document: p.customer?.document || "" };
  const errors = [];

  if (status === "approved") {
    // Confirma na fonte: status aprovado e valor idêntico ao do pedido
    const q = await pingu(`/gateway/v1/query?action=list_transactions&external_id=${encodeURIComponent(ref)}`);
    const tx = q.ok && Array.isArray(q.json) ? q.json[0] : null;
    if (!tx || tx.status !== "approved" || Number(tx.amount) !== tok.a) {
      console.error("[webhook] não confirmado na API", ref, tx && tx.status, tx && tx.amount);
      return Response.json({ received: true, ignored: "não confirmado" });
    }
  }

  const approvedAtMs = Date.now();
  try { await sendUtmify({ ref, status: utmStatus, tok, customer, ip: tok.ip, approvedAtMs, refundedAtMs: Date.now() }); }
  catch (e) { errors.push(e.message); console.error("[utmify]", ref, e.message); }

  if (!errors.length) recent.set(dedupeKey, Date.now());
  // 500 => a PinguPag tenta de novo (seguro: tudo é idempotente)
  if (errors.length) return Response.json({ received: true, errors }, { status: 500 });
  return Response.json({ received: true });
}
