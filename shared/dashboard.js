// Dashboard condivisa: ogni pagina di categoria definisce prima CONFIG, W, GALLERY, HISTORY e UPDATED.
// CONFIG = {
//   noun: "orologi", one: "un orologio",          // testi
//   budget: 80, filters: [100, 80],               // linea tratteggiata e pulsanti "Sotto N €"
//   columns: [["Cassa", "cassa"], ...],           // colonne della classifica, chiavi di w.short
//   best: { key: "autonomia", higher: true, text: "l’autonomia più lunga" }  // evidenziato nel confronto
// }
(function () {
  var C = CONFIG;
  var TODAY = new Date().toLocaleDateString("sv"); // AAAA-MM-GG, ora locale
  var STORES = ["Amazon", "Unieuro", "MediaWorld", "Euronics"];
  var state = { filter: "all", sort: "rank", sel: W.slice().sort(function (a, b) { return a.rank - b.rank; })[0].id, cmp: [] };

  document.getElementById("app").innerHTML =
    '<section class="flash" id="flash" aria-labelledby="f-title" hidden>' +
    '<h2 id="f-title">⚡ Offerte lampo e Black Friday</h2>' +
    '<p>Prezzi speciali a tempo trovati nell’ultimo aggiornamento. Durano poco: controlla sul negozio prima di comprare.</p>' +
    '<ul id="flash-list"></ul></section>' +
    '<section class="summary" aria-label="Riepilogo">' +
    '<div class="stat"><div class="n" id="s-under">–</div><div class="l">' + C.noun + ' sotto ' + C.budget + ' € (anche solo in offerta)</div></div>' +
    '<div class="stat"><div class="n" id="s-low">–</div><div class="l">prezzo verificato più basso</div></div>' +
    '<div class="stat"><div class="n" id="s-count">–</div><div class="l">' + C.noun + ' nel filtro attuale</div></div></section>' +
    '<section class="controls" aria-label="Filtri">' +
    '<div class="group"><span>Mostra</span><div class="seg" id="seg-filter" role="group" aria-label="Filtro prezzo">' +
    '<button data-v="all" aria-pressed="true">Tutti</button>' +
    C.filters.map(function (f) { return '<button data-v="' + f + '" aria-pressed="false">Sotto ' + f + ' €</button>'; }).join("") +
    '</div></div>' +
    '<div class="group"><span>Ordina per</span><div class="seg" id="seg-sort" role="group" aria-label="Ordinamento">' +
    '<button data-v="rank" aria-pressed="true">Scelta migliore</button><button data-v="price" aria-pressed="false">Prezzo</button></div></div></section>' +
    '<div class="layout"><div>' +
    '<section class="card" aria-labelledby="t-title"><div class="card-head"><h2 id="t-title">Classifica</h2>' +
    '<p>Il prezzo è il più basso verificato tra i quattro negozi.</p></div>' +
    '<div class="tablewrap"><table id="tbl"><thead><tr><th>#</th><th>Modello</th><th>Uscita</th>' +
    C.columns.map(function (c) { return "<th>" + c[0] + "</th>"; }).join("") +
    '<th class="num">Prezzo più basso</th><th>Negozio</th></tr></thead><tbody id="tbody"></tbody></table>' +
    '<div id="empty" class="empty" hidden>Nessun risultato con questo filtro. Prova “Tutti”.</div></div></section>' +
    '<section class="card" style="margin-top:18px" aria-labelledby="c-title"><div class="card-head"><h2 id="c-title">Prezzi a confronto</h2>' +
    '<p>La linea tratteggiata segna i ' + C.budget + ' €. Clicca una barra per aprire il dettaglio.</p></div>' +
    '<div class="chart" id="chart"></div></section></div>' +
    '<aside class="card detail" id="detail" aria-live="polite" aria-label="Dettaglio"></aside></div>' +
    '<section class="card cmpcard" aria-labelledby="cmp-title"><div class="card-head"><h2 id="cmp-title">Confronto</h2>' +
    '<p>Spunta “Confronta” su due o più modelli nella classifica (massimo 4). In verde il prezzo più basso e ' + C.best.text + ' tra quelli scelti.</p></div>' +
    '<div class="cmpbar"><button type="button" class="clear" id="cmp-clear">Svuota la selezione</button><span class="store" id="cmp-count"></span></div>' +
    '<div class="cmpwrap" id="cmp"></div></section>';

  // Schede in cima a ogni ricerca: per una nuova categoria aggiungi qui [cartella, etichetta].
  var CATS = [["orologi", "Smartwatch tondi"], ["asciugatrici", "Asciugatrici"], ["robot-lavapavimenti", "Robot lavapavimenti"], ["orologi-donna", "Orologi dorati ragazza"]];
  var nav = document.createElement("nav");
  nav.className = "tabs"; nav.setAttribute("aria-label", "Ricerche");
  CATS.forEach(function (c) {
    var a = document.createElement("a");
    a.href = "../" + c[0] + "/index.html"; a.textContent = c[1];
    if (location.pathname.indexOf("/" + c[0] + "/") >= 0) a.setAttribute("aria-current", "page");
    nav.appendChild(a);
  });
  document.querySelector(".wrap").prepend(nav);

  // Zoom che segue il mouse dentro un riquadro (solo con mouse: su touch non c'è hover).
  var canHover = window.matchMedia("(hover: hover)").matches;
  function panZoom(box, img, e) {
    if (!canHover) return;
    var r = box.getBoundingClientRect();
    img.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + "% " + ((e.clientY - r.top) / r.height * 100) + "%";
    box.classList.add("zooming");
  }
  function thumb(src, i, name, onPick) {
    var t = el("button", "thumb");
    t.type = "button";
    t.setAttribute("aria-label", "Foto " + (i + 1));
    var ti = document.createElement("img");
    ti.src = src; ti.alt = ""; ti.loading = "lazy"; ti.referrerPolicy = "no-referrer";
    t.appendChild(ti);
    t.addEventListener("mouseenter", function () { if (canHover) onPick(i); });
    t.addEventListener("click", function () { onPick(i); });
    return t;
  }

  // Visualizzazione espansa stile Amazon: foto grande a sinistra, miniature a destra, clic sulla foto per lo zoom.
  var viewer = document.createElement("dialog");
  viewer.className = "viewer";
  viewer.setAttribute("aria-label", "Visualizzazione espansa delle foto");
  viewer.innerHTML = '<div class="vhead"><strong class="vtitle"></strong><span class="store vcnt"></span>' +
    '<button type="button" class="vclose" data-close aria-label="Chiudi">✕</button></div>' +
    '<div class="vbody"><div class="vstage" title="Clicca per ingrandire"><img alt=""></div><div class="vthumbs"></div></div>';
  document.body.appendChild(viewer);
  var vStage = viewer.querySelector(".vstage"), vImg = vStage.querySelector("img"), vThumbs = viewer.querySelector(".vthumbs");
  var vState = { pics: [], i: 0, name: "" };
  function viewerSet(i) {
    var n = vState.pics.length;
    vState.i = (i + n) % n;
    vStage.classList.remove("zoomed");
    vImg.src = vState.pics[vState.i];
    vImg.alt = vState.name + ", foto " + (vState.i + 1) + " di " + n;
    viewer.querySelector(".vcnt").textContent = n > 1 ? "Foto " + (vState.i + 1) + " di " + n : "";
    Array.prototype.forEach.call(vThumbs.children, function (t, j) { t.classList.toggle("on", j === vState.i); });
  }
  function openViewer(pics, i, name) {
    vState = { pics: pics, i: i, name: name };
    viewer.querySelector(".vtitle").textContent = name;
    vThumbs.textContent = "";
    vThumbs.hidden = pics.length < 2;
    pics.forEach(function (src, j) { vThumbs.appendChild(thumb(src, j, name, viewerSet)); });
    viewerSet(i);
    viewer.showModal();
  }
  vStage.addEventListener("click", function (e) {
    var r = vStage.getBoundingClientRect();
    vImg.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + "% " + ((e.clientY - r.top) / r.height * 100) + "%";
    vStage.classList.toggle("zoomed");
  });
  vStage.addEventListener("mousemove", function (e) {
    if (!vStage.classList.contains("zoomed")) return;
    var r = vStage.getBoundingClientRect();
    vImg.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + "% " + ((e.clientY - r.top) / r.height * 100) + "%";
  });
  viewer.addEventListener("click", function (e) {
    if (e.target === viewer || e.target.closest("[data-close]")) viewer.close();
  });
  viewer.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") viewerSet(vState.i - 1);
    if (e.key === "ArrowRight") viewerSet(vState.i + 1);
  });

  var tbtn = document.createElement("button");
  tbtn.type = "button"; tbtn.className = "clear theme"; tbtn.id = "theme";
  document.querySelector("header").prepend(tbtn);

  function uscita(w, fmt) {
    if (!w.year) return "n.d.";
    if (!w.month) return String(w.year);
    return new Date(w.year, w.month - 1, 1).toLocaleDateString("it-IT", { month: fmt, year: "numeric" });
  }
  function eur(n) { return n.toLocaleString("it-IT", { style: "currency", currency: "EUR" }); }

  function live(o) { return o.fresh && !(o.until && o.until < TODAY); }
  function best(w) {
    var f = w.offers.filter(live);
    if (!f.length) f = w.offers.slice();
    return f.reduce(function (a, b) { return b.price < a.price ? b : a; });
  }
  function lowestAny(w) {
    return w.offers.reduce(function (a, b) { return b.price < a.price ? b : a; });
  }
  function staleLower(w) {
    var b = best(w);
    var s = w.offers.filter(function (o) { return !live(o) && o.price < b.price; });
    if (!s.length) return null;
    return s.reduce(function (a, c) { return c.price < a.price ? c : a; });
  }

  function visible() {
    var list = W.slice();
    if (state.filter !== "all") list = list.filter(function (w) { return lowestAny(w).price < Number(state.filter); });
    if (state.sort === "price") list.sort(function (a, b) { return best(a).price - best(b).price; });
    else list.sort(function (a, b) { return a.rank - b.rank; });
    return list;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function renderSummary() {
    var under = W.filter(function (w) { return lowestAny(w).price < C.budget; }).length;
    var low = Math.min.apply(null, W.map(function (w) { return best(w).price; }));
    document.getElementById("s-under").textContent = String(under);
    document.getElementById("s-low").textContent = eur(low);
    document.getElementById("s-count").textContent = String(visible().length) + " su " + W.length;
  }

  function renderTable() {
    var tb = document.getElementById("tbody");
    tb.textContent = "";
    var list = visible();
    document.getElementById("empty").hidden = list.length > 0;
    list.forEach(function (w) {
      var b = best(w);
      var tr = document.createElement("tr");
      tr.tabIndex = 0;
      tr.setAttribute("aria-selected", w.id === state.sel ? "true" : "false");
      tr.dataset.id = w.id;

      tr.appendChild(el("td", "rank", String(w.rank)));
      var tdn = el("td");
      tdn.appendChild(el("div", "wname", w.name));
      tdn.appendChild(el("div", "wsub", w.brand));
      var lb = el("label", "cb");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = state.cmp.indexOf(w.id) >= 0;
      cb.addEventListener("change", function () {
        var i = state.cmp.indexOf(w.id);
        if (cb.checked && i < 0) {
          if (state.cmp.length >= 4) { cb.checked = false; return; }
          state.cmp.push(w.id);
        } else if (!cb.checked && i >= 0) state.cmp.splice(i, 1);
        renderCompare();
      });
      lb.addEventListener("click", function (e) { e.stopPropagation(); });
      lb.appendChild(cb);
      lb.appendChild(document.createTextNode("Confronta"));
      tdn.appendChild(lb);
      tr.appendChild(tdn);
      tr.appendChild(el("td", "", uscita(w, "short")));
      C.columns.forEach(function (c) { tr.appendChild(el("td", "", w.short[c[1]])); });
      var tdp = el("td", "num");
      tdp.appendChild(el("div", "price" + (b.price < C.budget ? " under" : ""), eur(b.price)));
      var sl = staleLower(w);
      if (sl) tdp.appendChild(el("span", "tag", "visto a " + eur(sl.price)));
      if (b.flash) tdp.appendChild(el("span", "flashtag", "⚡ " + b.flash));
      if (!live(b)) tdp.appendChild(el("span", "tag", "non in vendita oggi"));
      tr.appendChild(tdp);
      tr.appendChild(el("td", "store", b.store));

      tr.addEventListener("click", function () { select(w.id); });
      tr.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(w.id); }
      });
      tb.appendChild(tr);
    });
  }

  // Tacche "tonde" dell'asse: passo 1/2/5 × 10^n, circa 4 tacche fino al prezzo massimo.
  function ticks(max) {
    var raw = max / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var step = [1, 2, 5, 10].map(function (m) { return m * mag; }).filter(function (s) { return s >= raw; })[0];
    var out = [];
    for (var v = 0; v <= max; v += step) out.push(v);
    return out;
  }

  function renderChart() {
    var box = document.getElementById("chart");
    box.textContent = "";
    var list = visible().slice().sort(function (a, b) { return best(a).price - best(b).price; });
    if (!list.length) { box.appendChild(el("div", "empty", "Nessun dato da mostrare.")); return; }
    var max = Math.max(C.budget, best(list[list.length - 1]).price) * 1.08;
    var area = el("div", "trackarea");
    area.style.setProperty("--refpos", String(C.budget / max));
    list.forEach(function (w) {
      var b = best(w);
      var row = el("button", "bar" + (w.id === state.sel ? " sel" : ""));
      row.type = "button";
      row.setAttribute("aria-label", w.name + ", " + eur(b.price) + " su " + b.store);
      row.appendChild(el("span", "nm", w.name));
      var tr = el("span", "track");
      var fill = el("span", "fill");
      fill.style.width = Math.min(100, (b.price / max) * 100) + "%";
      tr.appendChild(fill);
      row.appendChild(tr);
      row.appendChild(el("span", "val", eur(b.price)));
      row.addEventListener("click", function () { select(w.id); });
      area.appendChild(row);
    });
    area.appendChild(el("div", "refline"));
    box.appendChild(area);

    var axis = el("div", "axis");
    ticks(max).forEach(function (v) {
      var m = el("span", "mark", v + " €");
      m.style.left = (v / max * 100) + "%";
      axis.appendChild(m);
    });
    box.appendChild(axis);
  }

  function shortDate(d) {
    return new Date(d + "T00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  }

  function trendBox(w) {
    var h = HISTORY[w.id] || [];
    var box = el("div", "trend");
    box.appendChild(el("h3", "", "Andamento del prezzo più basso"));
    if (h.length < 2) {
      box.appendChild(el("p", "", h.length ? "Un solo giorno registrato (" + shortDate(h[0][0]) + ", " + eur(h[0][1]) + "): il grafico si riempie con gli aggiornamenti giornalieri." : "Nessun prezzo registrato ancora."));
      return box;
    }
    var first = h[0][1], last = h[h.length - 1][1], diff = last - first;
    var p = el("p");
    p.appendChild(document.createTextNode("Dal " + shortDate(h[0][0]) + " a oggi: "));
    p.appendChild(el("span", diff > 0 ? "up" : diff < 0 ? "down" : "", diff === 0 ? "stabile a " + eur(last) : (diff > 0 ? "+" : "−") + eur(Math.abs(diff)) + " (da " + eur(first) + " a " + eur(last) + ")"));
    box.appendChild(p);

    var ns = "http://www.w3.org/2000/svg", W2 = 320, H = 110, L = 52, R = 10, T = 10, B = 22;
    var prices = h.map(function (r) { return r[1]; });
    var lo = Math.min.apply(null, prices), hi = Math.max.apply(null, prices);
    var pad = Math.max(2, (hi - lo) * 0.15); lo -= pad; hi += pad;
    function x(i) { return L + (W2 - L - R) * i / (h.length - 1); }
    function y(v) { return T + (H - T - B) * (hi - v) / (hi - lo); }
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 " + W2 + " " + H);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Prezzo più basso di " + w.name + " giorno per giorno, da " + eur(first) + " a " + eur(last));
    function add(tag, attrs, text) {
      var n = document.createElementNS(ns, tag);
      Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      if (text !== undefined) n.textContent = text;
      svg.appendChild(n); return n;
    }
    [hi - pad, lo + pad].forEach(function (v) {
      add("line", { x1: L, x2: W2 - R, y1: y(v), y2: y(v), stroke: "var(--line)" });
      add("text", { x: L - 6, y: y(v) + 4, "text-anchor": "end", "font-size": 11, fill: "var(--muted)" }, eur(v));
    });
    if (C.budget > lo && C.budget < hi) {
      add("line", { x1: L, x2: W2 - R, y1: y(C.budget), y2: y(C.budget), stroke: "var(--deal)", "stroke-dasharray": "4 3" });
    }
    add("polyline", { points: h.map(function (r, i) { return x(i) + "," + y(r[1]); }).join(" "), fill: "none", stroke: "var(--accent)", "stroke-width": 2.5, "stroke-linejoin": "round" });
    h.forEach(function (r, i) {
      var c = add("circle", { cx: x(i), cy: y(r[1]), r: 3.5, fill: "var(--accent)" });
      var t = document.createElementNS(ns, "title"); t.textContent = shortDate(r[0]) + ": " + eur(r[1]); c.appendChild(t);
    });
    add("text", { x: L, y: H - 4, "font-size": 11, fill: "var(--muted)" }, shortDate(h[0][0]));
    add("text", { x: W2 - R, y: H - 4, "text-anchor": "end", "font-size": 11, fill: "var(--muted)" }, shortDate(h[h.length - 1][0]));
    box.appendChild(svg);
    return box;
  }

  function renderDetail() {
    var w = W.filter(function (x) { return x.id === state.sel; })[0];
    var box = document.getElementById("detail");
    box.textContent = "";
    if (!w) { box.appendChild(el("div", "empty", "Scegli " + C.one + " dalla classifica.")); return; }
    var b = best(w);

    var head = el("div", "dhead");
    var ht = el("div");
    ht.appendChild(el("h2", "", w.name));
    ht.appendChild(el("div", "sub", w.brand + ", uscita " + uscita(w, "long") + ", posizione " + w.rank + " su " + W.length));
    var pr = el("div", "price" + (b.price < C.budget ? " under" : ""), eur(b.price));
    pr.style.marginTop = "4px";
    ht.appendChild(pr);
    ht.appendChild(el("div", "sub", "il più economico: " + b.store));
    head.appendChild(ht);
    box.appendChild(head);

    if (w.photo) {
      var pics = GALLERY[w.id] || [w.photo];
      var pi = 0;
      var fig = el("figure", "photo");
      // Come su Amazon: zoom seguendo il mouse, miniature che cambiano foto al passaggio, clic per la vista espansa.
      var stage = el("button", "stage");
      stage.type = "button";
      stage.setAttribute("aria-label", "Apri la visualizzazione espansa delle foto di " + w.name);
      var im = document.createElement("img");
      im.src = w.photo; im.alt = w.name; im.loading = "lazy"; im.referrerPolicy = "no-referrer";
      im.addEventListener("error", function () { if (pi === 0) fig.replaceWith(el("div", "nophoto", "La foto non si è caricata: aprila dalla pagina del negozio.")); });
      stage.appendChild(im);
      stage.addEventListener("mousemove", function (e) { panZoom(stage, im, e); });
      stage.addEventListener("mouseleave", function () { stage.classList.remove("zooming"); });
      stage.addEventListener("click", function () { stage.classList.remove("zooming"); openViewer(pics, pi, w.name); });
      fig.appendChild(stage);
      if (pics.length > 1) {
        var strip = el("div", "thumbs");
        var set = function (i) {
          pi = i;
          im.src = pics[i];
          im.alt = w.name + ", foto " + (i + 1) + " di " + pics.length;
          Array.prototype.forEach.call(strip.children, function (t, j) { t.classList.toggle("on", j === i); });
        };
        pics.forEach(function (src, i) { strip.appendChild(thumb(src, i, w.name, set)); });
        set(0);
        fig.appendChild(strip);
      }
      var cap = el("figcaption");
      cap.appendChild(el("span", "", "Passa il mouse per ingrandire, clicca per la vista espansa"));
      var la = el("a", "", "Foto: pagina " + (/amazon\./.test(w.photoSrc) ? "Amazon" : "Unieuro"));
      la.href = w.photoSrc; la.target = "_blank"; la.rel = "noopener noreferrer";
      cap.appendChild(la);
      fig.appendChild(cap);
      box.appendChild(fig);
    } else {
      box.appendChild(el("div", "nophoto", "Foto non disponibile: non l’ho trovata su una pagina di negozio verificata."));
    }
    box.appendChild(el("p", "verdict", w.verdict));

    var dl = el("dl", "specs");
    w.specs.forEach(function (p) {
      var d = el("div");
      d.appendChild(el("dt", "", p[0]));
      d.appendChild(el("dd", "", p[1]));
      dl.appendChild(d);
    });
    box.appendChild(dl);

    var pc = el("div", "pc");
    var a = el("div"); a.appendChild(el("h3", "", "Punti a favore"));
    var ul1 = el("ul"); w.pros.forEach(function (t) { ul1.appendChild(el("li", "", t)); }); a.appendChild(ul1);
    var c2 = el("div"); c2.appendChild(el("h3", "", "Da considerare"));
    var ul2 = el("ul"); w.cons.forEach(function (t) { ul2.appendChild(el("li", "", t)); }); c2.appendChild(ul2);
    pc.appendChild(a); pc.appendChild(c2);
    box.appendChild(pc);

    box.appendChild(trendBox(w));

    var of = el("div", "offers");
    of.appendChild(el("h3", "", "Dove comprarlo"));
    var sorted = STORES.map(function (s) {
      var o = w.offers.filter(function (x) { return x.store === s; })[0];
      return { store: s, o: o };
    }).sort(function (x, y) {
      var px = x.o ? x.o.price : 1e9, py = y.o ? y.o.price : 1e9;
      return px - py;
    });
    sorted.forEach(function (r) {
      var isBest = r.o && r.o === b;
      var row = el("div", "offer" + (isBest ? " best" : "") + (r.o && !live(r.o) ? " stale" : "") + (!r.o ? " missing" : ""));
      var left = el("div");
      var sn = el("span", "sn", r.store);
      left.appendChild(sn);
      if (isBest) left.appendChild(el("span", "badge", "Il più economico"));
      if (r.o && r.o.flash && live(r.o)) left.appendChild(el("span", "flashtag", "⚡ " + r.o.flash));
      row.appendChild(left);
      if (r.o) {
        row.appendChild(el("span", "p", eur(r.o.price)));
        var a2 = el("a", "go", "Vai a " + r.store);
        a2.href = r.o.url;
        a2.target = "_blank";
        a2.rel = "noopener noreferrer";
        row.appendChild(a2);
        row.appendChild(el("div", "note", r.o.note));
      } else {
        row.appendChild(el("span", "p", "–"));
        row.appendChild(el("span", "store", "Non trovato"));
        row.appendChild(el("div", "note", "Non ho trovato un prezzo per questo negozio."));
      }
      of.appendChild(row);
    });
    box.appendChild(of);
  }

  function num(t) { var m = /(\d+(?:[.,]\d+)?)/.exec(String(t)); return m ? Number(m[1].replace(",", ".")) : null; }

  function renderCompare() {
    var box = document.getElementById("cmp");
    box.textContent = "";
    var items = state.cmp.map(function (id) { return W.filter(function (x) { return x.id === id; })[0]; }).filter(Boolean);
    document.getElementById("cmp-count").textContent = items.length + " su 4 scelti";
    if (items.length < 2) {
      box.appendChild(el("div", "empty", items.length ? "Scegli almeno un altro modello." : "Nessun modello scelto. Spunta “Confronta” nella classifica."));
      return;
    }
    var minP = Math.min.apply(null, items.map(function (w) { return best(w).price; }));
    var vals = items.map(function (w) { return num(w.short[C.best.key]); }).filter(function (d) { return d !== null; });
    var top = vals.length ? (C.best.higher ? Math.max : Math.min).apply(null, vals) : null;
    var t = el("table", "cmp");
    var thead = el("thead"), hr = el("tr");
    hr.appendChild(el("th", "", ""));
    items.forEach(function (w) {
      var th = el("th");
      if (w.photo) {
        var im = document.createElement("img");
        im.src = w.photo; im.alt = w.name; im.loading = "lazy"; im.referrerPolicy = "no-referrer";
        im.addEventListener("error", function () { im.remove(); });
        th.appendChild(im);
      }
      th.appendChild(document.createTextNode(w.name));
      hr.appendChild(th);
    });
    thead.appendChild(hr); t.appendChild(thead);
    var rows = [
      ["Prezzo più basso", function (w) { return eur(best(w).price); }, function (w) { return best(w).price === minP; }],
      ["Negozio", function (w) { return best(w).store; }],
      ["Posizione", function (w) { return w.rank + " su " + W.length; }],
      ["Uscita", function (w) { return uscita(w, "long"); }]
    ];
    var bestLabel = C.columns.filter(function (c) { return c[1] === C.best.key; })[0][0];
    var isTop = function (w) { return top !== null && num(w.short[C.best.key]) === top; };
    if (!items[0].specs.some(function (s) { return s[0] === bestLabel; })) rows.push([bestLabel, function (w) { return w.short[C.best.key]; }, isTop]);
    items[0].specs.forEach(function (s) {
      rows.push([s[0], function (w) { var f = w.specs.filter(function (x) { return x[0] === s[0]; })[0]; return f ? f[1] : "n.d."; }, s[0] === bestLabel ? isTop : null]);
    });
    rows.push(["In breve", function (w) { return w.verdict; }]);
    var tb = el("tbody");
    rows.forEach(function (r) {
      var tr = el("tr");
      var th = el("th", "", r[0]); th.scope = "row"; tr.appendChild(th);
      items.forEach(function (w) { tr.appendChild(el("td", r[2] && r[2](w) ? "win" : "", r[1](w))); });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    box.appendChild(t);
  }

  function select(id) {
    state.sel = id;
    renderTable(); renderChart(); renderDetail();
    if (window.matchMedia("(max-width: 960px)").matches) {
      document.getElementById("detail").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function wireSeg(id, key) {
    var seg = document.getElementById(id);
    seg.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      state[key] = btn.dataset.v;
      Array.prototype.forEach.call(seg.querySelectorAll("button"), function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      var list = visible();
      if (list.length && !list.some(function (w) { return w.id === state.sel; })) state.sel = list[0].id;
      renderAll();
    });
  }

  function renderFlash() {
    var list = document.getElementById("flash-list");
    list.textContent = "";
    var deals = [];
    W.forEach(function (w) {
      w.offers.forEach(function (o) { if (o.flash && live(o)) deals.push({ w: w, o: o }); });
    });
    deals.sort(function (a, b) { return a.o.price - b.o.price; });
    document.getElementById("flash").hidden = !deals.length;
    deals.forEach(function (d) {
      var li = el("li");
      var nm = el("button", "fw", d.w.name);
      nm.type = "button";
      nm.addEventListener("click", function () { select(d.w.id); document.getElementById("detail").scrollIntoView({ behavior: "smooth", block: "start" }); });
      li.appendChild(nm);
      li.appendChild(el("span", "flashtag", "⚡ " + d.o.flash));
      li.appendChild(el("span", "p", eur(d.o.price)));
      li.appendChild(el("span", "store", d.o.store + (d.o.until ? ", fino al " + new Date(d.o.until + "T00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long" }) : "")));
      var a = el("a", "go", "Vai a " + d.o.store);
      a.href = d.o.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  function renderAll() { renderFlash(); renderSummary(); renderTable(); renderChart(); renderDetail(); renderCompare(); }

  document.getElementById("cmp-clear").addEventListener("click", function () { state.cmp = []; renderAll(); });
  document.getElementById("updated").textContent = UPDATED;

  var root = document.documentElement;
  function isDark() {
    return root.dataset.theme ? root.dataset.theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function paintTheme() { tbtn.textContent = isDark() ? "☀️ Tema chiaro" : "🌙 Tema scuro"; }
  try { var saved = localStorage.getItem("tema"); if (saved) root.dataset.theme = saved; } catch (e) {}
  paintTheme();
  tbtn.addEventListener("click", function () {
    root.dataset.theme = isDark() ? "light" : "dark";
    try { localStorage.setItem("tema", root.dataset.theme); } catch (e) {}
    paintTheme();
  });
  wireSeg("seg-filter", "filter");
  wireSeg("seg-sort", "sort");
  renderAll();
})();
