# Loja de Armários (clone de design)

Site estático (HTML + Tailwind + JS puro) com o mesmo visual da loja de referência:
`/` (produto) → `/checkout` → `/pix` → `/obrigado`, mais `/contato`, `/termos-de-uso`,
`/politica-de-privacidade`, `/trocas-e-devolucoes` e `/politica-envio`.

**Não inclui** as páginas de taxa de nota fiscal (`/nfe`), upsell de frete (`/envioup`), painel admin
nem cronômetros/ameaças falsas. O contador da home termina no fim do dia e não reinicia sozinho.

## Rodar
```bash
npm install
npm run dev        # http://localhost:3000
npm run build:css  # recompila o Tailwind após mexer em classes
```
Projeto Next.js (compatível com v0/Vercel): as páginas ficam em `public/` e `next.config.js` serve `/`, `/checkout` etc. sem `.html`.

## O que você precisa editar — `public/js/config.js`
- Nome da loja, e-mail, telefone, razão social, CNPJ, endereço (aparecem em contato, rodapé e políticas). Já preenchido com os dados da Casa Fácil / RCS Sports Management & Solutions LTDA.
- Preço, preço "de" (use só um preço realmente praticado), frete e produtos extras.
- **Pix**: o front chama `PIX_ENDPOINT` (seu backend/gateway) com um POST JSON e espera
  `{ "success": true, "data": { "pixCode": "...", "qrCodeImage": "data:image/png;base64,...", "externalRef": "..." } }`.
  Opcional: `PIX_STATUS_ENDPOINT?ref=...` retornando `{ "paid": true }` para redirecionar a `/obrigado` automaticamente.
  Sem o endpoint configurado, o checkout avisa que o pagamento não está configurado.

## Antes de publicar
- Troque os textos/avaliações/contagens ("5.821 vendidos", 327 avaliações, etc.) por dados reais da sua loja.
- Revise as políticas legais com seu contador/advogado.
