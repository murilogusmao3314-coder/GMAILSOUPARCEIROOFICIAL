// Integração PinguPag (servidor). A chave secreta fica SOMENTE em variável de ambiente.
const BASE = (process.env.PINGUPAG_BASE_URL || "https://pagamento-processador.org.ua").replace(/\/$/, "");

export function apiKey() {
  const k = process.env.PINGUPAG_API_KEY;
  if (!k) throw new Error("PINGUPAG_API_KEY não configurada no servidor.");
  return k;
}

export async function pingu(path, init = {}) {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { "X-API-Key": apiKey(), "Content-Type": "application/json", ...(init.headers || {}) },
    cache: "no-store",
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, json };
}

// ===== Preços (centavos). Mantenha IGUAL a public/js/config.js =====
export const PRICING = {
  productPrice: 7790,
  maxQty: 10,
  shipping: { correios: 0, jadlog: 853, completo: 1473 },
  bumps: { panelas: 4890, potes: 2187, turbochef: 4489 },
};
export const PRODUCT_NAME = "Armário de Aço Multifuncional";

export function computeAmount({ quantity, shippingOption, extras }) {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > PRICING.maxQty) return null;
  if (!(shippingOption in PRICING.shipping)) return null;
  const list = Array.isArray(extras) ? extras : [];
  let bumps = 0;
  for (const id of new Set(list)) { if (!(id in PRICING.bumps)) return null; bumps += PRICING.bumps[id]; }
  return PRICING.productPrice * qty + PRICING.shipping[shippingOption] + bumps;
}

export function validCPF(v) {
  const t = String(v || "").replace(/\D/g, "");
  if (t.length !== 11 || /^(\d)\1{10}$/.test(t)) return false;
  for (const n of [9, 10]) { let s = 0; for (let i = 0; i < n; i++) s += +t[i] * (n + 1 - i); let d = (s * 10) % 11; if (d === 10) d = 0; if (d !== +t[n]) return false; }
  return true;
}

// =====================================================================
// RASTREAMENTO: UTMify + Meta (API de Conversões) — enviados SÓ pelo servidor
// Regras anti-duplicação:
//  * UTMify: orderId = reference do pedido (sempre o mesmo) e createdAt sempre igual.
//    Pedido novo = "waiting_payment"; o mesmo orderId depois vira "paid" (atualiza, não cria outro).
//  * Meta: Purchase tem event_id fixo "purchase-<reference>"; o navegador usa o MESMO eventID,
//    então a Meta conta uma única compra (desduplica navegador + servidor).
// =====================================================================
import crypto from "crypto";

const secret = () => process.env.WEBHOOK_SECRET || process.env.PINGUPAG_API_KEY || "";
const b64u = (b) => Buffer.from(b).toString("base64url");

