// Giro completo: legge i nuovi commenti da Instagram, li controlla, ricalcola il gioco e scrive i file del sito.
// Lo lancia GitHub ogni 10 minuti (.github/workflows/raccogli.yml). Si può lanciare anche a mano: node raccoglitore/esegui.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { postRecenti, commenti } from "./instagram.mjs";
import { controllaParole, controllaIA } from "./moderazione.mjs";
import { calcola } from "./motore.mjs";
import { GIORNI_POST_ATTIVI, PROFILO } from "./config.mjs";

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const F = p => path.join(RADICE, p);
const leggi = (p, def) => { try { return JSON.parse(fs.readFileSync(F(p), "utf8")); } catch { return def; } };
const scrivi = (p, v) => { fs.mkdirSync(path.dirname(F(p)), { recursive: true }); fs.writeFileSync(F(p), JSON.stringify(v, null, p.endsWith("snapshot.json") ? 0 : 1)); };

const config = leggi("dati/impostazioni.json", {});
if (config.fermo) { console.log("Gioco in pausa (dati/impostazioni.json: fermo = true). Nessuna azione."); process.exit(0); }

const stato = leggi("dati/stato.json", { eventi: [] });
const comuni = leggi("sito/dati/comuni.json", []);
const extra = leggi("dati/attivita-extra.json", {});
const bloccatiLista = leggi("dati/bloccati.json", []);
const bloccati = new Set(bloccatiLista.map(b => (b.h || b).toLowerCase()));
const visti = new Set(stato.eventi.map(e => e.id));
const giocatoriPrima = new Set(stato.eventi.filter(e => !e.blocco).map(e => String(e.u).toLowerCase()));

const token = process.env.IG_TOKEN;
let nuovi = 0, rifiutati = 0;
if (token) {
  const post = await postRecenti(token, GIORNI_POST_ATTIVI);
  for (const m of post) {
    for (const c of await commenti(token, m.id)) {
      if (visti.has(c.id)) continue;
      visti.add(c.id);
      const u = String(c.u || "").toLowerCase();
      if (u === PROFILO) continue;
      // controllo all'ingresso: nome utente e testo
      let blocco = controllaParole(u) ? "nome utente non adatto" : null;
      if (blocco && !bloccati.has(u)) { bloccati.add(u); bloccatiLista.push({ h: u, motivo: blocco, quando: new Date().toISOString() }); }
      if (!blocco) blocco = controllaParole(c.t);
      if (!blocco && !giocatoriPrima.has(u)) blocco = await controllaIA(u, c.t);
      if (blocco) rifiutati++;
      stato.eventi.push({ ...c, ...(blocco ? { blocco } : {}) });
      nuovi++;
    }
  }
} else {
  console.log("IG_TOKEN non impostato: ricalcolo solo con i commenti già salvati.");
}

const inizio = Date.parse(config.inizio || stato.inizio || "2000-01-01");
const snap = calcola({ eventi: stato.eventi, comuni, extra, bloccati, inizio });

const vecchio = leggi("sito/dati/snapshot.json", {});
const senzaOra = s => JSON.stringify({ ...s, aggiornato: 0 });
const cambiato = nuovi > 0 || senzaOra(vecchio) !== senzaOra(snap);
if (cambiato) {
  scrivi("dati/stato.json", stato);
  scrivi("dati/bloccati.json", bloccatiLista);
  scrivi("sito/dati/snapshot.json", snap);
}
console.log(`Nuovi commenti: ${nuovi} (rifiutati: ${rifiutati}) · attività: ${snap.totali.attivita} · comuni: ${snap.totali.comuni} · ${cambiato ? "aggiornato" : "nessun cambiamento"}`);
