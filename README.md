# Attività Virale

Gioco su Instagram (@attivita.virale): chi commenta un post con **comune + tipo di attività** apre la sua attività sulla mappa d'Italia, la fa crescere e conquista cariche. Un progetto di Valprime Agency.

## Come funziona

Ogni 10 minuti GitHub lancia `raccoglitore/esegui.mjs`, che:

1. legge i nuovi commenti dei post di @attivita.virale (ultimi 30 giorni);
2. controlla nome utente e testo (parole vietate, più controllo automatico se c'è la chiave);
3. ricalcola attività, incassi, livelli, dipendenti e cariche (`raccoglitore/motore.mjs`);
4. salva `sito/dati/snapshot.json` e pubblica il sito su GitHub Pages.

## Cartelle

| Cartella | Cosa contiene |
| --- | --- |
| `sito/` | il sito: mappa, schede, classifiche, privacy; `dati/comuni.json` con i 7.904 comuni |
| `raccoglitore/` | lettura da Instagram, controllo nomi, regole del gioco (`config.mjs`) |
| `dati/` | commenti salvati, bloccati, impostazioni, licenze e personalizzazioni pagate |
| `.github/workflows/` | automazioni: aggiornamento ogni 10 minuti e rinnovo settimanale del codice Instagram |

## Pannello di controllo

- **Fermare tutto:** in `dati/impostazioni.json` metti `"fermo": true`.
- **Data di inizio:** in `dati/impostazioni.json`, `"inizio"` = data del primo post del gioco.
- **Licenze e personalizzazioni pagate:** in `dati/attivita-extra.json`, una voce per @ (vedi `_esempio`).
- **Regole e punti:** in `raccoglitore/config.mjs`.

## Segreti (Settings → Secrets and variables → Actions)

| Nome | A cosa serve |
| --- | --- |
| `IG_TOKEN` | codice di accesso dell'app Meta per @attivita.virale |
| `GH_PAT` | permette di rinnovare da solo `IG_TOKEN` ogni settimana |
| `MODERAZIONE_API_KEY` | facoltativo: controllo automatico dei nomi con intelligenza artificiale |

## Provare in locale

```
node raccoglitore/prova.mjs     # prova riconoscimento commenti e regole con dati finti
node raccoglitore/esegui.mjs    # giro completo (senza IG_TOKEN usa solo i commenti salvati)
```
