# GestionaleSemplice

Tabella con colonne dinamiche per gestire anagrafiche con prodotto e medico di base.

## Funzionalità

- **Colonne dinamiche**: predefinite *Nome, Cognome, Prodotto, Medico di base*; si possono aggiungere,
  rinominare, eliminare e riordinare (trascinando le intestazioni o con le frecce in *Colonne*).
  Tipi disponibili: testo, numero, data, elenco a scelta.
- **Elenchi** (*Medici e prodotti*): gestione dei medici di base, dei prodotti e di altri elenchi
  personalizzati. Nelle celle si sceglie dall'elenco con i suggerimenti; se si scrive un valore
  nuovo l'app propone di aggiungerlo all'elenco. Rinominare un valore lo aggiorna in tutte le righe.
- **Inserimento** direttamente in tabella (stile foglio di calcolo) oppure tramite modulo.
- **Filtri per colonna** in base al tipo: testo “contiene”, intervallo da/a per numeri e date,
  selezione multipla per gli elenchi.
- **Esporta Excel (.xlsx)** della vista corrente: solo le righe filtrate, con le colonne nell'ordine mostrato.
- **Backup**: i dati sono salvati nel browser (localStorage); da *Backup* si può scaricare/importare
  un file `.json` per spostarli su un altro computer o conservarne una copia.

> ⚠️ I dati restano solo nel browser in cui vengono inseriti: cancellando i dati di navigazione
> si perdono. Esporta regolarmente un backup.

## Sviluppo

```bash
npm install
npm run dev      # server di sviluppo
npm run build    # build di produzione in dist/
```

Stack: React + TypeScript + Vite, [ExcelJS](https://github.com/exceljs/exceljs) per l'esportazione.

## Demo su GitHub Pages

Il workflow `.github/workflows/deploy.yml` pubblica il sito a ogni push su `main`
(o manualmente da *Actions → Deploy su GitHub Pages → Run workflow*).
Una tantum: in *Settings → Pages* impostare **Source: GitHub Actions**.
