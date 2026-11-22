import { verifyToken, pingu, sendUtmify, TRACK_KEYS } from "../../../lib-pingupag";

export const dynamic = "force-dynamic";

// Proteção extra (melhor esforço): ignora o mesmo aviso repetido em poucos minutos nesta instância.
// A garantia real contra duplicidade é o orderId fixo (UTMify).
const recent = globalThis.__recentWebhooks || (globalThis.__recentWebhooks = new Map());

// A PinguPag manda textos genéricos quando não guardou o cliente ("Cliente", "Produto digital"): isso conta como VAZIO.
const GENERIC = /^(cliente|customer|consumidor|comprador|produto digital|n\/?a|null|undefined)?$/i;
const real = (v) => { const s = String(v ?? "").trim(); return GENERIC.test(s) ? "" : s; };

const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o && o[k]).map((k) => [k, String(o[k]).slice(0, 300)]));

// Aviso da PinguPag (POST). É o ÚNICO ponto que envia a venda à UTMify. A Meta recebe o Purchase da própria UTMify.
// Dois jeitos de chamar (ambos seguros; mesmo orderId => não duplicam):
//  1) /api/webhook?d=...  link criptografado que o site gera a cada Pix. Traz cliente, UTMs e dados do clique,
//                         então a venda PAGA sai IGUAL à do Pix gerado, mesmo que a PinguPag mande o aviso vazio.
//  2) /api/webhook        endereço simples (painel da PinguPag). Os dados vêm da PinguPag (aviso ou consulta do pedido).
//                         Se não houver dados do cliente/anúncio, NADA é enviado (para não apagar um pedido completo).
export async function POST(req) {
  const url = new URL(req.url);
  const d = url.searchParams.get("d");
  let tok = d ? verifyToken(d) : null;
  if (d && !tok) return Response.json({ error: "token inválido" }, { status: 401 });

  let p;
  try { p = await req.json(); } catch { return Response.json({ error: "json inválido" }, { status: 400 }); }

  const ref = tok ? tok.ref : String(p.external_id || p.store_reference || "");
  if (tok && p.external_id && p.external_id !== ref) return Response.json({ error: "referência não confere" }, { status: 400 });
  if (!tok && !/^ARM-[0-9]+-[A-Z0-9]+$/.test(ref)) return Response.json({ received: true, ignored: "referência desconhecida" });

  const status = String(p.status || "");
  const map = { approved: "paid", failed: "refused", refunded: "refunded", chargeback: "chargedback" };
  const utmStatus = map[status];
  console.log("[webhook]", ref, status, p.amount, "| modo:", tok ? "com-token" : "simples");
  if (!utmStatus) return Response.json({ received: true, ignored: status }); // pending/processing/under_review

  const dedupeKey = `${ref}:${status}`;
  if (recent.has(dedupeKey) && Date.now() - recent.get(dedupeKey) < 10 * 60 * 1000) return Response.json({ received: true, duplicate: true });

  // Consulta o pedido na PinguPag: confirma status/valor e (modo simples) recupera os dados que enviamos ao criar o Pix
  const q = await pingu(`/gateway/v1/query?action=list_transactions&external_id=${encodeURIComponent(ref)}`);
  const tx = q.ok && Array.isArray(q.json) ? q.json[0] : null;
  const expectedAmount = tok ? tok.a : Number(p.amount) || 0;
  if (status === "approved" && (!tx || tx.status !== "approved" || Number(tx.amount) !== expectedAmount)) {
    console.error("[webhook] não confirmado na API", ref, tx && tx.status, tx && tx.amount);
    return Response.json({ received: true, ignored: "não confirmado" });
  }

  let customer, ip;
  if (tok) {
    // Fonte principal: o token (idêntico ao que foi enviado quando o Pix foi gerado)
    const cu = tok.cu || {};
    const pc = p.customer || {};
    customer = { name: real(cu.n) || real(pc.name), email: real(cu.e) || real(pc.email), phone: real(cu.p) || real(pc.phone), document: real(cu.d) || real(pc.document) };
    ip = tok.ip;
  } else {
    // Modo simples: dados do aviso; se faltarem, os que a PinguPag guardou do pedido (customer_data)
    let cd = null;
    if (tx && tx.id != null) {
      const det = await pingu(`/gateway/v1/query?action=get_transaction&id=${encodeURIComponent(tx.id)}`);
      cd = det.ok && det.json && typeof det.json.customer_data === "object" ? det.json.customer_data : null;
    }
    const pc = p.customer || {}, cc = (cd && cd.customer) || {};
    customer = { name: real(pc.name) || real(cc.name), email: real(pc.email) || real(cc.email), phone: real(pc.phone) || real(cc.phone), document: real(pc.document) || real(cc.document) };
    const t = { ...pick(cd && cd.tracking, TRACK_KEYS), ...pick(p.tracking, TRACK_KEYS) };
    const pn = real(p.product && p.product.name) || real(cd && cd.description);
    tok = { a: expectedAmount, q: 1, x: [], t, gm: 1, pn, ...(/^Oferta extra/i.test(pn) ? { up: 1 } : {}) };
    if (!customer.name && !customer.email && !Object.keys(t).length) {
      console.log("[webhook] sem dados do pedido no modo simples; nada enviado para não apagar o pedido completo", ref);
      return Response.json({ received: true, ignored: "sem dados do cliente/anúncio" });
    }
  }
  console.log("[webhook] enviando à UTMify", ref, utmStatus, "| cliente:", customer.name ? "ok" : "VAZIO", "| utms:", Object.keys(tok.t || {}).join(",") || "NENHUM");

  const errors = [];
  try { await sendUtmify({ ref, status: utmStatus, tok, customer, ip, approvedAtMs: Date.now(), refundedAtMs: Date.now() }); }
  catch (e) { errors.push(e.message); console.error("[utmify]", ref, e.message); }

  if (!errors.length) recent.set(dedupeKey, Date.now());
  // 500 => a PinguPag tenta de novo (seguro: tudo é idempotente)
  if (errors.length) return Response.json({ received: true, errors }, { status: 500 });
  return Response.json({ received: true });
}
