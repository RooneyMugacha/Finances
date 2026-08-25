// app/components/Topbar.tsx
import Link from 'next/link';
import { Wallet, LineChart, Shield, ArrowRight } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand logo */}
        <Link href="/" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-white hover:opacity-90 transition">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20">
            <Wallet size={20} className="stroke-[2.5]" />
          </span>
          <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            MfukoLens
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-400 md:flex">
          <Link href="/analysis" className="flex items-center gap-1.5 text-emerald-400 font-semibold hover:text-emerald-300 transition">
            <LineChart size={16} />
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
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition"
          >
            <LineChart size={14} className="text-emerald-400" />
            Live Analysis Demo
          </Link>
          <Link href="/auth/login" className="text-sm font-medium text-zinc-300 hover:text-white transition">
            Log in
          </Link>
          <Link 
            href="/auth/signup" 
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/10"
          >
            Get Started
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </header>
  );
}
