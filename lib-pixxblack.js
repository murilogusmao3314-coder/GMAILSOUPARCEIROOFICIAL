// Integração PixxBlack (servidor). A chave de API e o segredo do webhook ficam SOMENTE em variáveis de ambiente.
import crypto from "crypto";

const BASE = (process.env.PIXXBLACK_BASE_URL || "https://pixxblack.com/api/v1").replace(/\/$/, "");

export function apiKey() {
  const k = process.env.PIXXBLACK_API_KEY;
  if (!k) throw new Error("PIXXBLACK_API_KEY não configurada no servidor.");
  return k;
}

// Chamada à API da PixxBlack (Authorization: Bearer pxb_live_...)
export async function pixx(path, init = {}) {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json", ...(init.headers || {}) },
    cache: "no-store",
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, json };
}

// Confere a assinatura do webhook: header "X-PixBlack-Signature: t=<unix>,v1=<hex>", HMAC-SHA256(segredo, "<t>.<corpo bruto>")
export function validSignature(rawBody, header, secret, toleranceSeconds = 300) {
  try {
    if (typeof header !== "string" || !secret) return false;
    const parts = Object.fromEntries(header.split(",").map((p) => p.trim().split("=", 2)));
    const t = Number(parts.t), v1 = String(parts.v1 || "");
    if (!Number.isInteger(t) || !/^[0-9a-f]{64}$/.test(v1)) return false;
    if (Math.abs(Math.floor(Date.now() / 1000) - t) > toleranceSeconds) return false;   // recusa avisos antigos (reenvio)
    const expected = crypto.createHmac("sha256", secret).update(`${t}.`).update(rawBody).digest();
    return crypto.timingSafeEqual(expected, Buffer.from(v1, "hex"));
  } catch { return false; }
}

// ===== Preços (centavos). Mantenha IGUAL a public/js/config.js =====
// Valor máximo por pedido (centavos). Mantenha igual a STORE.maxOrderCents em config.js
export const MAX_ORDER_CENTS = 25000;

export const PRICING = {
  productPrice: 7790,
  maxQty: 10,
  shipping: { jadlog: 0, correios: 853, completo: 2353 },
  bumps: { panelas: 4890, potes: 2187, turbochef: 4489 },
};
// Nomes exibidos no painel (PixxBlack/UTMify). Mantenha igual aos de public/js/common.js e config.js
export const VARIANT_LABELS = {
  "2-pretos": "2 Pretos", "2-brancos": "2 Brancos", "1-preto-1-branco": "1 Preto e 1 Branco",
  "4-pretos": "4 Pretos", "4-brancos": "4 Brancos", "2-pretos-2-brancos": "2 Pretos e 2 Brancos",
};
export const BUMP_NAMES = {
  panelas: "Conjunto de Panelas LIFE SMILE 29 Peças", potes: "Potes Organizadores 16 Peças", turbochef: "Kit Panela Pressão TurboChef",
};
export const UPSELL = { id: "upsell-kit-cozinha", name: "Kit Cozinha Completa (3 produtos)", price: 5990 }; // igual a STORE.upsell em config.js
export const SHIPPING_NAMES = { jadlog: "Frete JadLog", correios: "Frete Correios", completo: "Frete Full" };

// Ex.: "Armário Multifuncional - 2 Pretos e 2 Brancos (2 kits) + Panelas LIFE SMILE | Frete Correios"  (a PixxBlack aceita até 140)
export function orderTitle({ color, quantity, extras, shippingOption }) {
  const v = VARIANT_LABELS[color] || "";
  let t = `Armário Multifuncional${v ? " - " + v : ""} (${quantity} ${quantity > 1 ? "kits" : "kit"})`;
  const ex = (extras || []).map((id) => BUMP_NAMES[id]).filter(Boolean);
  if (ex.length) t += " + " + ex.join(" + ");
  if (SHIPPING_NAMES[shippingOption]) t += " | " + SHIPPING_NAMES[shippingOption];
  return t.slice(0, 140);
}
export const PRODUCT_NAME = "Armário de Aço Multifuncional";
export const PRODUCT_ID = "armario-multifuncional";

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

// Referência do pedido (vai em external_reference e também é a Idempotency-Key): só A-Z 0-9 e "-"
export const newReference = () => `ARM-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

// Campos de rastreamento aceitos pela PixxBlack (ela repassa à UTMify, se estiver conectada em Integrações)
export const TRACK_KEYS = ["src", "sck", "utm_source", "utm_campaign", "utm_medium", "utm_content", "utm_term"];
