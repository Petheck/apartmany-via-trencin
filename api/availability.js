// /api/availability.js — Vercel serverless funkcia
// Stiahne iCal (.ics) export z Bookingu pre oba apartmány a vráti obsadené dni.
//
// NASTAVENIE: do Environment Variables na Verceli pridaj:
//   ICAL_03  = https://ical.booking.com/v1/export?t=... (apartmán 03)
//   ICAL_09  = https://ical.booking.com/v1/export?t=... (apartmán 09)
// (V Booking extranete: Rates & Availability → Sync calendars → Export)

// Jednoduchý parser VEVENT blokov z .ics (DTSTART/DTEND)
function parseICal(text) {
  const events = [];
  const blocks = text.split('BEGIN:VEVENT');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const startMatch = block.match(/DTSTART(?:;VALUE=DATE)?:(\d{8})/);
    const endMatch = block.match(/DTEND(?:;VALUE=DATE)?:(\d{8})/);
    if (startMatch && endMatch) {
      events.push({ start: startMatch[1], end: endMatch[1] });
    }
  }
  return events;
}

// Rozbalí interval [start, end) na jednotlivé dni YYYY-MM-DD (end je v iCal exkluzívny = deň odchodu)
function expandDays(events) {
  const days = new Set();
  for (const ev of events) {
    const s = new Date(
      `${ev.start.slice(0, 4)}-${ev.start.slice(4, 6)}-${ev.start.slice(6, 8)}T00:00:00Z`
    );
    const e = new Date(
      `${ev.end.slice(0, 4)}-${ev.end.slice(4, 6)}-${ev.end.slice(6, 8)}T00:00:00Z`
    );
    for (let d = new Date(s); d < e; d.setUTCDate(d.getUTCDate() + 1)) {
      days.add(d.toISOString().slice(0, 10));
    }
  }
  return [...days].sort();
}

async function fetchICal(url) {
  if (!url) return [];
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'ViaApartmany/1.0' } });
    if (!res.ok) return [];
    const text = await res.text();
    return expandDays(parseICal(text));
  } catch (e) {
    return [];
  }
}

export default async function handler(req, res) {
  const apartman = (req.query?.apartman || '03').toString();

  // Mapovanie apartmánu na príslušný iCal link z env premenných
  const urlMap = {
    '03': process.env.ICAL_03,
    '09': process.env.ICAL_09,
  };
  const url = urlMap[apartman];

  // DEMO režim: ak nie je nastavený iCal link, vrátime ukážkové obsadené dni,
  // nech kalendár niečo zobrazí aj pred reálnym napojením na Booking.
  if (!url) {
    const today = new Date();
    const demo = [];
    [3, 4, 5, 12, 13, 20, 21, 22].forEach((offset) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      demo.push(d.toISOString().slice(0, 10));
    });
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
    return res.status(200).json({ apartman, demo: true, busy: demo });
  }

  const busy = await fetchICal(url);
  // cache na 10 minút (Booking aj tak neaktualizuje častejšie)
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
  return res.status(200).json({ apartman, demo: false, busy });
}
