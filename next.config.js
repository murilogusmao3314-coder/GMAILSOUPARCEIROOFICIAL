/** @type {import('next').NextConfig} */
// A loja é composta por páginas HTML estáticas em /public.
// Os rewrites abaixo servem "/" e "/checkout" etc. sem a extensão .html.
const pages = ["checkout", "pix", "obrigado", "contato", "termos-de-uso", "politica-de-privacidade", "trocas-e-devolucoes", "politica-envio"];
module.exports = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/index.html" },
        ...pages.map((p) => ({ source: `/${p}`, destination: `/${p}.html` })),
      ],
    };
  },
};
