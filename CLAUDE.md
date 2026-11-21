# Le mie ricerche prodotti

L'utente è italiano: rispondi in italiano. Per ogni ricerca c'è una cartella con i 10 migliori prodotti per lui,
confrontando i prezzi di Amazon, Unieuro, MediaWorld ed Euronics.

## Struttura

- `index.html`: apre la prima ricerca. Le ricerche si cambiano dalle schede in cima a ogni pagina (elenco `CATS` in `shared/dashboard.js`).
- `shared/dashboard.css`, `shared/dashboard.js`: grafica e codice comuni a tutte le pagine. Non mettere dati qui.
- `<categoria>/index.html`: solo testi della pagina (header e footer) e dati: `CONFIG`, `W`, `GALLERY`, `HISTORY`, `UPDATED`.
- `<categoria>/BRIEF.md`: per chi è la ricerca, budget, criteri di scelta, cosa controllare sui modelli. **Leggilo prima di toccare la categoria.**
- `scripts/gallerie.py`, `scripts/storico.py`: lavorano su qualsiasi `<categoria>/index.html` passato come argomento.

Categorie: `orologi/`, `asciugatrici/`, `robot-lavapavimenti/`.

Formato di un prodotto in `W` (mantieni l'ordine `id, photo, photoSrc` all'inizio: lo usa `gallerie.py`;
`id` solo lettere minuscole e cifre, senza trattini, perché diventa una chiave di `GALLERY` e `HISTORY`):
`{ id, photo, photoSrc, rank, name, brand, year, month, short: {<chiavi di CONFIG.columns>}, specs: [[etichetta, valore], ...], verdict, pros, cons, offers: [...] }`.
Ogni offerta: `{ store, price, fresh, url, note }` più, se a tempo, `flash` e `until`.

Per vedere le pagine nel browser integrato avvia il server `ricerche` di `.claude/launch.json` (http://localhost:8791):
aperte come file, nel browser integrato non caricano `shared/`.

## Quando l'utente chiede "aggiorna i dati" di una categoria

1. **Brief.** Leggi `<categoria>/BRIEF.md`.
2. **Ricerca.** Cerca sul web (WebSearch, modalità extended per i prezzi) prodotti nuovi o in offerta adatti al brief,
   e il prezzo di oggi di ognuno dei 10 attuali sui quattro negozi.
3. **Prezzi.** Aggiorna `offers`. `fresh: true` solo se il prezzo l'hai letto oggi **sulla pagina prodotto del negozio**,
   e `url` deve essere quella pagina (mai articoli, confronti prezzi tipo prezzi.tech o pagine di ricerca). Altrimenti `fresh: false` e spiega nella `note` da dove viene.
   Come leggerli:
   - Unieuro: `curl` della pagina, primo `"price":{...,"value":N}` e `stockLevelStatus`.
   - MediaWorld: `curl` della ricerca `/it/search.html?query=...` per i link, poi nella pagina il primo `"@type":"Offer"` con `price`.
   - Euronics: la ricerca è bloccata da Cloudflare; trova la pagina prodotto con WebSearch (`allowed_domains: euronics.it`) e leggi `"price":"N"` con `curl`.
   - Amazon: blocca `curl`; usa il browser integrato su amazon.it e leggi i risultati di `/s?k=...`; link `https://www.amazon.it/dp/<ASIN>`.
     **Controlla sempre il modello**: la ricerca mescola modelli simili (versioni, misure, codici modello quasi uguali).
     Apri la pagina `/dp/<ASIN>` e verifica nel titolo e nei punti elenco nome, codice modello, misura/capacità e versione
     (gli esempi tipici di ogni categoria sono nel suo BRIEF). Scarta versioni d'importazione (es. "Turkey Guaranteed")
     e offerte "Seconda mano". Prendi il prezzo dal riquadro di acquisto (`#corePrice_feature_div`) e scrivi nella nota chi lo vende (Amazon o venditore terzo).
   Nella nota indica il colore se il prezzo vale solo per quel colore. Mai inventare prezzi o caratteristiche: se non lo trovi, "n.d.".
4. **Sostituzioni.** Sostituisci un prodotto solo se ne trovi uno chiaramente migliore secondo il brief. Togli quello meno adatto,
   tienine sempre 10 e ricalcola `rank` (1 = più adatto). Per un prodotto nuovo servono `year` e `month` (1–12) del lancio, verificati sul web,
   e se c'è la pagina Unieuro: `photoSrc` è la pagina, `photo` l'immagine `...sgmProductFormat.jpg`.
5. **Offerte lampo / Black Friday.** Un'offerta a tempo è una normale voce di `offers` con in più
   `flash: "Black Friday"` (o "Offerta lampo", "Cyber Monday"…) e, se nota, `until: "AAAA-MM-GG"`.
   Compare nel riquadro ⚡ in alto; dopo la data `until` smette da sola di contare. Togli le offerte scadute.
6. **Foto.** `python3 -I scripts/gallerie.py <categoria>/index.html`.
7. **Storico prezzi.** Dopo aver aggiornato i prezzi: `python3 -I scripts/storico.py <categoria>/index.html`.
   Salva in `HISTORY` il prezzo più basso verificato di oggi (grafico "Andamento del prezzo più basso"). Non modificare `HISTORY` a mano.
8. **Date.** Aggiorna `UPDATED` e la data nel paragrafo "Come leggere i prezzi" del footer.
9. **Controllo.** Apri la pagina dal server locale e verifica che non ci siano errori in console.
   Nelle attività programmate niente browser né server: `python3 -I scripts/controlla.py <categoria>/index.html` (10 prodotti, sintassi JS valida).
10. **Resoconto.** In poche righe: prezzi cambiati, prodotti entrati/usciti e perché, offerte lampo trovate.

## Nuova categoria

Crea `<categoria>/BRIEF.md` e `<categoria>/index.html` copiando la struttura di `orologi/index.html`
(header, `<main id="app">`, footer, script dati, `../shared/dashboard.js`),
imposta `CONFIG` (vedi il commento in cima a `shared/dashboard.js`), aggiungi la categoria a `CATS` in `shared/dashboard.js`
e un'attività programmata come quella degli orologi.
