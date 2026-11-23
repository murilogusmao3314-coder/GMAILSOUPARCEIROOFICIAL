// ======= CONFIGURAÇÃO DA LOJA — edite aqui =======
window.STORE = {
  name: "Casa Fácil",                    // nome da loja
  email: "contato@casafacil.com",
  phone: "(21) 998545120",
  whatsapp: "(21) 998545120",
  hours: "Seg a Sex: 9h às 18h",
  company: "RCS Sports Management & Solutions LTDA",
  cnpj: "64.657.491/0001-20",
  address: "Rua Aylton Vasconcelos, 270 - Apt 202, Jardim Guanabara, Rio de Janeiro - RJ",

  product: {
    title: "[PAGUE 1 LEVE 2] Armário de Aço Multifuncional com Rodinhas — Organizador Resistente para Cozinha, Banheiro e Lavanderia",
    shortTitle: "[PAGUE 1 LEVE 2] Armário de Aço Multifuncional com Rodinhas",
    price: 7790,          // preço de cada "kit" em centavos (R$ 77,90)
    comparePrice: 19890,  // preço "de" em centavos (só use se for um preço real praticado)
    installments: 6,
  },

  // Fim da promoção (cronômetro da faixa laranja), com fuso do Brasil. Ex.: "2026-11-30T23:59:59-03:00".
  // Vazio = o cronômetro conta até o fim do dia de hoje.
  promoEndsAt: "",

  // Valor máximo por pedido (centavos). Acima disso o checkout pede para remover algum item.
  maxOrderCents: 25000,

  // Opções de envio no checkout (preço em centavos). A 1ª da lista vem marcada.
  //  eta     = texto fixo do prazo
  //  etaDays = prazo em DIAS CORRIDOS a partir de hoje, mostrado como data ("Receba entre 24 e 26 de novembro")
  shipping: [
    { id: "jadlog", name: "Frete JadLog", eta: "5 a 8 dias úteis", price: 0 },
    { id: "correios", name: "Frete Correios", etaDays: { min: 2, max: 4 }, price: 853 },
    { id: "completo", name: "Frete Full", eta: "Receba amanhã", price: 2353 },
  ],

  // Produtos extras opcionais no checkout ("Leve junto"). Deixe [] para desativar.
  bumps: [
    { id: "panelas", name: "Conjunto de Panelas LIFE SMILE 29 Peças Granito Antiaderente", price: 4890, image: "/assets/bump-panelas.jpg" },
    { id: "potes", name: "Potes Plásticos Organizadores 16 Peças Herméticos Cozinha", price: 2187, image: "/assets/bump-potes.jpg" },
    { id: "turbochef", name: "Kit Panela Pressão TurboChef (2 Panelas de 6L)", price: 4489, image: "/assets/bump-turbochef.jpg" },
  ],

  // Oferta exibida DEPOIS do pagamento (página /upsell). Pix novo gerado com 1 clique.
  upsell: { name: "Kit Cozinha Completa (3 produtos)", price: 5990, image: "/assets/upsell-kit.jpg", items: ["panelas", "potes", "turbochef"] },

  // Integração de pagamento Pix (SEU backend/gateway). Veja o README.
  // POST  PIX_ENDPOINT            -> { success:true, data:{ pixCode, externalRef, chargeId, expiresAt } }
  // GET   PIX_STATUS_ENDPOINT?id=&ref= -> { paid: true|false, status }
  PIX_ENDPOINT: "/api/create-pix",
  PIX_STATUS_ENDPOINT: "/api/pix-status",
};
