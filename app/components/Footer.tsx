// app/components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* brand blurb */}
        <div className="footer-brand">
          <Link href="/" className="brand" style={{ fontSize: 18 }}>
            <span className="brand-logo" style={{ width: 34, height: 34 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </span>
            MfukoLens
          </Link>
          <p>Know where every shilling goes. Built for M-Pesa users in Kenya.</p>
        </div>

        {/* link columns */}
        <div className="footer-cols">
          <div>
            <h4>Product</h4>
            <a href="/#features">Features</a>
            <a href="/#how">How it works</a>
            <a href="/#privacy">Privacy</a>
          </div>
          <div>
            <h4>Account</h4>
            <Link href="/auth/login">Log in</Link>
            <Link href="/auth/signup">Sign up free</Link>
          </div>
          <div>
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <span>© {new Date().getFullYear()} MfukoLens · Made in Kenya 🇰🇪</span>
          <span>Not affiliated with Safaricom or M-PESA.</span>
        </div>
      </div>
    </footer>
  );
}
