import fs from "fs";
import path from "path";

export const PAGES = ["checkout", "pix", "obrigado", "contato", "termos-de-uso", "politica-de-privacidade", "trocas-e-devolucoes", "politica-envio"];

// Lê o HTML da loja (em /public) e devolve como página completa.
export function htmlResponse(name) {
  const file = path.join(process.cwd(), "public", `${name}.html`);
  if (!fs.existsSync(file)) return new Response("Página não encontrada", { status: 404 });
  return new Response(fs.readFileSync(file, "utf8"), { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
