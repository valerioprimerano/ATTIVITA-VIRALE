// Controllo dei nomi prima di entrare nel gioco.
// 1) lista di parole vietate (sempre attiva, gratis)
// 2) controllo con intelligenza artificiale, solo se è impostata la chiave MODERAZIONE_API_KEY

// Radici: bloccano anche dentro altre parole (es. "xcazzox"). Solo radici che non compaiono in parole normali.
const RADICI = [
  "cazz", "minchi", "fottut", "fanculo", "vaffanc", "stronz", "puttan", "zoccol", "mignott", "coglion",
  "porcodio", "diocane", "dioporco", "porcamadonna", "ricchion", "culatton", "handicappat", "mongoloid",
  "pedofil", "pornhub", "onlyfans", "nigger", "nigga", "faggot", "hitler", "mussolini", "casapound", "forzanuova",
  "fratelliditalia", "stupratore", "stupro",
];
// Parole intere: bloccano solo come parola a sé (così "nazionale" o "sussex" restano permessi).
const PAROLE = [
  "troia", "troie", "bastardo", "bastardi", "merda", "frocio", "froci", "negro", "negri", "terrone", "terroni", "polentone",
  "ritardato", "ritardata", "fuck", "fucking", "shit", "bitch", "whore", "slut", "retard", "cunt", "dick", "pussy",
  "porno", "porn", "sesso", "sex", "nude", "nudes", "escort", "hentai", "xxx", "droga", "cocaina", "eroina", "spaccio",
  "nazista", "nazisti", "nazi", "duce", "isis", "terrorista", "uccidi", "ammazza", "ammazzo", "suicidio",
  "m5s", "meloni", "salvini", "schlein", "renzi", "berlusconi", "tajani", "calenda", "vannacci",
  "scommesse", "betting", "casino", "crypto", "bitcoin", "forex", "trading",
];

const LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i" };
const pulisci = s => String(s || "").toLowerCase().replace(/[013457@$!]/g, c => LEET[c])
  .normalize("NFKD").replace(/[̀-ͯ]/g, "");

export function controllaParole(...testi) {
  for (const t of testi) {
    const a = pulisci(t);
    const tutto = a.replace(/[^a-z]/g, "");                       // "c.a.z.z.o" -> "cazzo"
    const parole = new Set(a.replace(/[^a-z]+/g, " ").trim().split(" "));
    for (const r of RADICI) if (tutto.includes(r)) return `parola vietata: ${r}`;
    for (const p of PAROLE) if (parole.has(p)) return `parola vietata: ${p}`;
  }
  return null;
}

// Controllo con intelligenza artificiale (facoltativo). Usa il servizio di moderazione di OpenAI,
// che non ha costo per chi ha un account API; basta mettere la chiave tra i segreti di GitHub.
export async function controllaIA(...testi) {
  const key = process.env.MODERAZIONE_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: "omni-moderation-latest", input: testi.filter(Boolean).join("\n") }),
    });
    if (!r.ok) return null;                      // se il servizio non risponde, resta il filtro a parole
    const j = await r.json();
    const res = j.results?.[0];
    if (res?.flagged) return "contenuto non adatto: " + Object.keys(res.categories).filter(k => res.categories[k]).join(", ");
  } catch { /* nessun blocco se la rete fallisce */ }
  return null;
}
