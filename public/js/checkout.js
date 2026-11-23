$("#ic-back").innerHTML = icon.back; $("#ic-shield").innerHTML = icon.shield;
const order = store.get("order") || { color: "2-pretos", qty: 1 };
if (!VARIANTS[order.color]) order.color = "2-pretos";
let qty = order.qty || 1, shipId = S.shipping[0].id, bumps = [];

const digits = (v) => v.replace(/\D/g, "");
const mask = {
  cpf: (v) => { const t = digits(v).slice(0, 11); return t.length <= 3 ? t : t.length <= 6 ? `${t.slice(0,3)}.${t.slice(3)}` : t.length <= 9 ? `${t.slice(0,3)}.${t.slice(3,6)}.${t.slice(6)}` : `${t.slice(0,3)}.${t.slice(3,6)}.${t.slice(6,9)}-${t.slice(9)}`; },
  phone: (v) => { const t = digits(v).slice(0, 11); return t.length <= 2 ? t : t.length <= 7 ? `(${t.slice(0,2)}) ${t.slice(2)}` : `(${t.slice(0,2)}) ${t.slice(2,7)}-${t.slice(7)}`; },
  cep: (v) => { const t = digits(v).slice(0, 8); return t.length <= 5 ? t : `${t.slice(0,5)}-${t.slice(5)}`; },
};
function validCPF(v) {
  const t = digits(v); if (t.length !== 11 || /^(\d)\1{10}$/.test(t)) return false;
  for (const n of [9, 10]) { let s = 0; for (let i = 0; i < n; i++) s += +t[i] * (n + 1 - i); let d = (s * 10) % 11; if (d === 10) d = 0; if (d !== +t[n]) return false; }
  return true;
}
["cpf", "phone", "cep"].forEach((id) => $("#" + id).addEventListener("input", (e) => (e.target.value = mask[id](e.target.value))));

// ----- Endereço opcional: CEP preenche sozinho; se falhar, pede para digitar à mão -----
const showAddr = () => { $("#addr-fields").classList.remove("hidden"); $("#manual").classList.add("hidden"); };
function cepMsg(text, ok) { const m = $("#cep-msg"); m.textContent = text; m.className = "text-xs " + (ok ? "text-emerald-600" : "text-amber-600"); }
$("#manual").onclick = () => { showAddr(); $("#street").focus(); };
let cepSeq = 0;
async function lookupCep() {
  const c = digits($("#cep").value), seq = ++cepSeq;
  if (c.length === 0) { $("#cep-msg").className = "hidden"; return; }
  if (c.length < 8) return;
  cepMsg("Buscando endereço…", true);
  try {
    const j = await (await fetch(`https://viacep.com.br/ws/${c}/json/`)).json();
    if (seq !== cepSeq) return;
    showAddr();
    if (j.erro) { cepMsg("Não encontramos esse CEP. Preencha o endereço manualmente abaixo.", false); return; }
    $("#uf").value = j.uf || ""; $("#city").value = j.localidade || ""; $("#district").value = j.bairro || ""; $("#street").value = j.logradouro || "";
    cepMsg("✓ Endereço encontrado! Confira e informe o número.", true);
    $("#number").focus();
  } catch {
    if (seq !== cepSeq) return;
    showAddr(); cepMsg("Não conseguimos buscar o CEP agora. Preencha o endereço manualmente abaixo.", false);
  }
}
$("#cep").addEventListener("input", lookupCep);
$("#cep").addEventListener("blur", () => { const c = digits($("#cep").value); if (c.length > 0 && c.length < 8) { showAddr(); cepMsg("CEP incompleto. Corrija ou preencha o endereço manualmente.", false); } });

function render() {
  const P = S.product, v = VARIANTS[order.color];
  $("#p-img").src = v.img; $("#p-title").textContent = P.shortTitle; $("#p-variant").textContent = "Variante: " + v.label;
  $("#p-price").textContent = brl(P.price); $("#p-compare").textContent = brl(P.comparePrice); $("#qty").textContent = qty;
  const sub = P.price * qty, disc = (P.comparePrice - P.price) * qty;
  const ship = S.shipping.find((s) => s.id === shipId).price;
  const bumpTotal = S.bumps.filter((b) => bumps.includes(b.id)).reduce((a, b) => a + b.price, 0);
  const total = sub + ship + bumpTotal;
  $("#discount").textContent = "- " + brl(disc);
  $("#sub-label").textContent = `Subtotal do produto (${qty}x)`; $("#subtotal").textContent = brl(sub);
  $("#shipcost").textContent = ship ? brl(ship) : "Grátis"; $("#shipcost").className = ship ? "" : "text-green-600";
  $("#total").textContent = brl(total); $("#bar-total").textContent = brl(total);
  $("#bar-label").textContent = `Total (${qty + bumps.length} ${qty + bumps.length > 1 ? "itens" : "item"})`;
  $("#saving").textContent = `Você está economizando ${brl(disc)} nesse pedido.`;
  $("#ship").innerHTML = S.shipping.map((s) => `<button type="button" data-id="${s.id}" class="w-full text-left flex items-center gap-3 rounded-xl border p-3 ${s.id === shipId ? "border-red-600 bg-red-50" : "border-gray-200"}">
    <span class="h-5 w-5 rounded-full border-2 flex items-center justify-center ${s.id === shipId ? "border-red-600" : "border-gray-300"}">${s.id === shipId ? '<span class="h-2.5 w-2.5 rounded-full bg-red-600"></span>' : ""}</span>
    <span class="flex-1"><b class="block text-sm font-medium">${s.name}</b><span class="text-xs text-gray-500">${shipEta(s)}</span></span>
    <b class="text-sm ${s.price ? "" : "text-green-600"}">${s.price ? brl(s.price) : "Grátis"}</b></button>`).join("");
  $$("#ship button").forEach((b) => (b.onclick = () => { shipId = b.dataset.id; render(); }));
  if (!S.bumps.length) $("#bumps-wrap").remove(); else $("#bumps").innerHTML = S.bumps.map((b) => `<label class="flex items-center gap-3 rounded-xl border border-gray-200 p-2 cursor-pointer"><img src="${b.image}" class="h-16 w-16 rounded object-cover" alt=""/><span class="flex-1 text-xs"><span class="block text-gray-800 leading-snug">${b.name}</span><b class="text-sm">${brl(b.price)}</b> <span class="text-[11px] bg-green-100 text-green-700 rounded px-1.5 py-0.5">🛒 adicionar ao pedido</span></span><input type="checkbox" data-id="${b.id}" class="h-5 w-5" ${bumps.includes(b.id) ? "checked" : ""}/></label>`).join("");
  $$("#bumps input").forEach((c) => (c.onchange = () => { bumps = c.checked ? [...bumps, c.dataset.id] : bumps.filter((x) => x !== c.dataset.id); render(); }));
  return total;
}
$("#minus").onclick = () => { qty = Math.max(1, qty - 1); render(); };
$("#plus").onclick = () => { qty = Math.min(10, qty + 1); render(); };
render();
const evData = (total) => ({ content_ids: [PRODUCT_ID], content_type: "product", num_items: qty + bumps.length, value: total / 100, currency: "BRL" });
track("InitiateCheckout", evData(render()));

