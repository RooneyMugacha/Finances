/* =========================================================
   Client-side auth adapter (localStorage for now).
   When you wire Next.js + Prisma/Postgres, swap these for
   server calls (Server Actions or Route Handlers):
     signup  -> POST /api/auth/signup
     login   -> POST /api/auth/login
     logout  -> POST /api/auth/logout
     session -> GET  /api/auth/session
   The pages only use these functions, so nothing else changes.
   ========================================================= */

export const USERS_KEY = 'mfukolens.users.v1';
export const SESSION_KEY = 'mfukolens.session.v1';

export function getUsers() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
}
export function saveUsers(list) { localStorage.setItem(USERS_KEY, JSON.stringify(list)); }

export function findByEmail(email) {
  const e = String(email).trim().toLowerCase();
  return getUsers().find((u) => u.email === e) || null;
}
export function insertUser(record) {
  const list = getUsers();
  list.push(record);
  saveUsers(list);
  return record;
}

export function getSession() {
  if (typeof window === 'undefined') return null;
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!s) return null;
    if (s.expiresAt < Date.now()) { localStorage.removeItem(SESSION_KEY); return null; }
    return s;
  } catch { return null; }
}
export function startSession(user, days = 7) {
  const s = {
    token: makeToken(),
    userId: user.id,
    name: user.name,
    email: user.email,
    startedAt: Date.now(),
    expiresAt: Date.now() + days * 86400000,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  return s;
}
export function endSession() { localStorage.removeItem(SESSION_KEY); }

export function makeToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'tok-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export async function hashPassword(pw) {
  const material = 'mfukolens::v1::' + pw;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < material.length; i++) {
    h1 = Math.imul(h1 ^ material.charCodeAt(i), 0x01000193) >>> 0;
    h2 = (h2 + material.charCodeAt(i) * 31) >>> 0;
  }
  return 'fnv-' + h1.toString(16) + h2.toString(16);
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
export const isPhone = (v) => {
  const t = String(v).replace(/[\s-]/g, '');
  return t === '' ? true : /^(\+254|0)(7|1)\d{8}$/.test(t);
};
export const isName = (v) => String(v).trim().length >= 2;