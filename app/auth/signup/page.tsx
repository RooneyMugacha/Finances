'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import Topbar from '../../components/Topbar';
import Footer from '../../components/Footer';
import { signupAction } from '@/app/actions/auth';
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

// ─── Password strength meter (client-side only) ──────────────────────────────

function score(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return pw.length === 0 ? 0 : Math.max(1, s);
}

const SCORE_LABEL = [
  'Use 8+ characters, mix letters, numbers & symbols',
  'Weak password',
  'Fair password',
  'Good password',
  'Strong password',
];

// ─── Component ────────────────────────────────────────────────────────────────

const initialState: AuthFormState = undefined;

export default function SignupPage() {
  const [state, action, pending] = useActionState(signupAction, initialState);
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [pass, setPass] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const sc = score(pass);

  function EyeBtn({ shown, toggle }: { shown: boolean; toggle: () => void }) {
    return (
      <button
        type="button"
        className="eye"
        aria-label={shown ? 'Hide password' : 'Show password'}
        onClick={toggle}
      >
        <span hidden={shown}>{EYE}</span>
        <span hidden={!shown}>{EYE_OFF}</span>
      </button>
    );
  }

  return (
    <>
      <Topbar />
      <main>
        <div className="auth-solo">
          <section className="auth-card">
            <form action={action} noValidate>
              <div className="form-title">Create your account</div>
              <p className="form-sub">Free for personal use. Takes less than a minute.</p>

              {/* Top-level error */}
              {state?.message && (
                <div className="form-error show" role="alert">
                  {state.message}
                </div>
              )}

              {/* Name */}
              <div className="field">
                <label htmlFor="su-name">Full name</label>
                <div className="control">
                  <input
                    id="su-name"
                    name="name"
                    type="text"
                    placeholder="e.g. Brian Otieno"
                    autoComplete="name"
                    className={state?.errors?.name ? 'invalid' : ''}
                  />
                </div>
                {state?.errors?.name && (
                  <div className="err show">{state.errors.name[0]}</div>
                )}
              </div>

              {/* Email */}
              <div className="field">
                <label htmlFor="su-email">Email</label>
                <div className="control">
                  <input
                    id="su-email"
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

              {/* Phone (optional) */}
              <div className="field">
                <label htmlFor="su-phone">
                  Phone{' '}
                  <span style={{ opacity: 0.6, fontWeight: 500 }}>(optional, for M-Pesa alerts)</span>
                </label>
                <div className="control">
                  <input
                    id="su-phone"
                    name="phone"
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    autoComplete="tel"
                    className={state?.errors?.phone ? 'invalid' : ''}
                  />
                </div>
                {state?.errors?.phone && (
                  <div className="err show">{state.errors.phone[0]}</div>
                )}
              </div>

              {/* Password */}
              <div className="field">
                <label htmlFor="su-pass">Password</label>
                <div className="control has-eye">
                  <input
                    id="su-pass"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    className={state?.errors?.password ? 'invalid' : ''}
                    onChange={(e) => setPass(e.target.value)}
                  />
                  <EyeBtn shown={showPass} toggle={() => setShowPass(!showPass)} />
                </div>
                <div className="meter" data-score={sc}>
                  <i></i><i></i><i></i><i></i>
                </div>
                <div className="meter-label">{SCORE_LABEL[sc]}</div>
                {state?.errors?.password && (
                  <div className="err show">
                    <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
                      {state.errors.password.map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="field">
                <label htmlFor="su-pass2">Confirm password</label>
                <div className="control has-eye">
                  <input
                    id="su-pass2"
                    name="confirmPassword"
                    type={showPass2 ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className={state?.errors?.confirmPassword ? 'invalid' : ''}
                  />
                  <EyeBtn shown={showPass2} toggle={() => setShowPass2(!showPass2)} />
                </div>
                {state?.errors?.confirmPassword && (
                  <div className="err show">{state.errors.confirmPassword[0]}</div>
                )}
              </div>

              {/* Privacy checkbox */}
              <div className="field">
                <label className="check">
                  <input
                    type="checkbox"
                    name="terms"
                    required
                    onClick={() => setToast(null)}
                  />
                  I understand my SMS data is stored securely and never shared. MfukoLens never asks for my M-Pesa PIN.
                </label>
              </div>

              {/* Submit */}
              <button className="btn-primary" type="submit" disabled={pending}>
                {pending ? 'Creating account…' : 'Create free account'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </form>

            <p className="switch-line">
              Already have an account? <Link href="/auth/login">Log in</Link>
            </p>
          </section>
        </div>
      </main>
      <Footer />

      {toast && (
        <div id="toast" className="show error" role="status">
          Please confirm the privacy note to continue
        </div>
      )}
    </>
  );
}