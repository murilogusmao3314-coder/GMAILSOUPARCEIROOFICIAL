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
- **Pix (PinguPag)**: já integrado — veja a seção "PinguPag" abaixo. O front chama `PIX_ENDPOINT` (agora `/api/create-pix`) com um POST JSON e espera
  `{ "success": true, "data": { "pixCode": "...", "qrCodeImage": "data:image/png;base64,...", "externalRef": "..." } }`.
  Opcional: `PIX_STATUS_ENDPOINT?ref=...` retornando `{ "paid": true }` para redirecionar a `/obrigado` automaticamente.
  Sem o endpoint configurado, o checkout avisa que o pagamento não está configurado.

## Antes de publicar
- Troque os textos/avaliações/contagens ("5.821 vendidos", 327 avaliações, etc.) por dados reais da sua loja.
- Revise as políticas legais com seu contador/advogado.

## UTMify
Em todas as páginas: `window.pixelId` + `cdn.utmify.com.br/scripts/pixel/pixel.js` e o script de UTMs (`.../utms/latest.js`).
Todos os parâmetros da URL de entrada (UTMs, fbclid e qualquer outro) são guardados em `localStorage` (chave `url_params`) e anexados a todo link/navegação interna (home → checkout → Pix → obrigado). Também vão no campo `tracking` do `PIX_ENDPOINT`.

## PinguPag (Pix)
Rotas de servidor (a chave secreta nunca vai para o navegador):
- `POST /api/create-pix` → valida o pedido, **recalcula o valor no servidor** e cria a transação em `POST /gateway/v1/transaction` (envia cliente, endereço e UTMs em `tracking`). Responde `{ success, data: { pixCode, qrCodeImage, externalRef } }`.
- `GET /api/pix-status?ref=...` → consulta `/gateway/v1/query?action=list_transactions&external_id=...`; `approved` = pago. É isso que dispara a ida para `/obrigado` e o evento **Purchase**.
- `POST /api/webhook` → recebe o postback da PinguPag e responde 200.

**Para ativar:** na Vercel, em *Settings → Environment Variables*, crie `PINGUPAG_API_KEY` com a sua Chave Secreta (painel PinguPag → "Configurações e API") e faça um novo deploy.
Se mudar preços/frete/extras em `public/js/config.js`, atualize também `PRICING` em `lib-pingupag.js` (o servidor recusa pedidos com valor diferente).

## Vendas na UTMify e na Meta (sem duplicar)
**Regra de ouro: a Meta é tratada SÓ pela UTMify.** A UTMify já dispara o Pixel Meta e a API de Conversões
(com o ID de deduplicação dela). Por isso este site **não** carrega o código do Pixel Meta e **não** envia
nada à Meta — qualquer evento extra nosso seria contado em dobro (o aviso "Detectamos outro código de Pixel Meta").

| Etapa | O que acontece |
|---|---|
| Visita / checkout | scripts da UTMify (`pixel.js` + `utms/latest.js`) registram a sessão e disparam os eventos da Meta |
| Pix gerado | o servidor envia o pedido à UTMify como `waiting_payment` (com UTMs, cliente e produtos) |
| Pix pago | o webhook da PinguPag (link assinado, confirmado na API) envia o **mesmo `orderId`** como `paid` → a UTMify registra a venda na campanha/conjunto/anúncio e repassa o Purchase à Meta |

Anti-duplicação: `orderId` fixo (= referência do pedido) e `createdAt` derivado da referência; reenvios do webhook só atualizam o mesmo pedido.

**Checklist:**
1. **PinguPag**: integração nativa com a UTMify **desligada** (senão a venda entra duas vezes).
2. **UTMify**: Pixel Meta cadastrado (já feito). Não adicione o código do Pixel Meta no site.
3. Vercel: `UTMIFY_API_TOKEN` (UTMify → Integrações → Webhooks → Credenciais de API) e `PINGUPAG_API_KEY`.
4. Teste: uma venda de valor baixo → na UTMify o pedido aparece **uma vez**, com campanha/conjunto/anúncio; na Meta o Purchase aparece **uma vez**. O aviso de "outro Pixel Meta" deve sumir.
