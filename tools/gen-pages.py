#!/usr/bin/env python3
"""Gera as páginas legais (termos, privacidade, trocas, envio) a partir dos textos em tools/legal/*.txt"""
import re, html, pathlib, sys
root = pathlib.Path(__file__).resolve().parent.parent
pages = {"termos-de-uso": "Termos de Uso", "politica-de-privacidade": "Política de Privacidade",
         "trocas-e-devolucoes": "Política de Trocas e Devoluções", "politica-envio": "Política de Envio"}
def sub(t):
    t = html.escape(t)
    for a, b in [("contato@casafacil.com", "{{email}}"), ("RCS Sports Management &amp; Solutions LTDA", "{{company}}"), ("64.657.491/0001-20", "{{cnpj}}")]:
        t = t.replace(a, b)
    return re.sub(r"\{\{(\w+)\}\}", r'<span data-store="\1"></span>', t)
tpl = (root / "tools" / "legal-template.html").read_text()
for slug, title in pages.items():
    txt = (root / "tools" / "legal" / f"{slug}.txt").read_text()
    out = []
    for blk in re.split(r"\n\s*\n", txt.strip()):
        lines = [l.strip() for l in blk.splitlines() if l.strip()]
        if not lines or lines[0] in ("Voltar", title): lines = [l for l in lines if l not in ("Voltar", title)]
        if not lines: continue
        if len(lines) == 1:
            l = lines[0]
            if re.match(r"^\d+\. ", l): out.append(f'<h2 class="font-bold text-base mt-6 mb-2">{sub(l)}</h2>')
            elif l.startswith("Última atualização"): out.append(f'<p class="text-xs text-gray-400 mb-4">{sub(l)}</p>')
            else: out.append(f'<p class="text-sm text-gray-600 leading-relaxed mb-3">{sub(l)}</p>')
        else:
            if lines[0].startswith("E-mail") or lines[0].startswith("CNPJ"):
                out.append('<p class="text-sm text-gray-600 leading-relaxed mb-3">' + "<br/>".join(sub(l) for l in lines) + "</p>")
            else:
                out.append('<ul class="list-disc pl-5 text-sm text-gray-600 space-y-1 mb-3">' + "".join(f"<li>{sub(l)}</li>" for l in lines) + "</ul>")
    (root / f"{slug}.html").write_text(tpl.replace("{{TITLE}}", title).replace("{{BODY}}", "\n".join(out)))
print("ok")