// Mostra o erro ONDE a pessoa precisa ver: embaixo do campo (rolando até ele) e junto ao botão "Fazer pedido"
function clearErr() {
  $$(".inp.bad").forEach((i) => i.classList.remove("bad", "shake"));
  $$(".field-err").forEach((e) => e.remove());
  $("#bar-err").classList.add("hidden");
}
function showErr(m, el) {
  clearErr();
  const bar = $("#bar-err"); bar.textContent = "⚠️ " + m; bar.classList.remove("hidden");
  if (!el) return;
  el.classList.add("bad", "shake");
  const wrap = el.parentElement.classList.contains("relative") ? el.parentElement.parentElement : el.parentElement;
  const p = document.createElement("p"); p.className = "field-err"; p.textContent = m; wrap.appendChild(p);
  el.scrollIntoView({ behavior: "smooth", block: "center" });   // rola até o campo com problema
  setTimeout(() => el.focus({ preventScroll: true }), 350);
}
// Ao corrigir o campo, o erro some
$$(".inp").forEach((i) => i.addEventListener("input", () => { if (i.classList.contains("bad")) clearErr(); }));
function validate() {
  const f = (id) => $("#" + id);
  const checks = [
    [f("name").value.trim().split(/\s+/).filter(Boolean).length >= 2, "Insira seu nome completo (nome e sobrenome)", "name"],
    [/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f("email").value.trim()), "Insira um e-mail válido", "email"],
    [digits(f("phone").value).length >= 10, "Insira um telefone válido com DDD", "phone"],
    [validCPF(f("cpf").value), "Insira um CPF válido", "cpf"],
  ];
  for (const [ok, msg, id] of checks) if (!ok) { showErr(msg, f(id)); return false; }
  clearErr(); return true;
}

// fbp/fbc (cookies da Meta) para a API de Conversões casar a compra com o clique no anúncio
function metaIds() {
  const ck = (n) => (document.cookie.match(new RegExp("(?:^|; )" + n + "=([^;]*)")) || [])[1];
  let fbc = ck("_fbc");
  const fbclid = getUtms().fbclid;
  if (!fbc && fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;
  return { fbp: ck("_fbp") || "", fbc: fbc || "", sourceUrl: location.origin + "/checkout" };
}

$("#buy").onclick = async () => {
  if (!validate()) return;
  const total = render(), btn = $("#buy"), g = (id) => $("#" + id).value.trim();
  const payload = {
    tracking: getUtms(), meta: metaIds(), color: order.color, quantity: qty, amount: total, shippingOption: shipId, extras: bumps,
    customer: { name: g("name"), email: g("email"), phone: digits(g("phone")), document: { number: digits(g("cpf")), type: "cpf" } },
    shipping: { street: g("street"), number: g("number"), complement: g("complement"), neighborhood: g("district"), city: g("city"), state: g("uf").toUpperCase(), zipCode: digits(g("cep")).length === 8 ? digits(g("cep")) : "" },
  };
  track("AddPaymentInfo", { ...evData(total), payment_method: "pix" });
  btn.disabled = true; btn.textContent = "Gerando Pix...";
  try {
    if (!S.PIX_ENDPOINT) throw new Error("Pagamento Pix ainda não configurado. Defina PIX_ENDPOINT em js/config.js (veja o README).");
    let r;
    try { r = await fetch(S.PIX_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
    catch { const e = new Error(PIX_INSTAVEL); e.retry = true; throw e; }   // sem internet / queda de conexão
    const j = await readPixResponse(r);
    store.set("pix", { ...j.data, total, email: payload.customer.email, qty: qty + bumps.length, variant: VARIANTS[order.color].label, units: qty, shipName: S.shipping.find((s) => s.id === shipId).name });
    store.set("paid", null); store.set("upsellPaid", null);
    store.set("buyer", { customer: payload.customer, shipping: payload.shipping });
    store.set("mainOrder", { ref: j.data.externalRef, total, variant: VARIANTS[order.color].label, units: qty, extras: bumps.length });
    trackCustom("PixGerado", evData(total));
    location.href = withUtms("/pix");
  } catch (e) { showErr(e.message); btn.disabled = false; btn.textContent = e.retry ? "Gerar Pix novamente" : "Fazer pedido"; }
};
