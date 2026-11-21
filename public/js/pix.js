$("#ic-back").innerHTML = icon.back;
const pix = store.get("pix");
if (!pix || !pix.pixCode) { $("#empty").classList.remove("hidden"); } else {
  $("#main").classList.remove("hidden");
  $("#total").textContent = brl(pix.total); $("#code").textContent = pix.pixCode;
  if (pix.qrCodeImage) $("#qr").innerHTML = `<img src="${pix.qrCodeImage}" class="h-48 w-48" alt="QR Code Pix"/>`;
  $("#copy").onclick = async () => {
    try { await navigator.clipboard.writeText(pix.pixCode); } catch { const t = document.createElement("textarea"); t.value = pix.pixCode; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
    const b = $("#copy"); b.textContent = "✓ Código copiado!"; b.classList.replace("bg-red-600", "bg-green-600");
    setTimeout(() => { b.textContent = "Copiar código Pix"; b.classList.replace("bg-green-600", "bg-red-600"); }, 3000);
  };
  // Prazo real de expiração (15 min a partir da geração do Pix)
  const start = store.get("pixStart") || Date.now(); store.set("pixStart", start);
  const tick = () => { const l = Math.max(0, 15 * 60 - Math.floor((Date.now() - start) / 1000)); $("#clock").textContent = String(Math.floor(l / 60)).padStart(2, "0") + ":" + String(l % 60).padStart(2, "0"); if (!l) $("#status").textContent = "O código expirou. Volte e faça um novo pedido."; };
  tick(); setInterval(tick, 1000);
  // Confirmação automática (se o seu backend expõe o status)
  if (S.PIX_STATUS_ENDPOINT && pix.externalRef) setInterval(async () => {
    try { const j = await (await fetch(`${S.PIX_STATUS_ENDPOINT}?ref=${encodeURIComponent(pix.externalRef)}`)).json(); if (j.paid) location.href = "/obrigado"; } catch {}
  }, 5000);
}
