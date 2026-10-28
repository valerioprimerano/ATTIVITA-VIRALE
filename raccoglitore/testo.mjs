// Riconosce comune, categoria, nome dell'attività e @ taggati nel testo di un commento.
import { CATEGORIE } from "./config.mjs";

export const norm = s => String(s || "")
  .normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[’`´]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
const squash = s => norm(s).replace(/[' ]/g, "");

export function menzioni(testo) {
  return [...String(testo || "").matchAll(/@([a-zA-Z0-9._]{1,30})/g)].map(m => m[1].toLowerCase().replace(/\.+$/, ""));
}

// Indice dei comuni: nome normalizzato -> [indici], più sigle di provincia
// Nomi con cui la gente scrive i comuni, diversi da quelli ufficiali ISTAT
const ALIAS = { "reggio emilia": "reggio nell'emilia", "reggio calabria": "reggio di calabria", "bolzano": "bolzano", "aosta": "aosta",
  "forli": "forli", "pesaro": "pesaro", "urbino": "urbino", "massa carrara": "massa", "barletta": "barletta", "monza brianza": "monza" };

export function indiceComuni(comuni) {
  const perNome = new Map();
  const inverso = Object.entries(ALIAS).reduce((m, [a, uff]) => ((m[norm(uff)] ||= []).push(norm(a)), m), {});
  comuni.forEach(([nome, sigla], i) => {
    const base = norm(nome);
    for (const k of new Set([base, norm(nome.split("/")[0]), ...(inverso[base] || [])])) {
      if (!perNome.has(k)) perNome.set(k, []);
      perNome.get(k).push(i);
    }
  });
  const maxParole = Math.max(...[...perNome.keys()].map(k => k.split(" ").length));
  return { perNome, maxParole, comuni };
}

const CAT_ALIAS = CATEGORIE.flatMap(([k, , alias]) => alias.map(a => [norm(a), k]))
  .sort((a, b) => b[0].length - a[0].length);

export function trovaCategoria(t) {
  for (const [a, k] of CAT_ALIAS) {
    const re = new RegExp(`(^| )${a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`);
    if (re.test(t)) return { cat: k, alias: a };
  }
  return null;
}

export function trovaComune(t, idx, siglaPreferita) {
  const parole = t.split(" ");
  let best = null;
  for (let n = Math.min(idx.maxParole, parole.length); n >= 1; n--) {
    for (let i = 0; i + n <= parole.length; i++) {
      const frase = parole.slice(i, i + n).join(" ");
      const hit = idx.perNome.get(frase);
      if (!hit) continue;
      // con più comuni omonimi: prima la sigla scritta nel commento, poi il più popoloso
      let scelti = hit;
      if (siglaPreferita) { const s = hit.filter(j => idx.comuni[j][1] === siglaPreferita); if (s.length) scelti = s; }
      const j = [...scelti].sort((a, b) => (idx.comuni[b][5] || 0) - (idx.comuni[a][5] || 0))[0];
      const cand = { i: j, frase, n };
      if (!best || n > best.n) best = cand;
    }
    if (best) return best;
  }
  return null;
}

const LEGAME = new Set(["da", "di", "del", "della", "dei", "al", "alla"]);
const PAROLE_VUOTE = new Set(["sono", "di", "da", "a", "in", "il", "lo", "la", "le", "i", "gli", "un", "una", "e", "ho", "apro", "mia", "mio", "nostra", "nostro", "provincia", "regione", "zona", "citta", "comune", "vengo", "abito", "vivo", "qui", "con", "per", "the", "del", "della", "dei"]);

// Analizza un commento. Ritorna { comune, cat, nome, tag, lavoro } o null se non riconosce un comune.
export function analizza(testo, idx) {
  const tag = menzioni(testo);
  const pulito = String(testo || "").replace(/@[a-zA-Z0-9._]+/g, " ");
  const t = norm(pulito);
  const lav = /(^| )(lavoro|candidatura|mi candido|assumimi)( |$)/.test(t);
  if (lav) return { lavoro: true, tag };
  if (/(^| )(licenziati|mi licenzio|lascio il lavoro)( |$)/.test(t)) return { dimissioni: true, tag };

  const sm = String(pulito).match(/\(([A-Za-z]{2})\)|\b([A-Z]{2})\b/);
  const sigla = sm ? (sm[1] || sm[2]).toUpperCase() : null;
  const c = trovaComune(t, idx, sigla);
  const k = trovaCategoria(t);
  if (!c) return { tag, cat: k?.cat || null };
  // senza categoria il comune deve essere il cuore del commento ("Napoli", "sono di Napoli"), non una parola a caso ("ciao bella pagina")
  if (!k) {
    const utili = t.split(" ").filter(w => w && !PAROLE_VUOTE.has(w));
    if (c.n * 2 < utili.length) return { tag, cat: null };
  }

  // il nome dell'attività è quello che resta togliendo comune, categoria, sigla e parole vuote
  let resto = " " + t + " ";
  resto = resto.replace(" " + c.frase + " ", " ");
  if (k) resto = resto.replace(" " + k.alias + " ", " ");
  if (sigla) resto = resto.replace(" " + sigla.toLowerCase() + " ", " ");
  const regioni = ["lazio", "lombardia", "campania", "sicilia", "piemonte", "veneto", "toscana", "puglia", "calabria", "sardegna", "liguria", "marche", "abruzzo", "umbria", "basilicata", "molise", "trentino", "friuli", "emilia", "romagna", "valle d'aosta"];
  const w = resto.trim().split(" ").filter(x => x && !regioni.includes(x));
  // tiene "da", "del"... solo quando legano due parole del nome ("Da Gino"), toglie le altre parole vuote
  const nomeParole = w.filter((x, i) => !PAROLE_VUOTE.has(x) || (LEGAME.has(x) && w[i + 1] && !PAROLE_VUOTE.has(w[i + 1]) && (i === 0 || !["sono", "vengo", "abito", "vivo"].includes(w[i - 1]))));
  let nome = null;
  if (nomeParole.length && nomeParole.length <= 4) {
    nome = nomeParole.join(" ").replace(/\b\w/g, m => m.toUpperCase()).slice(0, 24);
    if (nome.replace(/[^a-z]/gi, "").length < 3) nome = null;
  }
  return { comune: c.i, cat: k?.cat || "negozio", nome, tag };
}

export { squash };
