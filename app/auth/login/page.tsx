'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import Topbar from '../../components/Topbar';
import Footer from '../../components/Footer';
import { loginAction } from '@/app/actions/auth';
import type { AuthFormState } from '@/lib/validations/auth';

const EYE = (
  <svg className="i-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EYE_OFF = (
  <svg className="i-eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 8 10 8a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const initialState: AuthFormState = undefined;

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPass, setShowPass] = useState(false);

  return (
    <>
      <Topbar />
      <main>
        <div className="auth-solo">
          <section className="auth-card">
            <form action={action} noValidate>
              <div className="form-title">Welcome back</div>
              <p className="form-sub">Log in to see your balances, spenders and alerts.</p>

              {/* Top-level error (generic "Invalid email or password") */}
              {state?.message && (
                <div className="form-error show" role="alert">
                  {state.message}
                </div>
              )}

              {/* Email */}
              <div className="field">
                <label htmlFor="li-email">Email</label>
                <div className="control">
                  <input
                    id="li-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={state?.errors?.email ? 'invalid' : ''}
                  />
                </div>
                {state?.errors?.email && (
                  <div className="err show">{state.errors.email[0]}</div>
                )}
              </div>

              {/* Password */}
              <div className="field">
                <label htmlFor="li-pass">Password</label>
                <div className="control has-eye">
                  <input
                    id="li-pass"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={state?.errors?.password ? 'invalid' : ''}
                  />
                  <button
                    type="button"
                    className="eye"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPass(!showPass)}
                  >
                    <span hidden={showPass}>{EYE}</span>
                    <span hidden={!showPass}>{EYE_OFF}</span>
                  </button>
                </div>
                {state?.errors?.password && (
                  <div className="err show">{state.errors.password[0]}</div>
                )}
              </div>

              {/* Row: remember me + forgot password */}
              <div className="row-split">
                <label className="check">
                  <input type="checkbox" defaultChecked />{' '}
                  Remember me for 7 days
                </label>
                <span className="link-small" style={{ opacity: 0.5, cursor: 'default' }}>
                  Forgot password?
                </span>
              </div>

              {/* Submit */}
              <button className="btn-primary" type="submit" disabled={pending}>
                {pending ? 'Logging in…' : 'Log in'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </form>

            <p className="switch-line">
              New to MfukoLens? <Link href="/auth/signup">Create a free account</Link>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}