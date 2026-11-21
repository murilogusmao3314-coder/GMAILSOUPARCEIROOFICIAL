export const dynamic = "force-dynamic";

// Devolve a cidade/UF aproximadas do visitante, a partir dos cabeçalhos de geolocalização da própria Vercel.
// Nada é salvo e nenhum serviço externo é chamado. Fora da Vercel (ou fora do Brasil) devolve { city: null }.
const dec = (v) => { try { return decodeURIComponent(v || "").trim(); } catch { return ""; } };

export async function GET(req) {
  const h = req.headers;
  const country = (h.get("x-vercel-ip-country") || "").toUpperCase();
  const city = dec(h.get("x-vercel-ip-city"));
  const uf = (h.get("x-vercel-ip-country-region") || "").toUpperCase();
  const ok = country === "BR" && city && /^[A-Z]{2}$/.test(uf) && city.length <= 60;
  return Response.json(ok ? { city, uf } : { city: null, uf: null }, { headers: { "Cache-Control": "private, no-store" } });
}
