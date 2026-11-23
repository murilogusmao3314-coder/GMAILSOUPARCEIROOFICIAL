$("#ic-back").innerHTML = icon.back;
const pix = store.get("pix");
const order = store.get("order") || {};
if (!pix || !pix.pixCode) { $("#empty").classList.remove("hidden"); }
else {
  $("#main").classList.remove("hidden");
  $("#total").textContent = brl(pix.total);
  $("#code").textContent = pix.pixCode;

  // ----- QR Code (gerado aqui a partir do código copia e cola) -----
  try {
    const qr = qrcode(0, "M"); qr.addData(pix.pixCode); qr.make();
    $("#qr").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    const svg = $("#qr svg"); svg.setAttribute("class", "h-52 w-52"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "QR Code Pix");
  } catch (e) {
    // alternativa: imagem do gateway, se houver
    $("#qr").innerHTML = pix.qrCodeImage ? `<img src="${pix.qrCodeImage}" class="h-52 w-52" alt="QR Code Pix"/>` : '<p class="text-xs text-gray-500 text-center px-2">Use o código Pix Copia e Cola abaixo.</p>';
  }

  // ----- Resumo -----
  if (pix.kind === "upsell") {
    $("#s-img").src = S.upsell.image; $("#s-title").textContent = S.upsell.name; $("#s-var").textContent = "Oferta extra • 1x";
    $("#s-ship").parentElement.classList.add("hidden"); $("#s-total").textContent = brl(pix.total);
    document.querySelector("h1").textContent = "Quase lá! Pague sua oferta extra 🎁";
  } else {
    const v = VARIANTS[order.color] || VARIANTS["2-pretos"];
    $("#s-img").src = v.img; $("#s-title").textContent = S.product.shortTitle;
    $("#s-var").textContent = `${v.label} • ${pix.units || order.qty || 1}x`;
    $("#s-ship").textContent = pix.shipName || "Frete";
    $("#s-shipv").textContent = "incluso"; $("#s-total").textContent = brl(pix.total);
  }

  $("#s-ref").textContent = pix.externalRef || "";
  $("#sec-total").textContent = brl(pix.total);
  if (S.pixRecipientName) { $("#sec-name").textContent = S.pixRecipientName; $("#sec-name-row").classList.remove("hidden"); }

  // ----- Copiar -----
  const label = $("#copy-label");
  $("#copy").onclick = async () => {
    try { await navigator.clipboard.writeText(pix.pixCode); }
    catch { const t = document.createElement("textarea"); t.value = pix.pixCode; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
    label.textContent = "✓ Código copiado! Agora cole no app do banco";
    $("#copy").classList.replace("bg-emerald-600", "bg-emerald-700");
    clearTimeout(window.__ct); window.__ct = setTimeout(() => { label.textContent = "Copiar código Pix"; $("#copy").classList.replace("bg-emerald-700", "bg-emerald-600"); }, 4000);
  };

  // ----- Validade do código (30 min, informada pela PixxBlack) -----
  const expMs = pix.expiresAt ? Date.parse(pix.expiresAt) : NaN;   // ISO 8601 em UTC
  let expired = false;
  if (Number.isFinite(expMs) && expMs - Date.now() > 0 && expMs - Date.now() < 6 * 3600 * 1000) {
    $("#timer-box").classList.remove("hidden");
    const tick = () => {
      const l = Math.max(0, Math.floor((expMs - Date.now()) / 1000));
      const h = Math.floor(l / 3600), m = Math.floor((l % 3600) / 60), s = l % 60, pad = (n) => String(n).padStart(2, "0");
      $("#clock").textContent = (h ? pad(h) + ":" : "") + pad(m) + ":" + pad(s);
      if (!l && !expired) { expired = true; setStatus("expired", "Este código expirou. Volte ao checkout para gerar um novo."); }
    };
    tick(); setInterval(tick, 1000);
  }

  // ----- Verificação de pagamento -----
  function setStatus(kind, text) {
    const dot = $("#status span:first-child");
    dot.className = "h-2 w-2 rounded-full " + ({ wait: "bg-amber-400 animate-pulse", ok: "bg-emerald-500", warn: "bg-red-500", expired: "bg-red-500" }[kind] || "bg-gray-300");
    $("#status-text").textContent = text;
  }
  async function checkPaid() {
    if (!S.PIX_STATUS_ENDPOINT || !pix.externalRef || !pix.chargeId) return null;
    try { const j = await (await fetch(`${S.PIX_STATUS_ENDPOINT}?id=${encodeURIComponent(pix.chargeId)}&ref=${encodeURIComponent(pix.externalRef)}`, { cache: "no-store" })).json(); return !!j.paid; }
    catch { return null; }
  }
  let done = false;
  function goThanks() {
    if (done) return; done = true;
    const isUp = pix.kind === "upsell";
    store.set("paid", { ref: pix.externalRef, total: pix.total, qty: pix.qty || 1 });
    if (isUp) store.set("upsellPaid", true);
    setStatus("ok", "Pagamento confirmado! Redirecionando…");
    // Pedido principal pago -> oferta (upsell). Upsell pago -> confirmação.
    setTimeout(() => (location.href = withUtms(isUp ? "/confirmado" : "/upsell")), 900);
  }
  setInterval(async () => { if (!done && !expired && (await checkPaid())) goThanks(); }, 5000);
  document.addEventListener("visibilitychange", async () => { if (!document.hidden && !done && (await checkPaid())) goThanks(); });

  $("#check").onclick = async () => {
    const b = $("#check"); b.disabled = true; $("#check-spin").classList.remove("hidden"); $("#check-label").textContent = "Verificando…";
    const r = await checkPaid();
    b.disabled = false; $("#check-spin").classList.add("hidden"); $("#check-label").textContent = "Já paguei, verificar";
    if (r) goThanks();
    else if (r === false) setStatus("wait", "Ainda não identificamos o pagamento. Pode levar até 1 minuto — tente de novo em instantes.");
    else setStatus("warn", "Não foi possível verificar agora. Tente novamente em instantes.");
  };
}
