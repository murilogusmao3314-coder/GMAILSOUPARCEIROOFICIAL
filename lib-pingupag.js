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
