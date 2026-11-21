const P = S.product;
$("#title").textContent = P.title;
$("#price").textContent = brl(P.price);
$("#compare").textContent = brl(P.comparePrice);
$("#off").textContent = "-" + Math.round((1 - P.price / P.comparePrice) * 100) + "%";
$("#installments").textContent = `${P.installments}x de ${brl(Math.round(P.price / P.installments))} sem juros no cartão`;
$("#store-name").textContent = S.name;
$("#footer").innerHTML = footerHTML();
track("ViewContent", { content_ids: [PRODUCT_ID], content_type: "product", content_name: P.shortTitle, value: P.price / 100, currency: "BRL" });

// Contador regressivo até o FIM REAL da promoção (STORE.promoEndsAt). Sem data (ou data passada): fica escondido.
const promoEnd = S.promoEndsAt ? Date.parse(S.promoEndsAt) : NaN;
if (Number.isFinite(promoEnd) && promoEnd > Date.now()) {
  $("#timer").style.display = "";
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    const d = Math.max(0, Math.floor((promoEnd - Date.now()) / 1000));
    if (!d) { $("#timer").style.display = "none"; return; }
    const h = Math.floor(d / 3600);
    $("#t-h").textContent = pad(h); $("#t-m").textContent = pad(Math.floor((d % 3600) / 60)); $("#t-s").textContent = pad(d % 60);
  };
  tick(); setInterval(tick, 1000);
}

// Galeria
const gal = $("#gallery"), imgs = $$("img", gal);
imgs.forEach((im, i) => {
  const t = document.createElement("img");
  t.src = im.src; t.className = "h-14 w-14 shrink-0 rounded border-2 object-cover cursor-pointer " + (i ? "border-transparent" : "border-red-600");
  t.onclick = () => gal.scrollTo({ left: i * gal.clientWidth, behavior: "smooth" });
  $("#thumbs").appendChild(t);
});
const go = (d) => gal.scrollBy({ left: d * gal.clientWidth, behavior: "smooth" });
$("#prev").onclick = () => go(-1); $("#next").onclick = () => go(1);
gal.addEventListener("scroll", () => {
  const i = Math.round(gal.scrollLeft / gal.clientWidth);
  $("#counter").textContent = `${i + 1}/${imgs.length}`;
  $$("#thumbs img").forEach((t, k) => t.classList.toggle("border-red-600", k === i)), $$("#thumbs img").forEach((t, k) => t.classList.toggle("border-transparent", k !== i));
});

// Chips de variante
let selected = "2-pretos";
const chipsEl = $("#variant-chips");
["2-pretos", "2-brancos", "1-preto-1-branco"].forEach((k) => {
  const b = document.createElement("button");
  b.dataset.k = k;
  b.className = "shrink-0 flex items-center gap-2 rounded-full border px-3 py-2 text-xs";
  b.innerHTML = `<img src="${VARIANTS[k].img}" class="h-5 w-5 rounded object-cover" alt=""/>${VARIANTS[k].label}`;
  b.onclick = () => { selected = k; paintChips(); };
  chipsEl.appendChild(b);
});
function paintChips() {
  $$("button", chipsEl).forEach((b) => {
    const on = b.dataset.k === selected;
    b.classList.toggle("border-red-600", on); b.classList.toggle("bg-red-50", on); b.classList.toggle("text-red-600", on);
    b.classList.toggle("border-gray-200", !on);
  });
}
paintChips();

