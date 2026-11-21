const P = S.product;
$("#title").textContent = P.title;
$("#price").textContent = brl(P.price);
$("#compare").textContent = brl(P.comparePrice);
$("#off").textContent = "-" + Math.round((1 - P.price / P.comparePrice) * 100) + "%";
$("#installments").textContent = `${P.installments}x de ${brl(Math.round(P.price / P.installments))} sem juros no cartão`;
$("#store-name").textContent = S.name;
$("#store-initials").textContent = S.name.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase();
$("#footer").innerHTML = footerHTML();

// Contador regressivo até o fim do dia (não reinicia sozinho)
function tick() {
  const end = new Date(); end.setHours(23, 59, 59, 999);
  let d = Math.max(0, Math.floor((end - new Date()) / 1000));
  const p = (n) => String(n).padStart(2, "0");
  $("#t-h").textContent = p(Math.floor(d / 3600)); $("#t-m").textContent = p(Math.floor((d % 3600) / 60)); $("#t-s").textContent = p(d % 60);
}
tick(); setInterval(tick, 1000);

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
$("#reviews").innerHTML = REVIEWS.map(([n, d, t, u]) => `
  <div class="pb-4 mb-4 border-b border-gray-100">
    <div class="flex justify-between"><b class="text-sm">${n}</b><span class="text-xs text-gray-400">${d}</span></div>
    <div class="text-yellow-400 my-1">★★★★★</div>
    <p class="text-sm text-gray-600 leading-relaxed">${t}</p>
    <p class="text-xs text-gray-500 mt-2">Útil (${u})</p>
  </div>`).join("");

// FAQ
const FAQ = [
  ["De que material é feito?", "Aço carbono reforçado com pintura epóxi anticorrosiva e acabamento eletrostático."],
  ["Qual o prazo de entrega?", "Receba em 5 a 8 dias úteis após a confirmação do pagamento."],
  ["Tem garantia?", "Sim, 1 ano de garantia contra defeitos de fabricação."],
];
$("#faq").innerHTML = FAQ.map(([q, a]) => `<details class="py-3"><summary class="flex justify-between items-center text-sm font-medium cursor-pointer list-none">${q}<span class="text-gray-400">⌄</span></summary><p class="text-sm text-gray-600 mt-2">${a}</p></details>`).join("");

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
  const b = $("#sheet-buy"); b.disabled = !pick;
  b.className = "w-full rounded-full py-3 text-sm font-bold text-white " + (pick ? "bg-red-600" : "bg-gray-300 cursor-not-allowed");
}
$$(".vcard").forEach((c) => (c.onclick = () => { pick = c.dataset.k; paintSheet(); }));
$$(".open-sheet").forEach((b) => (b.onclick = () => { sheet.classList.remove("hidden"); }));
const close = () => sheet.classList.add("hidden");
$("#sheet-close").onclick = close; $("#sheet-bg").onclick = close;
$("#sheet-buy").onclick = () => {
  if (!pick) return;
  store.set("order", { color: pick, qty: VARIANTS[pick].qty });
  location.href = "checkout.html";
};
