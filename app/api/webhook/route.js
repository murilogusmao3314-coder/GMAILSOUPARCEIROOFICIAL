import { pixx, validSignature } from "../../../lib-pixxblack";

export const dynamic = "force-dynamic";

// Webhook da PixxBlack  ->  coloque no painel: Integrações > Webhooks:  https://SEU-DOMINIO/api/webhook
//  * Confere a assinatura (X-PixBlack-Signature) com o segredo whsec_... (PIXXBLACK_WEBHOOK_SECRET). Sem assinatura válida: 400.
//  * Ignora eventos repetidos (mesmo id) e responde 2xx rápido (a PixxBlack exige resposta em até 5 s).
//  * charge.paid: confirma na API (GET /charges/{id}) antes de considerar paga. A tela do cliente avança sozinha
//    consultando a cobrança; a venda vai para a UTMify pela integração da própria PixxBlack (Integrações > UTMify).
const seen = globalThis.__pixxEvents || (globalThis.__pixxEvents = new Map());

export async function POST(req) {
  const raw = Buffer.from(await req.arrayBuffer());          // corpo BRUTO, exatamente como chegou (necessário para a assinatura)
  const secret = process.env.PIXXBLACK_WEBHOOK_SECRET;
  if (!secret) { console.error("[webhook] PIXXBLACK_WEBHOOK_SECRET não configurado"); return Response.json({ error: "webhook não configurado" }, { status: 500 }); }
  if (!validSignature(raw, req.headers.get("x-pixblack-signature"), secret)) return new Response("assinatura inválida", { status: 400 });

  let ev;
  try { ev = JSON.parse(raw.toString("utf8")); } catch { return new Response("json inválido", { status: 400 }); }
  const id = String(ev.id || "");

  // evento repetido: já tratado (a PixxBlack pode reenviar)
  const now = Date.now();
  for (const [k, ts] of seen) if (now - ts > 24 * 3600 * 1000) seen.delete(k);
  if (id && seen.has(id)) return Response.json({ received: true, duplicate: true });
  if (id) seen.set(id, now);

  const d = ev.data || {};
  console.log("[webhook]", ev.type, d.external_reference || "", d.status || "");

  if (ev.type === "charge.paid") {
    try {
      const { ok, json } = await pixx(`/charges/${encodeURIComponent(d.charge_id)}`);
      if (!ok || !json || json.status !== "paid" || Number(json.amount_cents) !== Number(d.amount_cents) || json.external_reference !== d.external_reference) {
        console.error("[webhook] pagamento NÃO confirmado na API", d.external_reference, json && json.status);
        if (id) seen.delete(id);                              // deixa a PixxBlack tentar de novo
        return Response.json({ received: true, confirmed: false }, { status: 500 });
      }
      console.log("[webhook] pagamento confirmado", d.external_reference, json.amount_cents);
    } catch (e) {
      console.error("[webhook] erro ao confirmar", e.message);
      if (id) seen.delete(id);
      return Response.json({ received: true, confirmed: false }, { status: 500 });
    }
  }
  return Response.json({ received: true });                  // ping, charge.expired, charge.refunded etc.: só registra
}
