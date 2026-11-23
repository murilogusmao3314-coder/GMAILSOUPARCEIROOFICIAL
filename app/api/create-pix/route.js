import { pixx, computeAmount, validCPF, VARIANT_LABELS, orderTitle, UPSELL, newReference, TRACK_KEYS } from "../../../lib-pixxblack";

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

  const c = b.customer || {};
  const name = str(c.name), email = str(c.email), phone = digits(c.phone), doc = digits(c.document && c.document.number);
  if (name.split(/\s+/).length < 2) return fail("Nome completo inválido.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("E-mail inválido.");
  if (phone.length < 10 || phone.length > 11) return fail("Telefone inválido.");
  if (!validCPF(doc)) return fail("CPF inválido.");

  // UTMs da visita: a PixxBlack leva à UTMify (campos desconhecidos seriam recusados, então só os permitidos)
  const t = b.tracking || {};
  const tracking = {};
  for (const k of TRACK_KEYS) if (t[k]) tracking[k] = str(t[k], 300);

  const reference = newReference();
  const payload = {
    amount_cents: amount,
    description: title,
    external_reference: reference,
    payer: { name, document: doc, email, phone },
    ...(Object.keys(tracking).length ? { tracking } : {}),
  };
  // Log de diagnóstico (SEM dados pessoais): o que foi enviado — veja em Vercel > Logs
  console.log("[create-pix] enviando", reference, JSON.stringify({ valor: amount, payer: { nome: !!name, email: !!email, telefone: phone.length, documento: doc.length }, tracking: Object.keys(tracking), desc: title }));

  try {
    // Idempotency-Key = referência do pedido: repetir a mesma chamada nunca cria uma segunda cobrança
    const { ok, status, json } = await pixx("/charges", { method: "POST", headers: { "Idempotency-Key": reference }, body: JSON.stringify(payload) });
    console.log("[create-pix] resposta", reference, status, json && JSON.stringify({ id: json.id, status: json.status, issues: json.issues, message: json.message }));
    if (!ok || !json || !json.id || !json.pix || !json.pix.copy_paste) {
      return fail("Não foi possível gerar o Pix agora. Tente novamente em instantes.", 502);
    }
    return Response.json({ success: true, data: { pixCode: json.pix.copy_paste, qrCodeImage: null, externalRef: reference, chargeId: json.id, expiresAt: json.pix.expires_at || null } });
  } catch (e) {
    console.error("create-pix", e.message);
    return fail("Pagamento indisponível no momento.", 502);
  }
}
