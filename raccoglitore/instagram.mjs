// Lettura di post e commenti dal profilo del gioco, con le API ufficiali di Instagram (Instagram API with Instagram Login).
const BASE = "https://graph.instagram.com";

async function chiedi(url) {
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`Instagram: ${j.error?.message || r.status}`);
  return j;
}

export async function postRecenti(token, giorni) {
  const limite = Date.now() - giorni * 864e5;
  const out = [];
  let url = `${BASE}/me/media?fields=id,timestamp,permalink,media_type&limit=50&access_token=${encodeURIComponent(token)}`;
  while (url) {
    const j = await chiedi(url);
    for (const m of j.data || []) {
      if (Date.parse(m.timestamp) < limite) return out;
      out.push(m);
    }
    url = j.paging?.next || null;
  }
  return out;
}

export async function commenti(token, mediaId) {
  const out = [];
  let url = `${BASE}/${mediaId}/comments?fields=id,text,timestamp,username,replies{id,text,timestamp,username}&limit=50&access_token=${encodeURIComponent(token)}`;
  while (url) {
    const j = await chiedi(url);
    for (const c of j.data || []) {
      out.push({ id: c.id, u: c.username, t: c.text, ts: c.timestamp, m: mediaId });
      for (const r of c.replies?.data || []) out.push({ id: r.id, u: r.username, t: r.text, ts: r.timestamp, m: mediaId });
    }
    url = j.paging?.next || null;
  }
  return out;
}

// Rinnova il codice di accesso (dura 60 giorni). Restituisce il nuovo codice.
export async function rinnovaToken(token) {
  const j = await chiedi(`${BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
  return j.access_token;
}
