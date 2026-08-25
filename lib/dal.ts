import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// ─── Verify Session (cached per request) ──────────────────────────────────────

/**
 * Verifies the current session by reading the cookie, decrypting the JWT,
 * and confirming the session exists in the database.
 *
 * Memoized via React `cache()` so multiple calls within the same request
 * only hit the DB once.
 *
 * Redirects to /auth/login if the session is invalid or expired.
 */
export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const payload = await decrypt(token);

  if (!payload?.sessionId) {
    redirect('/auth/login');
  }

  // Confirm the session still exists and is not expired
  const dbSession = await prisma.session.findUnique({
    where: { id: payload.sessionId },
  });

  if (!dbSession || dbSession.expiresAt < new Date()) {
    redirect('/auth/login');
  }

  return { isAuth: true, userId: payload.userId };
});

// ─── Get Current User ─────────────────────────────────────────────────────────

/**
 * Returns the authenticated user's profile data (safe subset — no passwordHash).
 * Returns null if the user doesn't exist; redirects if not authenticated.
 */
export const getCurrentUser = cache(async () => {
  const session = await verifySession();

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  } catch {
    console.error('Failed to fetch user');
    return null;
  }
});
