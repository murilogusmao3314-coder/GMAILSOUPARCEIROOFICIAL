const S = window.STORE;
const brl = (c) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
  get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const VARIANTS = {
  "2-pretos": { label: "2 Pretos", qty: 1, img: "/assets/variant-2-pretos.jpg" },
  "2-brancos": { label: "2 Brancos", qty: 1, img: "/assets/variant-2-brancos.jpg" },
  "1-preto-1-branco": { label: "1 Preto e 1 Branco", qty: 1, img: "/assets/variant-1-preto-1-branco.jpg" },
  "4-pretos": { label: "4 Pretos", qty: 2, img: "/assets/variant-4-pretos.jpg" },
  "4-brancos": { label: "4 Brancos", qty: 2, img: "/assets/variant-4-brancos.jpg" },
  "2-pretos-2-brancos": { label: "2 Pretos e 2 Brancos", qty: 2, img: "/assets/variant-2-pretos-2-brancos.jpg" },
};

const icon = {
  back: '<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  shield: '<svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  pin: '<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  star: '<svg class="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
};

// Rodapé comum
function footerHTML() {
  return `<footer class="bg-gray-50 border-t border-gray-200 px-4 py-6 text-xs text-gray-500">
    <div class="grid grid-cols-3 gap-4 mb-5">
      <div><p class="font-semibold text-gray-800 mb-2">Compre</p><p class="mb-1">Mais vendidos</p><p>Novidades</p></div>
      <div><p class="font-semibold text-gray-800 mb-2">Sobre</p><p class="mb-1">Sobre nós</p><p>Carreiras</p></div>
      <div><p class="font-semibold text-gray-800 mb-2">Suporte</p><a class="block mb-1" href="/contato">Central de Ajuda</a><a href="/contato">Contato</a></div>
    </div>
    <div class="mb-4"><p class="font-semibold text-gray-800 mb-2">Política &amp; Legal</p>
      <a class="block mb-1" href="/politica-de-privacidade">Política de privacidade</a>
      <a class="block mb-1" href="/termos-de-uso">Termos de uso</a>
      <a class="block mb-1" href="/trocas-e-devolucoes">Trocas e devoluções</a>
      <a class="block" href="/politica-envio">Política de envio</a></div>
    <p class="text-center">© ${new Date().getFullYear()} ${S.name}. ${S.company} — CNPJ ${S.cnpj}</p>
  </footer>`;
}

// Se alguma imagem falhar ao carregar (rede instável), tenta de novo até 2 vezes.
document.addEventListener("error", (e) => {
  const el = e.target;
  if (el.tagName !== "IMG") return;
  const n = +(el.dataset.retry || 0);
  if (n >= 2) return;
  el.dataset.retry = n + 1;
  setTimeout(() => { el.src = el.src.split("?")[0] + "?r=" + (n + 1) + Date.now(); }, 800 * (n + 1));
}, true);

// ---- UTMs: guarda os parâmetros de campanha da 1ª visita e leva adiante (home -> checkout -> Pix) ----
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "src", "sck", "xcod", "fbclid"];
(function captureUtms() {
  try {
    const q = new URLSearchParams(location.search), saved = store.get("utms") || {};
    UTM_KEYS.forEach((k) => { if (q.get(k)) saved[k] = q.get(k); });
    store.set("utms", saved);
  } catch {}
})();
const getUtms = () => store.get("utms") || {};
// Mantém a query string (UTMs) ao navegar entre páginas
const withUtms = (url) => { const u = getUtms(), qs = new URLSearchParams(u).toString(); return qs ? url + (url.includes("?") ? "&" : "?") + qs : url; };
