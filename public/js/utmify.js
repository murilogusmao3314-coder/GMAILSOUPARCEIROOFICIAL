/* UTMify — pixel + script de UTMs. TROCAR DE CONTA/BM = mudar só a linha abaixo.
   O ID vem do painel da UTMify: Pixels > (seu pixel) > código de instalação > window.pixelId */
(function () {
  var PIXEL_ID = "6b0129f6a2e5630e45fa9e10";

  window.pixelId = PIXEL_ID;
  function add(src, attrs) {
    var s = document.createElement("script");
    s.src = src; s.async = true; s.defer = true;
    Object.keys(attrs || {}).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    (document.head || document.documentElement).appendChild(s);
  }
  add("https://cdn.utmify.com.br/scripts/pixel/pixel.js");
  add("https://cdn.utmify.com.br/scripts/utms/latest.js", { "data-utmify-prevent-xcod-sck": "", "data-utmify-prevent-subids": "" });
})();