// Token assinado (HMAC) que viaja na postback_url: garante que o aviso é legítimo e traz os dados do clique
export function signToken(obj) {
  const body = b64u(JSON.stringify(obj));
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}
export function verifyToken(tok) {
  try {
    const [body, sig] = String(tok || "").split(".");
    if (!body || !sig || !secret()) return null;
    const exp = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
    const a = Buffer.from(sig), b = Buffer.from(exp);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch { return null; }
}

export const newReference = () => `ARM-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
export const refTime = (ref) => Number(String(ref).split("-")[1]) || Date.now(); // createdAt derivado da referência (estável)
const utcStr = (ms) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");
const sha = (v) => crypto.createHash("sha256").update(String(v).trim().toLowerCase()).digest("hex");

const TRACK_KEYS = ["src", "sck", "utm_source", "utm_campaign", "utm_medium", "utm_content", "utm_term"];

// ---------- UTMify ----------
export async function sendUtmify({ ref, status, tok, customer, ip, approvedAtMs = null, refundedAtMs = null }) {
  const token = process.env.UTMIFY_API_TOKEN;
  if (!token) return { skipped: "UTMIFY_API_TOKEN ausente" };
  const products = [{ id: PRODUCT_ID, name: PRODUCT_NAME, planId: null, planName: null, quantity: tok.q, priceInCents: PRICING.productPrice }];
  for (const id of tok.x || []) products.push({ id: `extra-${id}`, name: `Extra ${id}`, planId: null, planName: null, quantity: 1, priceInCents: PRICING.bumps[id] });
  const total = tok.a;
  const fee = Math.round(total * (Number(process.env.PINGUPAG_FEE_PERCENT || 0) / 100)) + Number(process.env.PINGUPAG_FEE_FIXED_CENTS || 0);
  const createdAt = utcStr(refTime(ref));
  const body = {
    orderId: ref, platform: "SiteProprio", paymentMethod: "pix", status,
    createdAt,
    approvedDate: status === "waiting_payment" || status === "refused" ? null : utcStr(approvedAtMs ?? refTime(ref)),
    refundedAt: status === "refunded" ? utcStr(refundedAtMs ?? Date.now()) : null,
    customer: { name: customer.name, email: customer.email, phone: customer.phone || null, document: customer.document || null, country: "BR", ...(ip ? { ip } : {}) },
    products,
    trackingParameters: Object.fromEntries(TRACK_KEYS.map((k) => [k, tok.t?.[k] ?? null])),
    commission: { totalPriceInCents: total, gatewayFeeInCents: fee, userCommissionInCents: Math.max(total - fee, 1) },
    isTest: process.env.UTMIFY_TEST === "1",
  };
  const base = (process.env.UTMIFY_BASE_URL || "https://api.utmify.com.br").replace(/\/$/, "");
  const res = await fetch(`${base}/api-credentials/orders`, { method: "POST", headers: { "x-api-token": token, "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new Error(`UTMify ${res.status}: ${text.slice(0, 300)}`);
  return { ok: true, status, orderId: ref };
}

// ---------- Meta Conversions API ----------
export async function sendMetaPurchase({ ref, tok, customer, address, ip, ua }) {
  const accessToken = process.env.META_CAPI_TOKEN;
  if (!accessToken) return { skipped: "META_CAPI_TOKEN ausente" };
  const pixelId = process.env.META_PIXEL_ID || "1125182217062286";
  const digits = (v) => String(v || "").replace(/\D/g, "");
  const names = String(customer.name || "").trim().split(/\s+/);
  const user_data = {
    em: customer.email ? [sha(customer.email)] : undefined,
    ph: customer.phone ? [sha("55" + digits(customer.phone))] : undefined,
    fn: names[0] ? [sha(names[0])] : undefined,
    ln: names.length > 1 ? [sha(names[names.length - 1])] : undefined,
    external_id: customer.document ? [sha(digits(customer.document))] : undefined,
    ct: address?.city ? [sha(address.city.replace(/\s/g, ""))] : undefined,
    st: address?.state ? [sha(address.state)] : undefined,
    zp: address?.zipcode ? [sha(digits(address.zipcode))] : undefined,
    country: [sha("br")],
    client_ip_address: tok.ip || ip || undefined,
    client_user_agent: tok.ua || ua || undefined,
    fbp: tok.fbp || undefined,
    fbc: tok.fbc || undefined,
  };
  Object.keys(user_data).forEach((k) => user_data[k] === undefined && delete user_data[k]);
  const payload = {
    data: [{
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      event_id: `purchase-${ref}`,          // MESMO eventID do navegador => Meta desduplica
      action_source: "website",
      event_source_url: tok.u || undefined,
      user_data,
      custom_data: { currency: "BRL", value: tok.a / 100, content_ids: [PRODUCT_ID], content_type: "product", num_items: tok.q + (tok.x?.length || 0), order_id: ref },
    }],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };
  const graph = (process.env.META_GRAPH_URL || "https://graph.facebook.com").replace(/\/$/, "");
  const res = await fetch(`${graph}/v21.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new Error(`Meta CAPI ${res.status}: ${text.slice(0, 300)}`);
  return { ok: true, event_id: `purchase-${ref}` };
}

export const PRODUCT_ID = "armario-multifuncional";
export { TRACK_KEYS };
