'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession, deleteSession } from '@/lib/session';
import {
  SignupSchema,
  LoginSchema,
  type AuthFormState,
} from '@/lib/validations/auth';

// ─── Signup ────────────────────────────────────────────────────────────────────

export async function signupAction(
  prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  // 1. Validate input
  const parsed = SignupSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;

  // 2. Check for duplicate email
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      errors: { email: ['An account with this email already exists.'] },
    };
  }

  // 3. Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // 4. Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  if (!user) {
    return {
      message: 'An error occurred while creating your account. Please try again.',
    };
  }

  // 5. Create session + cookie
  await createSession(user.id);

  // 6. Redirect (throws — never returns)
  redirect('/dashboard');
}

// ─── Login ─────────────────────────────────────────────────────────────────────

export async function loginAction(
  prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  // 1. Validate input
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;

  // 2. Look up user — don't reveal which field was wrong
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return {
      message: 'Invalid email or password.',
    };
  }

  // 3. Verify password
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    return {
      message: 'Invalid email or password.',
    };
  }

  // 4. Create session + cookie
  await createSession(user.id);

  // 5. Redirect (throws — never returns)
  redirect('/dashboard');
}

// ─── Logout ────────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect('/auth/login');
}