// Avaliações
const REVIEWS = [
  ["Fernanda R.", "22 Mar 2026", "Amei! Coube tudo no banheiro e veio dois pelo preço de um.", 34],
  ["Marcos T.", "14 Mar 2026", "Bom custo-benefício. Usei na lavanderia e ficou firme. Material resistente.", 19],
  ["Juliana S.", "05 Mar 2026", "Que achado! Paguei por um e vieram dois. Coloquei um na cozinha e outro no quarto das crianças. Organização total, entrega rápida e embalagem super segura. Recomendo demais!", 42],
  ["Ricardo A.", "27 Fev 2026", "Cumpre o que promete. Aguenta peso e os pés ajustáveis ajudam muito.", 15],
  ["Patrícia G.", "03 Fev 2026", "Lindo! Coloquei na sala perto da TV e ficou super elegante. Ótimo acabamento.", 17],
  ["Thiago N.", "29 Jan 2026", "Muito bom pro preço. Uso pra guardar ferramentas na garagem e aguenta bem o peso. Recomendo.", 12],
];
$("#reviews").innerHTML = REVIEWS.map(([n, d, t, u], i) => `
  <div class="pb-4 mb-4 border-b border-gray-100">
    <div class="flex items-center gap-2.5"><span class="h-9 w-9 shrink-0 rounded-full bg-orange-100 text-orange-600 text-sm font-bold flex items-center justify-center">${n[0]}</span><div class="flex flex-1 min-w-0 items-center justify-between"><b class="text-sm">${n}</b><span class="text-xs text-gray-400">${d}</span></div></div>
    <div class="text-yellow-400 my-1.5">★★★★★</div>
    <p class="text-sm text-gray-600 leading-relaxed">${t}</p>
    <div class="flex items-center gap-3 mt-3"><button type="button" class="rv-thumb shrink-0 rounded-lg" data-i="${i}" aria-label="Ampliar foto de ${n}"><img src="/assets/review-${i + 1}.jpg" decoding="async" alt="Foto enviada por ${n}" class="h-16 w-16 rounded-lg object-cover border border-gray-100"/></button><span class="text-xs text-gray-500">Útil (${u})</span></div>
  </div>`).join("");

// FAQ (clique na pergunta para abrir a resposta)
const FAQ = [
  ["Quais são as medidas do armário?", "O armário tem <b>1,45 m de altura</b>, <b>80 cm de largura</b> e <b>32 cm de profundidade</b>. Cabe bem em cozinhas, lavanderias, banheiros e áreas de serviço."],
  ["Quanto peso o armário aguenta?", "A estrutura em aço reforçado suporta até <b>80 kg distribuídos</b> nas prateleiras, sem entortar nem balançar."],
  ["De que material é feito?", "Aço carbono reforçado com <b>pintura epóxi anticorrosiva</b> (acabamento eletrostático), com portas dobráveis tipo \"harmônica\"."],
  ["Como funciona o Pague 1 Leve 2?", "Você paga por 1 e recebe <b>2 armários</b>. Na hora de escolher, combine as cores: 2 pretos, 2 brancos ou 1 preto e 1 branco. Se preferir levar mais, também tem a opção <b>Compre 2 e leve 4</b>."],
  ["A montagem é difícil?", "Não. O armário vem com <b>manual ilustrado passo a passo</b> e dá para montar sozinho em poucos minutos, sem ferramentas profissionais."],
  ["Qual o prazo de entrega?", "Você recebe em <b>5 a 8 dias úteis</b> após a confirmação do pagamento. Pedidos feitos até as 14h são despachados no mesmo dia, e você acompanha tudo pelo código de rastreio."],
  ["Tem garantia?", "Sim, <b>1 ano de garantia</b> contra defeitos de fabricação. Além disso, você pode desistir da compra em até 7 dias após receber o produto."],
];
$("#faq").innerHTML = FAQ.map(([q, a]) => `<details class="faq-item group py-3.5"><summary class="flex justify-between items-center gap-3 text-sm font-medium text-gray-900 cursor-pointer list-none [&::-webkit-details-marker]:hidden"><span>${q}</span><svg class="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></summary><p class="text-sm text-gray-600 mt-2.5 leading-relaxed">${a}</p></details>`).join("");
// abre uma por vez
$$("#faq .faq-item").forEach((d) => d.addEventListener("toggle", () => { if (d.open) $$("#faq .faq-item").forEach((o) => { if (o !== d) o.open = false; }); }));

