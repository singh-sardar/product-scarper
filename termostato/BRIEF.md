# Termostato smart per caldaia a gas

- **Per chi:** casa dell'utente, caldaia a gas. Serve per comandare la caldaia dall'app.
- **Cosa:** i 10 migliori **termostati WiFi con schermo touch e alimentati a corrente** (230 V / 95-240 V), non a batteria.
- **Budget:** intorno ai **30 €** (`CONFIG.budget`), filtri "Sotto 45 €" e "Sotto 30 €". Con touch + corrente i modelli seri costano 36-45 €: sotto i 30 € ci sono quasi solo modelli a batteria/USB (da escludere). Meno costa meglio è: tieni in lista anche alternative più economiche anche se non rispettano tutto (es. tasti fisici invece del touch, o senza WiFi), ma dichiaralo chiaramente in specifiche, pro e contro e verdetto. Attenzione: molte schede economiche scrivono “touchscreen” nel titolo ma la foto mostra tasti fisici: controlla sempre la foto.
- **Criteri:** 1) touch (se la scheda non dice touch, scrivilo: "tasti"); 2) alimentazione 230 V, **non** batterie/USB; 3) uscita a contatto pulito per caldaia a gas; 4) prezzo vicino ai 30 €; 5) recensioni buone e numerose; 6) app/voce (Tuya, Meross, Alexa, Google).
- **Escludi:** modelli a batteria o USB, "2 fili", Zigbee/Matter-only senza WiFi, termostati solo per pavimento elettrico (16 A), teste termostatiche.
- **Negozi:** `CONFIG.stores = "any"`: finora si trovano solo su Amazon; Unieuro/MediaWorld/Euronics non vendono questi modelli. Se trovi altri negozi online seri con la pagina prodotto leggibile, aggiungili.
- **Colonne:** Comandi, Valutazione. Nel confronto vince la valutazione più alta.
- **Occhio su Amazon:** stesso prodotto con titoli e colori diversi (bianco/nero), venditori terzi (Beok, Toolfine, ecc.), prezzi che cambiano molto da un giorno all'altro. Leggi `#corePrice_feature_div`, verifica venditore e disponibilità (`#availability`), e se non c'è disponibilità metti `fresh: false`.
