# Via Apartmány — web + rezervačný systém

Web pre dva apartmány v Trenčíne (Zlatovce) v štýle kovia.sk.
Postavený pre nasadenie na **Vercel** (statický front + serverless funkcie).

## Štruktúra

```
/index.html          — hlavná showcase stránka
/rezervacia.html     — rezervačný kalendár + platba
/images/             — fotky apartmánov
/api/availability.js — číta obsadené termíny z Booking iCal
/api/booking.js      — prijme žiadosť, pošle mail majiteľovi
/api/payment-qr.js   — vygeneruje PAY by square QR po schválení
/package.json        — závislosti (bysquare)
```

## Nasadenie na Vercel

1. Nahraj priečinok do GitHub repozitára
2. Na vercel.com → New Project → importuj repo
3. Framework Preset: **Other** (je to statický web + API funkcie)
4. Deploy

## Premenné prostredia (Vercel → Settings → Environment Variables)

Pre **reálne napojenie** (kým nie sú vyplnené, beží demo režim):

| Premenná        | Kde ju získať                                                        |
|-----------------|----------------------------------------------------------------------|
| `ICAL_03`       | Booking extranet → Rates & Availability → Sync calendars → Export (apartmán 03) |
| `ICAL_09`       | To isté pre apartmán 09                                              |
| `IBAN`          | Číslo účtu majiteľa (kam chodia platby)                              |
| `BENEFICIARY`   | Názov príjemcu, napr. "Via Apartmány"                               |
| `RESEND_API_KEY`| resend.com (zadarmo do 100 mailov/deň) — na posielanie žiadostí     |
| `OWNER_EMAIL`   | E-mail majiteľa, kam chodia rezervácie                              |
| `FROM_EMAIL`    | Overená doména v Resend (napr. rezervacie@viaapartmany.sk)          |

## Ako to funguje

1. Hosť na `/rezervacia.html` vyberie apartmán → kalendár načíta obsadené dni z Bookingu (`/api/availability`) a zablokuje ich
2. Vyplní termín, hostí, kontakt → `/api/booking` pošle žiadosť majiteľovi mailom
3. Majiteľ rezerváciu **schváli** (mimo systému / telefonicky / mailom)
4. Po schválení si hosť zvolí platbu:
   - **Hotovosť** pri príchode, alebo
   - **QR kód** — `/api/payment-qr` vygeneruje PAY by square QR s presnou sumou a variabilným symbolom

## Dôležité obmedzenia

- **iCal sync nie je real-time** — Booking aktualizuje export s oneskorením (15 min až pár hodín). Krok "majiteľ schváli" slúži ako poistka proti dvojitej rezervácii.
- **iCal je jednosmerný** — rezervácia cez web sa NEZAPÍŠE späť do Bookingu automaticky. Majiteľ musí termín v Bookingu manuálne zablokovať. (Plná obojsmerná sync = platený channel manager.)

## Placeholdery na doplnenie

- Telefón a e-mail v `index.html` a `rezervacia.html` (`+421 905 …`, `info@viaapartmany.sk`)
- Presná adresa + Google Maps embed v sekcii Kontakt
- IBAN a iCal linky cez Vercel env premenné (viď vyššie)