// Sheet
const sheet = $("#sheet"); let pick = null;
function card(k) {
  const v = VARIANTS[k];
  return `<button data-k="${k}" class="vcard rounded-xl border-2 border-gray-200 p-1.5 text-center"><img src="${v.img}" class="rounded-lg aspect-square object-cover w-full" alt=""/><span class="block text-[11px] mt-1.5 text-gray-700 leading-tight">${v.label}</span></button>`;
}
$("#sheet-g1").innerHTML = ["2-pretos", "2-brancos", "1-preto-1-branco"].map(card).join("");
$("#sheet-g2").innerHTML = ["4-pretos", "4-brancos", "2-pretos-2-brancos"].map(card).join("");
function paintSheet() {
  $$(".vcard").forEach((c) => { const on = c.dataset.k === pick; c.classList.toggle("border-red-600", on); c.classList.toggle("bg-red-50", on); c.classList.toggle("border-gray-200", !on); });
  const b = $("#sheet-buy");
  b.className = "lbl flex items-center justify-center w-full rounded-full py-3 text-sm font-bold text-white " + (pick ? "bg-red-600" : "bg-gray-300 cursor-not-allowed");
  if (pick) {
    // Só agora o botão vira um link real para /checkout: é esse clique (e só ele) que conta como "iniciar checkout"
    b.setAttribute("href", withUtms("/checkout")); b.removeAttribute("aria-disabled");
  } else { b.removeAttribute("href"); b.setAttribute("aria-disabled", "true"); }
}
$$(".vcard").forEach((c) => (c.onclick = () => { pick = c.dataset.k; store.set("order", { color: pick, qty: VARIANTS[pick].qty }); paintSheet(); }));
$$(".open-sheet").forEach((b) => (b.onclick = () => { sheet.classList.remove("hidden"); }));
const close = () => sheet.classList.add("hidden");
$("#sheet-close").onclick = close; $("#sheet-bg").onclick = close;
// Sem variante escolhida o link não tem href: não faz nada
$("#sheet-buy").addEventListener("click", (e) => { if (!pick) e.preventDefault(); });

// ---- Frete grátis personalizado pelo ESTADO ("para São Paulo e região"), via geolocalização aproximada do IP no servidor ----
const ESTADOS = { AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "o Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins" };
(async function geoShipping() {
  try {
    const g = await (await fetch("/api/geo", { cache: "no-store" })).json();
    const nome = g && ESTADOS[g.uf];
    if (!nome) return;                       // sem dado: mantém o texto padrão
    const lugar = g.uf === "DF" ? "Distrito Federal" : nome;
    $("#geo-top").textContent = `Frete grátis para ${lugar} e região`;
    $("#geo-ship").textContent = `Frete Grátis para ${lugar} e região (e todo o Brasil)!`;
  } catch {}
})();

// ---- Ampliar foto da avaliação ----
(function reviewLightbox() {
  const srcs = REVIEWS.map((_, i) => `/assets/review-${i + 1}.jpg`);
  const box = document.createElement("div");
  box.id = "rv-lightbox";
  box.className = "hidden fixed inset-0 z-[60] bg-black/90 flex items-center justify-center";
  box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true");
  box.innerHTML = `
    <button type="button" id="rv-close" class="absolute top-3 right-3 h-10 w-10 rounded-full bg-white/15 text-white text-2xl leading-none" aria-label="Fechar">×</button>
    <button type="button" id="rv-prev" class="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/15 text-white text-2xl" aria-label="Foto anterior">‹</button>
    <button type="button" id="rv-next" class="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/15 text-white text-2xl" aria-label="Próxima foto">›</button>
    <img id="rv-img" class="max-h-[85vh] max-w-[92vw] rounded-lg object-contain select-none" alt="Foto da avaliação" />
    <p id="rv-count" class="absolute bottom-4 inset-x-0 text-center text-white/80 text-xs"></p>`;
  document.body.appendChild(box);
  let cur = 0;
  const show = (i) => { cur = (i + srcs.length) % srcs.length; $("#rv-img").src = srcs[cur]; $("#rv-count").textContent = `${cur + 1} / ${srcs.length}`; };
  const open = (i) => { show(i); box.classList.remove("hidden"); document.body.style.overflow = "hidden"; };
  const close = () => { box.classList.add("hidden"); document.body.style.overflow = ""; };
  $("#reviews").addEventListener("click", (e) => { const t = e.target.closest(".rv-thumb"); if (t) open(+t.dataset.i); });
  $("#rv-close").onclick = close;
  $("#rv-prev").onclick = (e) => { e.stopPropagation(); show(cur - 1); };
  $("#rv-next").onclick = (e) => { e.stopPropagation(); show(cur + 1); };
  box.addEventListener("click", (e) => { if (e.target === box) close(); });   // clicar fora da foto fecha
  document.addEventListener("keydown", (e) => {
    if (box.classList.contains("hidden")) return;
    if (e.key === "Escape") close(); else if (e.key === "ArrowLeft") show(cur - 1); else if (e.key === "ArrowRight") show(cur + 1);
  });
  let x0 = null;                                                               // deslizar para trocar de foto
  box.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); x0 = null; });
})();
