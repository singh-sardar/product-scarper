"""Rigenera il blocco GALLERY della dashboard leggendo la galleria di ogni pagina Unieuro.

Uso: python3 -I scripts/gallerie.py top10-orologi-tondi-confronto-foto.html
Prende ogni orologio con `photo` e `photoSrc` (pagina Unieuro) e riscrive il file sul posto.
"""
import json
import re
import subprocess
import sys

F = sys.argv[1]
s = open(F, encoding="utf-8").read()

out = {}
for id_, main, src in re.findall(r'id: "([a-z0-9]+)", photo: "([^"]+)", photoSrc: "([^"]+)"', s):
    page = subprocess.run(["curl", "-sL", "-A", "Mozilla/5.0 (Macintosh) Chrome/130", src],
                          capture_output=True, text=True, errors="ignore").stdout
    m = re.search(r'"images":', page)
    if not m:
        # es. Amazon, che blocca curl: tengo la galleria già presente nel file
        old = re.search(r"\n    %s: \[\n(.*?)\n    \]" % id_, s, re.S)
        if old:
            out[id_] = re.findall(r'"([^"]+)"', old.group(1))
        print(id_, "galleria non letta, tengo quella già presente", file=sys.stderr)
        continue
    arr, _ = json.JSONDecoder().raw_decode(page[m.end():])
    urls = []
    for x in arr:
        u = "https://www.unieuro.it" + x.get("url", "")
        if x.get("format") == "product" and u not in urls:
            urls.append(u)
    if main in urls:
        urls.remove(main)
    out[id_] = [main] + urls
    print(id_, len(out[id_]), "foto", file=sys.stderr)

body = ",\n".join("    %s: [\n%s\n    ]" % (k, ",\n".join('      "%s"' % u for u in v)) for k, v in out.items())
new, n = re.subn(r"  var GALLERY = \{.*?\n  \};\n", lambda _: "  var GALLERY = {\n" + body + "\n  };\n", s, flags=re.S)
assert n == 1, "blocco GALLERY non trovato"
open(F, "w", encoding="utf-8").write(new)
