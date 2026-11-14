"""Salva nel blocco HISTORY della dashboard il prezzo più basso di oggi di ogni orologio.

Uso: python3 -I scripts/storico.py top10-orologi-tondi-confronto-foto.html [AAAA-MM-GG]
Conta solo le offerte con `fresh: true` e non scadute (`until`). Se la data c'è già, la sovrascrive.
Prova: python3 -I scripts/storico.py --test
"""
import datetime
import re
import sys


def lowest(block, day):
    prices = []
    for o in re.findall(r"\{ store: [^\n]*\}", block):
        if "fresh: true" not in o:
            continue
        until = re.search(r'until: "(\d{4}-\d{2}-\d{2})"', o)
        if until and until.group(1) < day:
            continue
        prices.append(float(re.search(r"price: ([0-9.]+)", o).group(1)))
    return min(prices) if prices else None


def update(s, day):
    start = s.index("  var W = [")
    end = s.index("\n  ];\n", start)
    blocks = re.split(r'\n      id: "', s[start:end])[1:]
    hist = {}
    m = re.search(r"  var HISTORY = \{\n(.*?)\n  \};\n", s, re.S)
    for k, rows in re.findall(r"^    (\w+): \[(.*)\],?$", m.group(1) if m else "", re.M):
        hist[k] = [(d, float(p)) for d, p in re.findall(r'\["([\d-]+)", ([0-9.]+)\]', rows)]
    for b in blocks:
        id_ = b[: b.index('"')]
        p = lowest(b, day)
        rows = [r for r in hist.get(id_, []) if r[0] != day]
        if p is not None:
            rows.append((day, p))
        hist[id_] = sorted(rows)
    body = ",\n".join(
        "    %s: [%s]" % (k, ", ".join('["%s", %.2f]' % r for r in v)) for k, v in hist.items()
    )
    block = "  var HISTORY = {\n" + body + "\n  };\n"
    if m:
        return s[: m.start()] + block + s[m.end():]
    anchor = "  // Da cambiare a ogni aggiornamento dei dati."
    return s.replace(anchor, "  // Prezzo più basso verificato per giorno (scripts/storico.py).\n" + block + "\n" + anchor, 1)


if sys.argv[1:] == ["--test"]:
    W = '''  var W = [
    {
      id: "a", rank: 1,
      offers: [
        { store: "X", price: 90.00, fresh: true, url: "u", note: "n" },
        { store: "Y", price: 70.00, fresh: false, url: "u", note: "n" },
        { store: "Z", price: 50.00, fresh: true, url: "u", note: "n", flash: "BF", until: "2026-11-01" }
      ]
    },
    {
      id: "b", rank: 2,
      offers: [
        { store: "X", price: 10.00, fresh: false, url: "u", note: "n" }
      ]
    }
  ];
  // Da cambiare a ogni aggiornamento dei dati.
'''
    s = update(W, "2026-11-03")
    assert '    a: [["2026-11-03", 90.00]]' in s and "    b: []" in s, s
    s = update(s.replace("price: 90.00", "price: 85.00"), "2026-11-04")
    assert '    a: [["2026-11-03", 90.00], ["2026-11-04", 85.00]]' in s, s
    assert update(s, "2026-11-04") == s
    print("ok")
    sys.exit()

F = sys.argv[1]
day = sys.argv[2] if len(sys.argv) > 2 else datetime.date.today().isoformat()
s = open(F, encoding="utf-8").read()
open(F, "w", encoding="utf-8").write(update(s, day))
