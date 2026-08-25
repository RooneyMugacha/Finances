import 'server-only';

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// ─── Config ────────────────────────────────────────────────────────────────────

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  throw new Error('SESSION_SECRET environment variable is not set.');
}
const encodedKey = new TextEncoder().encode(secretKey);
const SESSION_COOKIE = 'session';
const SESSION_DURATION_DAYS = 7;

// ─── JWT Encrypt / Decrypt ─────────────────────────────────────────────────────

export interface SessionPayload {
  sessionId: string;
  userId: string;
  expiresAt: string; // ISO date string
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(encodedKey);
}

export async function decrypt(
  token: string | undefined = '',
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ─── Create Session (DB + Cookie) ──────────────────────────────────────────────

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  );

  // 1. Create a session row in the database
  const dbSession = await prisma.session.create({
    data: {
      userId,
      token: crypto.randomUUID(),
      expiresAt,
    },
  });

  // 2. Encrypt the session ID into a JWT
  const token = await encrypt({
    sessionId: dbSession.id,
    userId,
    expiresAt: expiresAt.toISOString(),
  });

  // 3. Set the encrypted JWT as an HttpOnly cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

// ─── Verify Session (DB check) ────────────────────────────────────────────────

export async function verifySession(): Promise<{
  userId: string;
  sessionId: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = await decrypt(token);

  if (!payload?.sessionId) {
    return null;
  }

  // Confirm the session still exists in the DB and hasn't expired
  const dbSession = await prisma.session.findUnique({
    where: { id: payload.sessionId },
  });

  if (!dbSession || dbSession.expiresAt < new Date()) {
    // Session expired or deleted — clean up the cookie
    await deleteSession();
    return null;
  }

  return { userId: payload.userId, sessionId: payload.sessionId };
}

// ─── Delete Session (DB + Cookie) ──────────────────────────────────────────────

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = await decrypt(token);

  // Delete from DB if we can identify the session
  if (payload?.sessionId) {
    try {
      await prisma.session.delete({
        where: { id: payload.sessionId },
      });
    } catch {
      // Session may already be deleted — that's fine
    }
  }

  // Always clear the cookie
  cookieStore.delete(SESSION_COOKIE);
}
