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

## Meta Pixel (ID 1125182217062286)
`public/js/pixel.js` é carregado em todas as páginas. Eventos:
- `PageView` — todas as páginas
- `ViewContent` — home
- `AddToCart` — ao confirmar a variante ("Comprar agora"/"Adicionar ao carrinho")
- `InitiateCheckout` — abrir o checkout
- `AddPaymentInfo` — clicar em "Fazer pedido" com os dados válidos
- `PixGerado` (personalizado) — Pix gerado
- `Purchase` — **somente** quando o pagamento é confirmado (`PIX_STATUS_ENDPOINT` retorna `paid:true`) e só uma vez por pedido

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
**Quem envia o quê** — cada destino recebe a venda por UM único caminho:

| Destino | Caminho | Como evita duplicar |
|---|---|---|
| UTMify | servidor → `POST api.utmify.com.br/api-credentials/orders` | `orderId` = referência do pedido (sempre o mesmo). Pedido criado = `waiting_payment`; ao pagar, o MESMO `orderId` vira `paid` (atualiza, não cria outro). `createdAt` é derivado da referência (idêntico nas duas chamadas). |
| Meta | navegador (`fbq Purchase`) **+** servidor (API de Conversões) | os dois usam o MESMO `event_id` = `purchase-<referência>` → a Meta desduplica. O servidor garante a venda mesmo se o cliente fechar a página após pagar no app do banco. |

Gatilho: o webhook da PinguPag (`/api/webhook?d=...`). O link tem assinatura (HMAC) gerada pelo site, e a venda só conta depois que a API da PinguPag confirma `approved` com o mesmo valor. O link carrega os UTMs, `fbp`, `fbc`, IP e navegador do clique original.

**Checklist para NÃO duplicar (faça uma vez):**
1. Na **PinguPag**: deixe a integração nativa com a UTMify **desligada** (senão a venda entra duas vezes).
2. Na **UTMify**: no cadastro do Pixel da Meta, **não** deixe a UTMify enviar o evento `Purchase` para a Meta (o site já envia). Só uma fonte pode mandar o Purchase.
3. Variáveis na Vercel: `UTMIFY_API_TOKEN`, `META_CAPI_TOKEN` (veja `.env.example`).
4. Teste: use `META_TEST_EVENT_CODE` e confira no Gerenciador de Eventos que o Purchase aparece **uma vez** como "Navegador e servidor" (desduplicado). Na UTMify, confira que o pedido aparece **uma vez**, com campanha/conjunto/anúncio preenchidos.
