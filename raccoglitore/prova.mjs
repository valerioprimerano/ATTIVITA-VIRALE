// Prova del motore con commenti finti. Non tocca i file del sito: node raccoglitore/prova.mjs
import fs from "node:fs";
import { calcola } from "./motore.mjs";
import { analizza, indiceComuni } from "./testo.mjs";
import { controllaParole } from "./moderazione.mjs";

const comuni = JSON.parse(fs.readFileSync(new URL("../sito/dati/comuni.json", import.meta.url)));
const idx = indiceComuni(comuni);
const casi = ["Frosinone, pizzeria", "Roma bar", "sono di bari! gelateria", "Calliano (TN) forno", "Calliano AT, palestra",
  "Reggio Emilia pizzeria Da Gino", "San Giovanni Rotondo barbiere", "milano agenzia viaggi", "Napoli", "torre del greco, pasticceria",
  "@amico1 @amico2 Latina, officina", "lavoro @mario.rossi", "ciao bella pagina"];
for (const t of casi) { const a = analizza(t, idx); console.log(t.padEnd(40), "=>", a.comune != null ? comuni[a.comune].slice(0, 3).join(" / ") : "-", "|", a.cat || "", "|", a.nome || "", a.lavoro ? "LAVORO" : "", a.tag?.length ? "tag:" + a.tag : ""); }

const ora = Date.now(), m1 = "post1", m2 = "post2";
const ev = (i, u, t, m, min) => ({ id: "c" + i, u, t, m, ts: new Date(ora - min * 6e4).toISOString() });
const eventi = [
  ev(1, "mario.rossi", "Roma, pizzeria Da Mario @luca_b @sara.v", m1, 300),
  ev(2, "luca_b", "Milano bar", m1, 280),
  ev(3, "sara.v", "Napoli pasticceria", m1, 270),
  ev(4, "mario.rossi", "forza!", m2, 100),
  ev(5, "giulia", "Torino, palestra", m2, 90),
];
for (let i = 0; i < 30; i++) eventi.push(ev(100 + i, "mario.rossi", "@x" + i, "p" + i, 80 - i));
eventi.push(ev(200, "giulia", "lavoro @mario.rossi", m2, 10));
const extra = { "mario.rossi": { licenze: [1, 4], colore: "#E2482B" } };
const s = calcola({ eventi, comuni, extra });
console.log(JSON.stringify(s.attivita.map(a => [a.h, a.comune, a.cat, a.nome, a.incassi, a.posti, a.dipendenti.map(d => d.h + ":" + d.ruolo)]), null, 0));
console.log("filtro:", ["c4zz0", "luca.conte", "pizzeria nazionale"].map(t => t + "=" + controllaParole(t)).join(" | "));
