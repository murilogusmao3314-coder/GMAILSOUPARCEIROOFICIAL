const U = S.upsell;
const items = U.items.map((id) => S.bumps.find((b) => b.id === id)).filter(Boolean);
const sum = items.reduce((a, b) => a + b.price, 0);
$("#up-items").innerHTML = items.map((b) => `<li class="flex items-center gap-3"><img src="${b.image}" class="h-14 w-14 rounded-lg object-cover border border-gray-100" alt=""/><div class="flex-1 min-w-0"><p class="text-sm text-gray-800 leading-snug">${b.name}</p><p class="text-xs text-gray-400"><s>${brl(b.price)}</s></p></div><span class="text-emerald-600 font-bold">✓</span></li>`).join("");
$("#up-old").textContent = brl(sum);
$("#up-price").textContent = brl(U.price);
$("#up-save").textContent = sum > U.price ? `Você economiza ${brl(sum - U.price)} (${Math.round((1 - U.price / sum) * 100)}% OFF)` : "";
$("#up-yes-label").dataset.label = `SIM! Quero comprar agora por ${brl(U.price)}`;
$("#up-no").href = withUtms("/confirmado");

// A página abre sempre (inclusive direto pela URL). Se não há pedido anterior, pedimos os 4 dados básicos.
let buyer = store.get("buyer");
const udig = (v) => v.replace(/\D/g, "");
const umask = {
  "u-cpf": (v) => { const t = udig(v).slice(0, 11); return t.length <= 3 ? t : t.length <= 6 ? `${t.slice(0,3)}.${t.slice(3)}` : t.length <= 9 ? `${t.slice(0,3)}.${t.slice(3,6)}.${t.slice(6)}` : `${t.slice(0,3)}.${t.slice(3,6)}.${t.slice(6,9)}-${t.slice(9)}`; },
  "u-phone": (v) => { const t = udig(v).slice(0, 11); return t.length <= 2 ? t : t.length <= 7 ? `(${t.slice(0,2)}) ${t.slice(2)}` : `(${t.slice(0,2)}) ${t.slice(2,7)}-${t.slice(7)}`; },
};
function uvalidCPF(v) {
  const t = udig(v); if (t.length !== 11 || /^(\d)\1{10}$/.test(t)) return false;
  for (const n of [9, 10]) { let s = 0; for (let i = 0; i < n; i++) s += +t[i] * (n + 1 - i); let d = (s * 10) % 11; if (d === 10) d = 0; if (d !== +t[n]) return false; }
  return true;
}
const hasBuyer = !!(buyer && buyer.customer && buyer.customer.document && buyer.customer.document.number);
if (!hasBuyer) {
  $("#up-form").classList.remove("hidden");
  Object.keys(umask).forEach((id) => $("#" + id).addEventListener("input", (e) => (e.target.value = umask[id](e.target.value))));
}
function readForm() {
  const g = (id) => $("#" + id).value.trim();
  if (g("u-name").split(/\s+/).filter(Boolean).length < 2) return ["Insira seu nome completo (nome e sobrenome)", "u-name"];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g("u-email"))) return ["Insira um e-mail válido", "u-email"];
  if (udig(g("u-phone")).length < 10) return ["Insira um telefone válido com DDD", "u-phone"];
  if (!uvalidCPF(g("u-cpf"))) return ["Insira um CPF válido", "u-cpf"];
  return [null, null, { customer: { name: g("u-name"), email: g("u-email"), phone: udig(g("u-phone")), document: { number: udig(g("u-cpf")), type: "cpf" } }, shipping: {} }];
}

function err(m) { const e = $("#up-err"); e.textContent = "⚠️ " + m; e.classList.remove("hidden"); }
$("#up-yes").onclick = async () => {
  if (!hasBuyer) {
    const [msg, id, data] = readForm();
    if (msg) { err(msg); $("#" + id).focus(); return; }
    buyer = data; store.set("buyer", data);
  }
  $("#up-err").classList.add("hidden");
  const btn = $("#up-yes"); btn.disabled = true; $("#up-spin").classList.remove("hidden"); $("#up-yes-label").dataset.label = "Gerando seu Pix…";
  const ids = (() => { const ck = (n) => (document.cookie.match(new RegExp("(?:^|; )" + n + "=([^;]*)")) || [])[1]; return { fbp: ck("_fbp") || "", fbc: ck("_fbc") || "", sourceUrl: location.origin + "/upsell" }; })();
  try {
    if (!S.PIX_ENDPOINT) throw new Error("Pagamento indisponível no momento.");
    let r;
    try { r = await fetch(S.PIX_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ upsell: true, amount: U.price, customer: buyer.customer, shipping: buyer.shipping, tracking: getUtms(), meta: ids }) }); }
    catch { throw new Error(PIX_INSTAVEL); }
    const j = await readPixResponse(r);
    store.set("pix", { ...j.data, total: U.price, kind: "upsell", qty: 1, units: 1 });
    location.href = withUtms("/pix");
  } catch (e) { err(e.message); btn.disabled = false; $("#up-spin").classList.add("hidden"); $("#up-yes-label").dataset.label = `SIM! Quero comprar agora por ${brl(U.price)}`; }
};
