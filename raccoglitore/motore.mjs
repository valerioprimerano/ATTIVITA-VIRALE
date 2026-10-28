// Motore delle regole: dagli eventi (commenti) ricalcola ogni volta tutto lo stato del gioco.
// Ricalcolare da capo rende il risultato sempre coerente: cambiando una regola in config.mjs, si aggiorna tutto.
import { PUNTI, LIVELLI, LICENZE, LIVELLO_ASSUNZIONI, POSTI_GRATIS, POSTI_MAX, CATEGORIE, PROFILO } from "./config.mjs";
import { analizza, indiceComuni } from "./testo.mjs";

const CAT = Object.fromEntries(CATEGORIE.map(([k, n]) => [k, n]));
const GIORNO = 864e5;

// Inizio della settimana di gioco: domenica alle 21:00, ora di Roma
export function inizioSettimana(now = Date.now()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date(now)).map(x => [x.type, x.value]));
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  const ore = (dow * 24 + +p.hour - 21 + 168) % 168;
  return now - (ore * 3600 + +p.minute * 60 + +p.second) * 1000;
}

export function livello(incassi, licenze = [], verificata = false) {
  let l = 0; LIVELLI.forEach(([, min], i) => { if (incassi >= min) l = i; });
  for (const g of Object.keys(LICENZE).map(Number).sort((a, b) => a - b)) {
    if (l < g) break;
    if (!verificata && !licenze.includes(g)) return g - 1;
  }
  return l;
}

