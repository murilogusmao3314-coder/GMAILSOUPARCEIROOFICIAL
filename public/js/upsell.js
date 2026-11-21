const U = S.upsell;
const items = U.items.map((id) => S.bumps.find((b) => b.id === id)).filter(Boolean);
const sum = items.reduce((a, b) => a + b.price, 0);
$("#up-items").innerHTML = items.map((b) => `<li class="flex items-center gap-3"><img src="${b.image}" class="h-14 w-14 rounded-lg object-cover border border-gray-100" alt=""/><div class="flex-1 min-w-0"><p class="text-sm text-gray-800 leading-snug">${b.name}</p><p class="text-xs text-gray-400"><s>${brl(b.price)}</s></p></div><span class="text-emerald-600 font-bold">✓</span></li>`).join("");
$("#up-old").textContent = brl(sum);
$("#up-price").textContent = brl(U.price);
$("#up-save").textContent = sum > U.price ? `Você economiza ${brl(sum - U.price)} (${Math.round((1 - U.price / sum) * 100)}% OFF)` : "";
$("#up-yes-label").textContent = `SIM! Quero comprar agora por ${brl(U.price)}`;
$("#up-no").href = withUtms("/confirmado");

// Sem pedido pago nesta sessão -> não faz sentido mostrar a oferta
const buyer = store.get("buyer");
if (!buyer || store.get("upsellPaid")) location.replace(withUtms("/confirmado"));

function err(m) { const e = $("#up-err"); e.textContent = "⚠️ " + m; e.classList.remove("hidden"); }
$("#up-yes").onclick = async () => {
  const btn = $("#up-yes"); btn.disabled = true; $("#up-spin").classList.remove("hidden"); $("#up-yes-label").textContent = "Gerando seu Pix…";
  const ids = (() => { const ck = (n) => (document.cookie.match(new RegExp("(?:^|; )" + n + "=([^;]*)")) || [])[1]; return { fbp: ck("_fbp") || "", fbc: ck("_fbc") || "", sourceUrl: location.origin + "/upsell" }; })();
  try {
    if (!S.PIX_ENDPOINT) throw new Error("Pagamento indisponível no momento.");
    const r = await fetch(S.PIX_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ upsell: true, amount: U.price, customer: buyer.customer, shipping: buyer.shipping, tracking: getUtms(), meta: ids }) });
    const j = await r.json();
    if (!r.ok || !j.success) throw new Error(j.error || "Não foi possível gerar o Pix. Tente novamente.");
    store.set("pix", { ...j.data, total: U.price, kind: "upsell", qty: 1, units: 1 });
    location.href = withUtms("/pix");
  } catch (e) { err(e.message); btn.disabled = false; $("#up-spin").classList.add("hidden"); $("#up-yes-label").textContent = `SIM! Quero comprar agora por ${brl(U.price)}`; }
};
