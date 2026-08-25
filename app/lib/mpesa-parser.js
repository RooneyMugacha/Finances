/* =========================================================
   M-Pesa SMS parser — shared by web app + ingestion API.
   Fixtures it must handle:
   "You have received Ksh 1,500.00 from Rachel Wambui on 05/08/26 at 10:15 AM. New M-PESA balance is Ksh 4,700.00"
   "You have sent Ksh 500.00 to John Kamau on 05/08/26 at 1:42 PM. New M-PESA balance is Ksh 4,200.00"
   "You have paid Ksh 1,250.00 to Mama Njeri Groceries Till 447722 on 05/08/26 at 6:03 PM"
   "You have sent Ksh 2,300.00 to KPLC Paybill 444400 Account No 12345678 on 04/08/26 at 9:12 AM"
   ========================================================= */

export function looksLikeMpesa(text) {
  const t = String(text || '').toLowerCase();
  return /m-?pesa/.test(t) || (/ksh/.test(t) && /(received|sent|paid|withdrawn|airtime)/.test(t));
}

function toMinor(s) {
  const n = parseFloat(String(s).replace(/,/g, ''));
  if (isNaN(n)) return null;
  return Math.round(n * 100);
}

function cleanName(s) {
  const out = String(s || '')
    .replace(/\s+(till\s*\d+|paybill\s*\d+|account\s*no\.?.*)$/i, '')
    .replace(/[.\-–—|]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 60);
  return out || null;
}

function parseKeDate(dStr, tStr) {
  try {
    const p = dStr.split('/').map((n) => parseInt(n, 10));
    const dd = p[0], mm = p[1];
    const year = p[2] < 100 ? 2000 + p[2] : p[2];
    const tp = tStr.replace(/(am|pm)/i, '').trim().split(':').map((n) => parseInt(n, 10));
    let hh = tp[0]; const mi = tp[1] || 0;
    if (/pm/i.test(tStr) && hh < 12) hh += 12;
    if (/am/i.test(tStr) && hh === 12) hh = 0;
    return new Date(year, mm - 1, dd, hh, mi).toISOString();
  } catch (e) { return null; }
}

export function parseMpesaSms(text) {
  const raw = String(text || '').trim();
  const t = raw.toLowerCase();
  const out = {
    kind: 'unknown', direction: null, amountMinor: null, currency: 'KES',
    counterparty: null, counterpartyType: 'UNKNOWN',
    reference: null, balanceMinor: null, occurredAt: null, confidence: 0,
  };

  /* kind + direction */
  if (/have received|received ksh/.test(t))            { out.kind = 'received';  out.direction = 'IN'; }
  else if (/withdrawn/.test(t))                        { out.kind = 'withdrawal'; out.direction = 'OUT'; }
  else if (/paybill|account no/.test(t) && /(sent|paid)/.test(t)) { out.kind = 'paybill'; out.direction = 'OUT'; }
  else if (/(till|buy goods|lipa na m-?pesa)/.test(t) && /(sent|paid)/.test(t)) { out.kind = 'till'; out.direction = 'OUT'; }
  else if (/have sent|have paid|sent ksh|paid ksh/.test(t)) { out.kind = 'sent'; out.direction = 'OUT'; }
  else if (/airtime/.test(t))                          { out.kind = 'airtime';   out.direction = 'OUT'; }

  /* amount = first Ksh figure */
  const amt = raw.match(/ksh\.?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (amt) out.amountMinor = toMinor(amt[1]);

  /* new balance */
  const bal = raw.match(/balance is ksh\.?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (bal) out.balanceMinor = toMinor(bal[1]);

  /* transaction reference code */
  const ref = raw.match(/\b([A-Z]{1,3}[0-9][A-Z0-9]{6,12})\b/) || raw.match(/\b([A-Z0-9]{10})\b/);
  if (ref) out.reference = ref[1];

  /* counterparty */
  if (out.direction === 'IN') {
    const m = raw.match(/from\s+(.+?)\s+(?:on\s+|\d{1,2}\/)/i) || raw.match(/from\s+(.+)$/im);
    if (m) out.counterparty = cleanName(m[1]);
    out.counterpartyType = /agent|atm/i.test(out.counterparty || '') ? 'AGENT' : 'PERSON';
  } else {
    const till = raw.match(/till\s*(?:number)?\s*[:#-]?\s*(\d{4,7})/i) || raw.match(/buy goods\s*[:#-]?\s*(\d{4,7})/i);
    const paybill = raw.match(/paybill\s*(?:number)?\s*[:#-]?\s*(\d{4,7})/i);
    const m = raw.match(/(?:sent|paid)\s+(?:ksh\s*[\d,.]*\s+)?to\s+(.+?)\s+(?:on\s+|\d{1,2}\/)/i) || raw.match(/to\s+(.+?)\s+on/i);
    if (till) {
      out.counterpartyType = 'TILL';
      out.reference = out.reference || till[1];
      if (m) out.counterparty = cleanName(m[1]);
    } else if (paybill) {
      out.counterpartyType = 'PAYBILL';
      out.reference = out.reference || paybill[1];
      if (m) out.counterparty = cleanName(m[1]);
    } else if (m) {
      out.counterparty = cleanName(m[1]);
      out.counterpartyType = /agent|atm/i.test(out.counterparty || '') ? 'AGENT' : 'PERSON';
    }
  }

  /* date + time */
  const d = raw.match(/on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (d) out.occurredAt = parseKeDate(d[1], d[2]);

  /* confidence */
  let c = 0;
  if (out.amountMinor) c += 0.5;
  if (out.direction) c += 0.3;
  if (out.counterparty || out.counterpartyType !== 'UNKNOWN') c += 0.2;
  out.confidence = Math.round(c * 100) / 100;
  return out;
}