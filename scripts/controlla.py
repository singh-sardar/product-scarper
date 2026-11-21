"""Controllo senza browser: python3 -I scripts/controlla.py <categoria>/index.html"""
import re, shutil, subprocess, sys, tempfile, os
s = open(sys.argv[1], encoding="utf-8").read()
data = [b for b in re.findall(r"<script>(.*?)</script>", s, re.S) if "var W" in b]
assert len(data) == 1, "blocco dati non trovato"
ids = re.findall(r'\bid: "([a-z0-9]+)",', data[0])
assert len(ids) == 10, f"servono 10 prodotti, trovati {len(ids)}"
assert len(set(ids)) == 10, "id duplicati"
node = shutil.which("node")
if node:
    f = tempfile.NamedTemporaryFile("w", suffix=".js", delete=False); f.write(data[0]); f.close()
    r = subprocess.run([node, "--check", f.name], capture_output=True, text=True); os.unlink(f.name)
    assert r.returncode == 0, "sintassi JS non valida:\n" + r.stderr
print("ok: 10 prodotti" + (", sintassi JS valida" if node else " (node non trovato: sintassi non controllata)"))
