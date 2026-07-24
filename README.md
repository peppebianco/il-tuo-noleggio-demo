# Il Tuo Noleggio — Demo Gestionale

Demo interattiva (dati fittizi) di un gestionale per il noleggio di auto e scooter: pianificazione flotta, logistica, prenotazioni, inventario, voucher, analytics, clienti, partner, recensioni e chat.

È un'applicazione **statica** (HTML/CSS/JS vanilla, nessun build step) pensata per essere mostrata a potenziali clienti: tutte le sezioni della sidebar sono navigabili, i pulsanti sono cliccabili e generano azioni di esempio (modali, toast, filtri, un wizard di creazione prenotazione a 3 passaggi).

## Struttura

```
index.html        shell dell'app (sidebar, topbar, contenitore vista)
css/style.css      tema scuro con accenti arancioni
js/data.js         dataset di esempio (veicoli, clienti, prenotazioni, ...)
js/utils.js        helper (formattazione, toast, modali)
js/wizard.js       wizard "Nuova Prenotazione" (data → veicolo → dettagli)
js/views.js        rendering delle 12 sezioni del gestionale
js/app.js          routing e inizializzazione
```

## Avvio in locale

Nessuna build richiesta, basta un server statico:

```bash
npx serve .
# oppure
python3 -m http.server 8080
```

## Deploy

- **GitHub Pages**: pubblicato automaticamente dal branch `main` (cartella radice).
- **Firebase Hosting**: configurazione in `firebase.json`, deploy con `firebase deploy`.

Tutti i dati mostrati sono generati a scopo dimostrativo e non rappresentano clienti o prenotazioni reali.
