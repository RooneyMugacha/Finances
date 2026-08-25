/* =========================================================
   Ingestion store (client demo). When Prisma is wired:
     ingestRaw    -> POST /api/ingest/sms  (server writes inbound_messages + transactions)
     confirm/reject -> POST /api/messages/:id/confirm | /reject
   ========================================================= */
import { parseMpesaSms, looksLikeMpesa } from './mpesa-parser';

const MSG_KEY = 'mfukolens.messages.v1';
const TX_KEY = 'mfukolens.transactions.v1';

function read(key) { if (typeof window === 'undefined') return []; try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
function write(key, v) { localStorage.setItem(key, JSON.stringify(v)); }
function uid() { return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10); }

export function messageHash(raw) {
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) >>> 0;
  return 'h' + h.toString(16);
}

export const getMessages = () => read(MSG_KEY);
export const getTransactions = () => read(TX_KEY);

export function fmtKESMinor(minor) {
  return 'KES ' + (minor / 100).toLocaleString('en-KE', { maximumFractionDigits: 2 });
}

export function guessCategory(parsed) {
  const n = (parsed.counterparty || '').toLowerCase();
  if (parsed.direction === 'IN') return 'Income';
  if (/rent|house|landlord/.test(n)) return 'Rent';
  if (/airtime|safaricom|bundle/.test(n)) return 'Airtime & Data';
  if (/bolt|uber|taxi|matatu|fuel|petrol/.test(n)) return 'Transport';
  if (/kplc|power|electric|water/.test(n)) return 'Utilities';
  if (parsed.counterpartyType === 'TILL' || /carrefour|naivas|grocer|supermarket|shop/.test(n)) return 'Food & Shopping';
  return 'Other';
}

export function ingestRaw(raw, source) {
  const text = String(raw || '').trim();
  if (!text) return { ok: false, reason: 'empty' };
  if (!looksLikeMpesa(text)) return { ok: false, reason: 'not-mpesa' };

  const hash = messageHash(text);
  const list = getMessages();
  const dup = list.find((m) => m.hash === hash);
  if (dup) return { ok: false, reason: 'duplicate', existing: dup };

  const parsed = parseMpesaSms(text);
  const message = {
    id: uid(), hash, source: source || 'SIMULATOR', raw: text, parsed,
    status: parsed.amountMinor && parsed.direction ? 'pending' : 'review',
    receivedAt: new Date().toISOString(),
  };
  list.unshift(message);
  write(MSG_KEY, list);
  return { ok: true, message };
}

export function confirmMessage(id) {
  const list = getMessages();
  const msg = list.find((m) => m.id === id);
  if (!msg) return null;
  msg.status = 'confirmed';
  write(MSG_KEY, list);

  const txs = getTransactions();
  const tx = {
    id: uid(), messageId: msg.id, source: msg.source,
    direction: msg.parsed.direction, amountMinor: msg.parsed.amountMinor,
    counterparty: msg.parsed.counterparty, counterpartyType: msg.parsed.counterpartyType,
    reference: msg.parsed.reference, category: guessCategory(msg.parsed),
    occurredAt: msg.parsed.occurredAt || msg.receivedAt,
    status: 'confirmed', createdAt: new Date().toISOString(),
  };
  txs.unshift(tx);
  write(TX_KEY, txs);
  return { message: msg, transaction: tx };
}

export function rejectMessage(id) {
  const list = getMessages();
  const msg = list.find((m) => m.id === id);
  if (!msg) return null;
  msg.status = 'rejected';
  write(MSG_KEY, list);
  return msg;
}