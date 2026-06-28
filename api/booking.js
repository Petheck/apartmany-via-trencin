// /api/booking.js — Vercel serverless funkcia
// Prijme žiadosť o rezerváciu z formulára a pošle ju majiteľovi na schválenie.
//
// NASTAVENIE (Environment Variables na Verceli):
//   RESEND_API_KEY = re_...        (z resend.com — zadarmo do 100 mailov/deň)
//   OWNER_EMAIL    = majitel@...   (kam chodia žiadosti)
//   FROM_EMAIL     = rezervacie@viaapartmany.sk (overená doména v Resend)
//
// Bez RESEND_API_KEY funkcia funguje v "demo" režime — žiadosť len zaloguje
// a vráti úspech, aby sa dal flow odskúšať.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { apartman, checkin, checkout, nights, adults, children, name, phone, email, note } = body || {};

  if (!checkin || !checkout || !name || !phone) {
    return res.status(400).json({ error: 'Chýbajú povinné údaje' });
  }

  // jednoduchý variabilný symbol z dátumu + náhody (pre QR platbu neskôr)
  const vs = `${(checkin || '').replace(/-/g, '').slice(2)}${Math.floor(Math.random() * 90 + 10)}`;

  const aptName = apartman === '09' ? 'Apartmán 09 (sprcha)' : 'Apartmán 03 (vaňa)';
  const summary = `
Nová žiadosť o rezerváciu — Via Apartmány

Apartmán: ${aptName}
Termín: ${checkin} → ${checkout} (${nights} nocí)
Hostia: ${adults} dospelí, ${children || 0} deti
Meno: ${name}
Telefón: ${phone}
E-mail: ${email || '—'}
Poznámka: ${note || '—'}

Variabilný symbol (pre QR platbu): ${vs}
`.trim();

  const RESEND = process.env.RESEND_API_KEY;
  const OWNER = process.env.OWNER_EMAIL;
  const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';

  // DEMO režim
  if (!RESEND || !OWNER) {
    console.log('[DEMO booking]', summary);
    return res.status(200).json({ ok: true, demo: true, vs, message: 'Žiadosť prijatá (demo režim).' });
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [OWNER],
        reply_to: email || undefined,
        subject: `Rezervácia: ${aptName} · ${checkin}`,
        text: summary,
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      return res.status(502).json({ error: 'Mail sa nepodarilo odoslať', detail: err });
    }
    return res.status(200).json({ ok: true, vs, message: 'Žiadosť odoslaná majiteľovi.' });
  } catch (e) {
    return res.status(500).json({ error: 'Chyba servera', detail: e.message });
  }
}