export function calcola({ eventi, comuni, extra = {}, bloccati = new Set(), now = Date.now(), inizio = 0 }) {
  const idx = indiceComuni(comuni);
  const giocatori = new Map();
  const taggatiDa = new Map();      // chi ha taggato per primo un futuro giocatore
  const settimana = inizioSettimana(now);
  const feed = [];

  const totale = p => p.punti.reduce((t, x) => t + x.v, 0);
  const lv = p => livello(totale(p), extra[p.h]?.licenze || [], !!extra[p.h]?.verificata);
  const posti = p => lv(p) >= LIVELLO_ASSUNZIONI ? Math.min(POSTI_MAX, POSTI_GRATIS + (extra[p.h]?.posti || 0)) : 0;

  function aggiungi(p, v, fonte, ts) {
    const lvPrima = lv(p);
    p.punti.push({ v, fonte, ts });
    if (p.datore) {
      const d = giocatori.get(p.datore);
      if (d) { const q = v * PUNTI.quotaDipendente; d.punti.push({ v: q, fonte: "dipendenti", ts }); p.resoAlDatore += q; }
    }
    const lvDopo = lv(p);
    if (lvDopo > lvPrima) feed.push({ ts, tipo: "livello", h: p.h, livello: LIVELLI[lvDopo][0] });
  }

  const ordinati = [...eventi].filter(e => !e.blocco && Date.parse(e.ts) >= inizio).sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
  for (const e of ordinati) {
    const u = String(e.u || "").toLowerCase();
    if (!u || u === PROFILO || bloccati.has(u)) continue;
    const ts = Date.parse(e.ts);
    const a = analizza(e.t, idx);
    let p = giocatori.get(u);

    if (!p) {
      if (a.comune == null) continue;                       // per entrare serve un comune riconosciuto
      p = { h: u, ci: a.comune, cat: a.cat, nome: a.nome, aperta: ts, punti: [], post: new Set([e.m]), tagPost: new Map(), datore: null, assunto: 0, resoAlDatore: 0, dip: [] };
      giocatori.set(u, p);
      aggiungi(p, PUNTI.apertura, "commenti", ts);
      feed.push({ ts, tipo: "apertura", h: u, cat: p.cat, ci: p.ci });
      const t = taggatiDa.get(u);
      if (t && giocatori.has(t)) { aggiungi(giocatori.get(t), PUNTI.reclutato, "reclutati", ts); feed.push({ ts, tipo: "reclutato", h: t, nuovo: u }); }
    } else {
      if (a.lavoro && a.tag?.length) {
        const d = giocatori.get(a.tag[0]);
        if (d && d !== p && !p.datore && d.dip.length < posti(d)) {
          p.datore = d.h; p.assunto = ts; p.resoAlDatore = 0; d.dip.push(p.h);
          feed.push({ ts, tipo: "assunzione", h: p.h, datore: d.h });
        }
      } else if (a.dimissioni && p.datore) {
        const d = giocatori.get(p.datore); if (d) d.dip = d.dip.filter(x => x !== p.h);
        p.datore = null;
      }
      if (!p.post.has(e.m)) { p.post.add(e.m); aggiungi(p, PUNTI.commentoPost, "commenti", ts); }
    }

    // amici taggati
    const n = p.tagPost.get(e.m) || 0;
    const nuovi = [...new Set(a.tag || [])].filter(t => t !== u && t !== PROFILO).slice(0, Math.max(0, PUNTI.tagMaxPerPost - n));
    if (!a.lavoro) for (const t of nuovi) {
      aggiungi(p, PUNTI.tag, "reclutati", ts);
      if (!giocatori.has(t) && !taggatiDa.has(t)) taggatiDa.set(t, u);
    }
    p.tagPost.set(e.m, n + nuovi.length);
  }

  // Storie (quando arriveranno dal collegamento delle menzioni): extra[h].storie = ["2026-11-02", ...]
  for (const [h, x] of Object.entries(extra)) {
    const p = giocatori.get(h);
    if (p && Array.isArray(x.storie)) for (const d of new Set(x.storie)) aggiungi(p, PUNTI.storia, "storie", Date.parse(d));
  }

  const attivita = [...giocatori.values()].map(p => {
    const x = extra[p.h] || {};
    const fonti = { commenti: 0, storie: 0, reclutati: 0, dipendenti: 0, voti: 0 };
    p.punti.forEach(q => { fonti[q.fonte] = (fonti[q.fonte] || 0) + q.v; });
    const inc = totale(p);
    const sett = p.punti.filter(q => q.ts >= settimana).reduce((t, q) => t + q.v, 0);
    // ruoli dei dipendenti: per anzianità e per quanto hanno portato
    const dip = p.dip.map(h => giocatori.get(h)).filter(Boolean).sort((a, b) => b.resoAlDatore - a.resoAlDatore);
    const dipendenti = dip.map((d, i) => {
      const giorni = (now - d.assunto) / GIORNO;
      let ruolo = giorni >= 14 ? "Dipendente" : "Stagista";
      if (giorni >= 14 && i === 0) ruolo = "Direttore"; else if (giorni >= 14 && i <= 2) ruolo = "Responsabile";
      if ((x.soci || []).includes(d.h)) ruolo = "Socio";
      return { h: d.h, ruolo, incassi: Math.round(d.resoAlDatore / PUNTI.quotaDipendente) };
    });
    const c = comuni[p.ci];
    return {
      h: p.h, ci: p.ci, comune: c[0], cat: p.cat,
      nome: x.insegna || p.nome || `${CAT[p.cat]} ${c[0]}`.slice(0, 24),
      incassi: Math.round(inc), settimana: Math.round(sett), aperta: new Date(p.aperta).toISOString(),
      promo: x.promo_fino ? Date.parse(x.promo_fino) > now : false,
      licenze: x.licenze || [], colore: x.colore || null, verificata: !!x.verificata, descrizione: x.descrizione || "",
      dipendenti, posti: Math.max(0, posti(p) - dipendenti.length), datore: p.datore,
      fonti: Object.fromEntries(Object.entries(fonti).map(([k, v]) => [k, Math.round(v)])),
    };
  });

  feed.sort((a, b) => b.ts - a.ts);
  return {
    versione: 1,
    aggiornato: new Date(now).toISOString(),
    settimanaDal: new Date(settimana).toISOString(),
    totali: { attivita: attivita.length, comuni: new Set(attivita.map(a => a.ci)).size, commenti: ordinati.length },
    attivita,
    eventi: feed.slice(0, 60).map(f => ({ ...f, ts: new Date(f.ts).toISOString() })),
  };
}
