import { pingu } from "../../../lib-pingupag";

export const dynamic = "force-dynamic";

// Diagnóstico: mostra O QUE a PinguPag guardou de um pedido (sem expor dados pessoais: só se o campo chegou e uma versão mascarada).
// Uso: /api/debug-pix?ref=ARM-1234567890123-ABCD1234   (a referência aparece na tela do Pix e no painel da PinguPag)
const mask = (v) => {
  const s = String(v ?? "");
  if (!s) return null;
  return s.length <= 3 ? "***" : s.slice(0, 2) + "*".repeat(Math.min(s.length - 3, 8)) + s.slice(-1);
};

export async function GET(req) {
  const ref = new URL(req.url).searchParams.get("ref") || "";
  if (!/^ARM-[0-9]+-[A-Z0-9]+$/.test(ref)) return Response.json({ error: "informe ?ref=ARM-..." }, { status: 400 });
  try {
    const list = await pingu(`/gateway/v1/query?action=list_transactions&external_id=${encodeURIComponent(ref)}`);
    const tx = list.ok && Array.isArray(list.json) ? list.json[0] : null;
    if (!tx) return Response.json({ encontrado: false, resposta_pingupag: list.status });
    const out = { encontrado: true, status: tx.status, valor_centavos: tx.amount, criado_em: tx.created_at, campos_da_lista: Object.keys(tx) };
    const det = await pingu(`/gateway/v1/query?action=get_transaction&id=${encodeURIComponent(tx.id)}`);
    const cd = det.ok && det.json ? det.json.customer_data : null;
    if (cd && typeof cd === "object") {
      const c = cd.customer || {};
      out.o_que_a_pingupag_guardou = {
        produto_descricao: cd.description ?? null,
        origem_source: cd.source ?? null,
        cliente: {
          nome: mask(c.name), email: mask(c.email),
          telefone: c.phone ? `${String(c.phone).length} dígitos` : null,
          documento: c.document ? `${String(c.document).length} dígitos` : null,
          tem_endereco_dentro_do_cliente: !!c.address,
        },
        tem_endereco_na_raiz: !!cd.address,
        tracking_campos: Object.keys(cd.tracking || {}),
        campos_na_raiz: Object.keys(cd),
      };
    } else {
      out.o_que_a_pingupag_guardou = "a consulta não devolveu customer_data";
      out.resposta_detalhe = { http: det.status, campos: det.json ? Object.keys(det.json) : null };
    }
    return Response.json(out);
  } catch (e) {
    return Response.json({ erro: String(e.message || e) }, { status: 500 });
  }
}
