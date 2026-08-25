// app/lib/auth.ts
// Lightweight client-side auth backed by localStorage (demo / MVP)

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passHash: string;
  createdAt: string;
}

interface Session {
  userId: string;
  expiresAt: number;
}

const USERS_KEY = 'mfuko_users';
const SESSION_KEY = 'mfuko_session';

// ─── helpers ───────────────────────────────────────────────────────────────

export function makeToken(): string {
  return crypto.randomUUID();
}

export function isName(v: string): boolean {
  return v.trim().length >= 2;
}

export function isPhone(v: string): boolean {
  if (!v.trim()) return true; // optional
  return /^(\+?\d{1,3})?[\s\-]?\d{9,10}$/.test(v.trim().replace(/[\s\-]/g, ''));
}

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export async function hashPassword(plain: string): Promise<string> {
  const enc = new TextEncoder().encode(plain);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── user store ────────────────────────────────────────────────────────────

function loadUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]') as User[];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findByEmail(email: string): User | undefined {
  return loadUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
}

export function insertUser(user: User): User {
  const users = loadUsers();
  users.push(user);
  saveUsers(users);
  return user;
}

// ─── session ───────────────────────────────────────────────────────────────

export function startSession(user: User, daysValid: number): void {
  const session: Session = {
    userId: user.id,
    expiresAt: Date.now() + daysValid * 86_400_000,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return loadUsers().find((u) => u.id === session.userId) ?? null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
