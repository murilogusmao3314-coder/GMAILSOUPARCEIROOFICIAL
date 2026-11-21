const buyer = store.get("buyer") || {};
const main = store.get("mainOrder") || {};
const first = (buyer.customer && buyer.customer.name ? buyer.customer.name.split(" ")[0] : "");
if (first) $("#c-title").textContent = `Pedido confirmado, ${first}!`;
const v = Object.values(VARIANTS).find((x) => x.label === main.variant) || VARIANTS["2-pretos"];
$("#c-img").src = v.img; $("#c-prod").textContent = S.product.shortTitle;
$("#c-var").textContent = main.variant ? `${main.variant} • ${main.units || 1}x${main.extras ? ` • +${main.extras} extra(s)` : ""}` : "";
$("#c-code").textContent = main.ref ? "#" + main.ref.slice(-6) : "";
// Comprou só o kit (sem o pedido principal): esconde a linha do armário
if (!main.ref) $("#c-img").closest(".flex.gap-3").classList.add("hidden");
let total = main.total || 0;
if (store.get("upsellPaid")) { $("#c-up").classList.remove("hidden"); if (!main.ref) $("#c-up").classList.remove("mt-3"); $("#c-up-img").src = S.upsell.image; $("#c-up-name").textContent = S.upsell.name; total += S.upsell.price; }
$("#c-total").textContent = total ? brl(total) : "";
if (buyer.customer && buyer.customer.email) $("#c-mail").textContent = buyer.customer.email;
const sh = buyer.shipping || {};
if (buyer.customer && !(sh.street || sh.zipCode)) $("#c-noaddr").classList.remove("hidden");

// ---- Confete (sem bibliotecas) ----
(function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = $("#confetti"), ctx = cv.getContext("2d");
  const fit = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; };
  fit(); addEventListener("resize", fit);
  const colors = ["#e60000", "#22c55e", "#facc15", "#3b82f6", "#f97316", "#a855f7", "#ec4899"];
  const dpr = devicePixelRatio, mk = (burst) => ({
    x: burst ? innerWidth / 2 : Math.random() * innerWidth, y: burst ? innerHeight * 0.35 : -20 - Math.random() * innerHeight * 0.5,
    vx: burst ? (Math.random() - 0.5) * 16 : (Math.random() - 0.5) * 3, vy: burst ? -Math.random() * 14 - 4 : Math.random() * 3 + 2,
    w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.35,
    c: colors[(Math.random() * colors.length) | 0], life: 0, round: Math.random() < 0.25,
  });
  const ps = [...Array.from({ length: 140 }, () => mk(true)), ...Array.from({ length: 110 }, () => mk(false))];
  const start = performance.now();
  (function frame(t) {
    const el = t - start; ctx.clearRect(0, 0, cv.width, cv.height);
    let alive = 0;
    for (const p of ps) {
      p.vy += 0.18; p.vx *= 0.995; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      if (p.y < innerHeight + 30 && (el < 5000 || p.y > 0)) alive++;
      ctx.save(); ctx.translate(p.x * dpr, p.y * dpr); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, Math.min(1, 1 - (el - 4000) / 3000));
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w * 0.5 * dpr, 0, 6.28); ctx.fill(); } else ctx.fillRect(-p.w / 2 * dpr, -p.h / 2 * dpr, p.w * dpr, p.h * dpr);
      ctx.restore();
    }
    if (alive && el < 7500) requestAnimationFrame(frame); else ctx.clearRect(0, 0, cv.width, cv.height);
  })(start);
})();
