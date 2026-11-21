// ======= CONFIGURAÇÃO DA LOJA — edite aqui =======
window.STORE = {
  name: "Sua Loja",                    // nome da loja
  email: "contato@sualoja.com.br",
  phone: "(00) 00000-0000",
  whatsapp: "(00) 00000-0000",
  hours: "Seg a Sex: 9h às 18h",
  company: "RAZÃO SOCIAL DA SUA EMPRESA LTDA",
  cnpj: "00.000.000/0000-00",
  address: "Rua Exemplo, 000 - Bairro - Cidade/UF",

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
    { id: "panelas", name: "Conjunto de Panelas LIFE SMILE 29 Peças Granito Antiaderente", price: 4890, image: "assets/bump-panelas.jpg" },
    { id: "potes", name: "Potes Plásticos Organizadores 16 Peças Herméticos Cozinha", price: 2187, image: "assets/bump-potes.jpg" },
    { id: "turbochef", name: "Kit Panela Pressão TurboChef (2 Panelas de 6L)", price: 4489, image: "assets/bump-turbochef.jpg" },
  ],

  // Integração de pagamento Pix (SEU backend/gateway). Veja o README.
  // POST  PIX_ENDPOINT            -> { success:true, data:{ pixCode, qrCodeImage?, externalRef } }
  // GET   PIX_STATUS_ENDPOINT?ref=-> { paid: true|false }
  PIX_ENDPOINT: "",
  PIX_STATUS_ENDPOINT: "",
};
