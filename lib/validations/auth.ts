import { z } from 'zod';

// ─── Signup Schema ─────────────────────────────────────────────────────────────

export const SignupSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long.' })
      .trim(),
    email: z
      .string()
      .email({ message: 'Please enter a valid email address.' })
      .trim()
      .toLowerCase(),
    phone: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => {
          if (!val || val === '') return true;
          return /^(\+254|0)(7|1)\d{8}$/.test(val.replace(/[\s-]/g, ''));
        },
        { message: 'Use format 07XX… or +2547XX…' },
      ),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long.' })
      .regex(/[a-z]/, {
        message: 'Password must contain at least one lowercase letter.',
      })
      .regex(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter.',
      })
      .regex(/[0-9]/, {
        message: 'Password must contain at least one number.',
      })
      .regex(/[^a-zA-Z0-9]/, {
        message: 'Password must contain at least one special character.',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type SignupInput = z.infer<typeof SignupSchema>;

// ─── Login Schema ──────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, { message: 'Password is required.' }),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ─── Form State (returned by server actions → consumed by useActionState) ──────

export type AuthFormState = {
  errors?: {
    name?: string[];
    email?: string[];
    phone?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  message?: string;
} | undefined;
