// app/components/Topbar.tsx
import Link from 'next/link';

export default function Topbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand logo */}
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-white hover:opacity-90 transition">
          <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
            MfukoLens
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-400 md:flex">
          <Link href="/analysis" className="text-emerald-400 font-semibold hover:text-emerald-300 transition">
            Financial Analysis
          </Link>
          <a href="/#features" className="hover:text-white transition">Features</a>
          <a href="/#how" className="hover:text-white transition">How it Works</a>
          <a href="/#privacy" className="hover:text-white transition">Privacy</a>
        </nav>

        {/* Auth actions */}
        <div className="flex items-center gap-3">
          <Link 
            href="/analysis" 
            className="hidden sm:inline-flex items-center rounded-lg border border-white/10 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition"
          >
            Live Analysis
          </Link>
          <Link href="/auth/login" className="text-sm font-medium text-zinc-300 hover:text-white transition">
            Log in
          </Link>
          <Link 
            href="/auth/signup" 
            className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-emerald-400 transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
