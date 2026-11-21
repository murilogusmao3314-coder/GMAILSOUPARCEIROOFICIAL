import { pingu, computeAmount, validCPF, PRODUCT_NAME, VARIANT_LABELS, orderTitle, UPSELL, newReference, signToken, sendUtmify, TRACK_KEYS } from "../../../lib-pingupag";

export const dynamic = "force-dynamic";
const str = (v, max = 120) => String(v ?? "").trim().slice(0, max);
const digits = (v) => String(v ?? "").replace(/\D/g, "");
const fail = (error, status = 400) => Response.json({ success: false, error }, { status });

export async function POST(req) {
  let b;
  try { b = await req.json(); } catch { return fail("Requisição inválida."); }

  // Valor SEMPRE calculado no servidor (nunca confie no valor do navegador)
  const isUp = b.upsell === true;
  const amount = isUp ? UPSELL.price : computeAmount(b);
  if (amount === null) return fail("Pedido inválido.");
  if (Number(b.amount) !== amount) return fail("O valor do pedido mudou. Atualize a página e tente novamente.");

  if (!isUp && !(b.color in VARIANT_LABELS)) return fail("Variante inválida.");
  const title = isUp ? `Oferta extra - ${UPSELL.name}` : orderTitle(b);
  const c = b.customer || {}, a = b.shipping || {};
  const name = str(c.name), email = str(c.email), phone = digits(c.phone), doc = digits(c.document?.number);
  if (name.split(/\s+/).length < 2) return fail("Nome completo inválido.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("E-mail inválido.");
  if (phone.length < 10 || phone.length > 11) return fail("Telefone inválido.");
  if (!validCPF(doc)) return fail("CPF inválido.");

  // Parâmetros de rastreamento aceitos pela PinguPag (UTMify)
  const t = b.tracking || {};
  const tracking = {};
  for (const k of TRACK_KEYS) if (t[k]) tracking[k] = str(t[k], 300);

  const reference = newReference();
  const origin = new URL(req.url).origin;
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || undefined;
  const ua = req.headers.get("user-agent") || undefined;
  const m = b.meta || {};
  // Token assinado que viaja na postback_url: o webhook usa isto para mandar a venda ao UTMify/Meta
  const tok = {
    a: amount, q: isUp ? 1 : Number(b.quantity), c: isUp ? undefined : b.color, x: isUp ? [] : [...new Set(Array.isArray(b.extras) ? b.extras : [])], ...(isUp ? { up: 1 } : {}), t: tracking,
    fbp: str(m.fbp, 100) || undefined, fbc: str(m.fbc, 200) || undefined, u: str(m.sourceUrl, 300) || undefined, ip, ua: ua && ua.slice(0, 300),
  };

  // Endereço: só campos preenchidos (string vazia pode ser tratada como "enviado vazio")
  const address = Object.fromEntries(Object.entries({
    street: str(a.street), number: str(a.number, 20), complement: str(a.complement), neighborhood: str(a.neighborhood),
    city: str(a.city), state: str(a.state, 2).toUpperCase(), zipcode: digits(a.zipCode).length === 8 ? digits(a.zipCode) : "",
  }).filter(([, v]) => v));
  // Dados do cliente completos; o endereço vai na raiz E dentro de customer (a PinguPag aceita os dois)
  const hasAddr = Object.keys(address).length > 0;
  const customerObj = { name, email, phone, document: doc, ...(hasAddr ? { address } : {}) };
  const payload = {
    amount,
    description: title,
    reference,
    postback_url: `${origin}/api/webhook?d=${encodeURIComponent(signToken({ ref: reference, ...tok }))}`,
    // Se você cadastrou o produto no painel da PinguPag, defina PINGUPAG_PRODUCT_HASH na Vercel para vincular a venda a ele
    ...(process.env.PINGUPAG_PRODUCT_HASH ? { productHash: process.env.PINGUPAG_PRODUCT_HASH } : { source: "api_externa" }),
    customer: customerObj,
    ...(hasAddr ? { address } : {}),
    ...(Object.keys(tracking).length ? { tracking } : {}),
  };
  // Log de diagnóstico (SEM dados pessoais): mostra quais campos foram enviados — veja em Vercel > Logs
  console.log("[create-pix] enviando", reference, JSON.stringify({
    customer: { name: !!name, email: !!email, phone: phone.length, document: doc.length },
    address: Object.keys(address), tracking: Object.keys(tracking), desc: title,
  }));

  try {
    const { ok, status, json } = await pingu("/gateway/v1/transaction", { method: "POST", body: JSON.stringify(payload) });
    console.log("[create-pix] resposta", reference, status, json && JSON.stringify({ status: json.status, transaction_id: json.transaction_id, id: json.id, acquirer: json.acquirer, attempts: json.attempts, keys: Object.keys(json) }));
    if (!ok || !json || json.status !== "success" || !json.qr_code) {
      console.error("PinguPag erro", status, JSON.stringify(json));
      return fail("Não foi possível gerar o Pix agora. Tente novamente em instantes.", 502);
    }
    // UTMify: pedido criado (aguardando pagamento). Falha aqui NÃO impede o cliente de pagar.
    try { await sendUtmify({ ref: reference, status: "waiting_payment", tok, customer: { name, email, phone, document: doc }, ip }); }
    catch (e) { console.error("[utmify waiting_payment]", reference, e.message); }
    return Response.json({ success: true, data: { pixCode: json.qr_code, qrCodeImage: json.qr_code_base64 || null, externalRef: reference, expiresAt: json.expires_at || null } });
  } catch (e) {
    console.error("create-pix", e.message);
    return fail("Pagamento indisponível no momento.", 502);
  }
}
