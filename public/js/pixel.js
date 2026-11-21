/* Meta Pixel — ID 1125182217062286 */
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1125182217062286');
fbq('track', 'PageView');

// Helper: dispara evento padrão sem quebrar a página se o pixel for bloqueado (adblock).
window.track = function (name, data, opts) {
  try { fbq('track', name, data || {}, opts || {}); } catch (e) {}
};
window.trackCustom = function (name, data) { try { fbq('trackCustom', name, data || {}); } catch (e) {} };
window.PRODUCT_ID = "armario-multifuncional";
