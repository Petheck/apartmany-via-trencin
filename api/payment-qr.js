// /api/payment-qr.js — Vercel serverless funkcia
// Vygeneruje PAY by square QR kód (slovenský platobný štandard).
// Volá sa AŽ PO schválení rezervácie majiteľom, keď si hosť zvolí platbu QR kódom.
//
// NASTAVENIE: do Environment Variables na Verceli pridaj:
//   IBAN        = SK.. (účet majiteľa, kam príde platba)
//   BENEFICIARY = Via Apartmány (názov príjemcu, voliteľné)
//
// Závislosť: balík "bysquare" (npm). Pridaj do package.json.
//   npm i bysquare

import { generate } from 'bysquare';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { amount, variableSymbol, note } = body || {};

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Chýba alebo neplatná suma' });
  }

  const iban = process.env.IBAN || 'SK0000000000000000000000'; // placeholder
  const beneficiary = process.env.BENEFICIARY || 'Via Apartmány';

  try {
    // PAY by square dátový reťazec
    const qrString = generate({
      payments: [
        {
          type: 1, // payment order
          amount: Number(amount),
          currencyCode: 'EUR',
          variableSymbol: (variableSymbol || '').toString(),
          paymentNote: note || 'Pobyt Via Apartmány',
          bankAccounts: [{ iban }],
          beneficiary: { name: beneficiary },
        },
      ],
    });

    // qrString sa vloží do QR generátora na frontende (alebo cez QR knižnicu)
    return res.status(200).json({ ok: true, qrString, iban, amount, variableSymbol });
  } catch (e) {
    return res.status(500).json({ error: 'Nepodarilo sa vygenerovať QR', detail: e.message });
  }
}
