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
    title: "[PAGUE 1 LEVE 2] Armário de Aço Multifuncional — Organizador Resistente para Cozinha, Banheiro e Lavanderia",
    shortTitle: "[PAGUE 1 LEVE 2] Armário de Aço Multifuncional",
    price: 7790,          // preço de cada "kit" em centavos (R$ 77,90)
    comparePrice: 19890,  // preço "de" em centavos (só use se for um preço real praticado)
    installments: 6,
  },

  // Opções de envio (centavos)
  shipping: [
    { id: "correios", name: "Frete Correios", eta: "7 a 15 dias úteis", price: 0 },
    { id: "jadlog", name: "Frete JadLog", eta: "3 a 6 dias úteis", price: 853 },
    { id: "completo", name: "Frete Completo", eta: "1 a 3 dias úteis", price: 1473 },
  ],

  // Produtos extras opcionais no checkout ("Leve junto"). Deixe [] para desativar.
  bumps: [
    { id: "panelas", name: "Conjunto de Panelas LIFE SMILE 29 Peças Granito Antiaderente", price: 4890, image: "/assets/bump-panelas.jpg" },
    { id: "potes", name: "Potes Plásticos Organizadores 16 Peças Herméticos Cozinha", price: 2187, image: "/assets/bump-potes.jpg" },
    { id: "turbochef", name: "Kit Panela Pressão TurboChef (2 Panelas de 6L)", price: 4489, image: "/assets/bump-turbochef.jpg" },
  ],

  // Integração de pagamento Pix (SEU backend/gateway). Veja o README.
  // POST  PIX_ENDPOINT            -> { success:true, data:{ pixCode, qrCodeImage?, externalRef } }
  // GET   PIX_STATUS_ENDPOINT?ref=-> { paid: true|false }
  PIX_ENDPOINT: "/api/create-pix",
  PIX_STATUS_ENDPOINT: "/api/pix-status",
};
