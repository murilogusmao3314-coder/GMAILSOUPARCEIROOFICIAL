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
- **Pix (PixxBlack)**: já integrado — veja a seção "PixxBlack" abaixo. O front chama `PIX_ENDPOINT` (`/api/create-pix`) e consulta `PIX_STATUS_ENDPOINT` (`/api/pix-status`) até o pagamento ser confirmado.

## Antes de publicar
- Troque os textos/avaliações/contagens ("5.821 vendidos", 327 avaliações, etc.) por dados reais da sua loja.
- Revise as políticas legais com seu contador/advogado.

## UTMify
Em todas as páginas: `window.pixelId` + `cdn.utmify.com.br/scripts/pixel/pixel.js` e o script de UTMs (`.../utms/latest.js`).
Todos os parâmetros da URL de entrada (UTMs, fbclid e qualquer outro) são guardados em `localStorage` (chave `url_params`) e anexados a todo link/navegação interna (home → checkout → Pix → obrigado). Também vão no campo `tracking` do `PIX_ENDPOINT`.

## PixxBlack (Pix)
Rotas de servidor (a chave nunca vai para o navegador):
- `POST /api/create-pix` → valida o pedido, **recalcula o valor no servidor** e cria a cobrança em `POST /charges` (envia pagador, descrição, `external_reference` e UTMs em `tracking`; `Idempotency-Key` = referência do pedido). Devolve o código copia e cola (o QR Code é gerado na tela).
- `GET /api/pix-status?id=<id da cobrança>&ref=<pedido>` → consulta `GET /charges/{id}`; `paid` = pago. É isso que leva o cliente a `/upsell` e depois a `/confirmado`.
- `POST /api/webhook` → recebe os avisos da PixxBlack. **Confere a assinatura** (`X-PixBlack-Signature`, tolerância de 5 min), ignora evento repetido (mesmo `id`) e, em `charge.paid`, confirma na API antes de considerar paga.

**Para ativar** (Vercel → Settings → Environment Variables, depois novo deploy):
1. `PIXXBLACK_API_KEY` — painel PixxBlack → Integrações → "Gerar chave de API".
2. `PIXXBLACK_WEBHOOK_SECRET` — painel → Integrações → Webhooks: cadastre `https://SEU-DOMINIO/api/webhook` e copie o segredo `whsec_...` (aparece uma única vez).

Se mudar preços/frete/extras em `public/js/config.js`, atualize também `PRICING` em `lib-pixxblack.js` (o servidor recusa pedidos com valor diferente).

**Endereço:** a API da PixxBlack **não tem campo de endereço**. O que o cliente digitar no checkout não é enviado ao gateway.

## Vendas na UTMify e na Meta (sem duplicar)
**A venda vai para a UTMify pela integração da própria PixxBlack**, e a **Meta é tratada só pela UTMify** (Pixel + API de Conversões, com deduplicação). O site não manda venda nenhuma à UTMify nem nada à Meta: qualquer envio extra contaria em dobro.

| Etapa | O que acontece |
|---|---|
| Visita / checkout | scripts da UTMify (`public/js/utmify.js`) registram a sessão e disparam os eventos da Meta |
| Pix gerado | o site cria a cobrança na PixxBlack **com os UTMs** (`tracking`) e os dados do pagador; a PixxBlack envia o pedido à UTMify |
| Pix pago | a PixxBlack envia o pagamento à UTMify (e devolução, se houver) |

**Checklist:**
1. **PixxBlack → Integrações → UTMify:** conecte a UTMify (é por aqui que a venda chega lá, com campanha/conjunto/anúncio).
2. **UTMify:** Pixel Meta cadastrado, com o token da API de Conversões. Não coloque o código do Pixel Meta no site.
3. Anúncios com os parâmetros de URL (`utm_source=FB&utm_campaign={{campaign.name}}|{{campaign.id}}…`); os UTMs são guardados e levados até o Pix.
4. Teste: uma venda → na UTMify o pedido aparece **uma vez**, com campanha/conjunto/anúncio; na Meta o Purchase aparece **uma vez**.

## Fluxo pós-pagamento (upsell)
`/checkout` → `/pix` → (pago) → **`/upsell`** → `/confirmado`
- `/upsell`: oferta do Kit Cozinha Completa (3 produtos, R$ 59,90 — `STORE.upsell` em `public/js/config.js` e `UPSELL` em `lib-pixxblack.js`, mantenha iguais). "Comprar agora" gera um **novo Pix** com os dados já informados (pedido separado, com `orderId` próprio e os mesmos UTMs); "Não quero" vai direto para `/confirmado`.
- `/confirmado`: tela de confirmação com confete e resumo (inclui o upsell se foi pago).
- Cada Pix (pedido e upsell) vira uma cobrança separada na PixxBlack e uma venda separada na UTMify.
