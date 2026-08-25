// app/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Topbar from '@/app/components/Topbar';
import Footer from '@/app/components/Footer';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  BellRing,
  FileUp,
  PieChart,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
  LineChart,
  CheckCircle2,
  Lock,
  Sparkles,
  Smartphone,
  Server
} from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'Real-time Balance Tracking',
    description: 'Always know your exact M-Pesa balance updated after every incoming or outgoing SMS.',
  },
  {
    icon: ArrowDownLeft,
    title: 'Money Received (Inflow)',
    description: 'Instantly track who sends you money — salary, clients, peer transfers — with automated sender categorization.',
  },
  {
    icon: ArrowUpRight,
    title: 'Money Sent (Outflow)',
    description: 'Know where every shilling goes: rent, paybills, buy goods, airtime, utilities, and peer transfers.',
  },
  {
    icon: Zap,
    title: 'Automated Webhook Sync',
    description: 'Connect your SMS forwarder or ngrok webhook endpoint to process M-Pesa notifications hands-free.',
  },
  {
    icon: PieChart,
    title: 'Wastage & Leak Radar',
    description: 'Identify hidden leaks like small daily KES 200 transactions eating up your monthly savings.',
  },
  {
    icon: FileUp,
    title: 'M-Pesa Statement Import',
    description: 'Import your official Safaricom PDF/CSV statements. Automatic duplicate detection built-in.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Connect SMS Webhook',
    description: 'Set your webhook URL (e.g. ngrok) or forward SMS messages directly to MfukoLens.',
  },
  {
    step: '02',
    title: 'Automatic SMS Parsing',
    description: 'Our engine extracts Transaction Code, Money Received, Money Sent, and M-Pesa Balance instantly.',
  },
  {
    step: '03',
    title: 'Instant Financial Analysis',
    description: 'View your live net cashflow, category breakdown, top senders, and budget runway.',
  },
];

const painPoints = [
  '“My salary lands on the 1st… and vanishes by the 15th without me knowing where it went.”',
  '“Small KES 100 and KES 200 payments are quietly draining my M-Pesa balance.”',
  '“I only discover I\'m broke when a payment fails at the supermarket checkout.”',
];

function HeroDashboardPreview() {
  const [activeTab, setActiveTab] = useState<'overview' | 'received' | 'sent'>('overview');

  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
      {/* Background glowing emerald blur */}
      <div className="absolute -inset-4 rounded-3xl bg-emerald-500/20 blur-3xl opacity-70 animate-pulse" />

      <div className="relative rounded-2xl border border-white/10 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-xl">
        {/* Top Header inside preview */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500 text-zinc-950">
              <Wallet size={16} />
            </span>
            <span className="font-bold text-sm text-white">MfukoLens Live Overview</span>
          </div>
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Live Webhook
          </span>
        </div>

        {/* Tab switcher inside hero preview */}
        <div className="mt-4 flex rounded-xl bg-zinc-950 p-1 border border-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              activeTab === 'overview' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              activeTab === 'received' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Received (+20.5K)
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              activeTab === 'sent' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sent (-17.0K)
          </button>
        </div>

        {/* Dynamic Metric Display based on activeTab */}
        <div className="mt-5 space-y-4">
          {/* Main 3 Metrics Row */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Current Balance */}
            <div className={`rounded-xl border p-3 transition ${activeTab === 'overview' ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/5 bg-zinc-950/60'}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Current Balance</p>
              <p className="mt-1 text-sm sm:text-base font-extrabold text-white tabular-nums">KES 19,750</p>
            </div>

            {/* Money Received */}
            <div className={`rounded-xl border p-3 transition ${activeTab === 'received' ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/5 bg-zinc-950/60'}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Money Received</p>
              <p className="mt-1 text-sm sm:text-base font-extrabold text-emerald-400 tabular-nums">+KES 20,500</p>
            </div>

            {/* Money Sent */}
            <div className={`rounded-xl border p-3 transition ${activeTab === 'sent' ? 'border-rose-500/40 bg-rose-500/10' : 'border-white/5 bg-zinc-950/60'}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-400">Money Sent</p>
              <p className="mt-1 text-sm sm:text-base font-extrabold text-rose-400 tabular-nums">-KES 17,000</p>
            </div>
          </div>

          {/* Sample Transaction Feed Preview */}
          <div className="rounded-xl border border-white/5 bg-zinc-950/70 p-3 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 pb-1 border-b border-white/5">
              <span>Recent Webhook Transactions</span>
              <span className="text-emerald-400">Auto-parsed</span>
            </div>

            {/* Item 1: Money Received */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded bg-emerald-500/20 text-emerald-400">
                  <ArrowDownLeft size={14} />
                </div>
                <div>
                  <p className="font-semibold text-white">ALICE WAMBUI</p>
                  <p className="text-[10px] text-zinc-400">QGH8912355 · Today 9:40 PM</p>
                </div>
              </div>
              <span className="font-bold text-emerald-400">+KES 3,500.00</span>
            </div>

            {/* Item 2: Money Sent */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded bg-rose-500/20 text-rose-400">
                  <ArrowUpRight size={14} />
                </div>
                <div>
                  <p className="font-semibold text-white">TOTAL PETROL STATION</p>
                  <p className="text-[10px] text-zinc-400">QGH8912354 · Today 9:05 PM</p>
                </div>
              </div>
              <span className="font-bold text-rose-400">-KES 1,100.00</span>
            </div>
          </div>

          {/* Alert pill */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400 flex-shrink-0" />
              Net positive cashflow of +KES 3,500 this period.
            </span>
            <Link href="/analysis" className="font-bold underline text-amber-200 hover:text-white">
              Analyze →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PerfectLandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased flex flex-col font-sans">
      <Topbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-6">
                  <Zap size={14} />
                  <span>SMS Webhook Integration Live</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white">
                  Know where every <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">shilling</span> goes.
                </h1>

                <p className="mt-6 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl">
                  Automate your financial analysis. Track <strong className="text-emerald-400 font-semibold">Money Received</strong>, <strong className="text-rose-400 font-semibold">Money Sent</strong>, and your exact <strong className="text-white font-semibold">M-Pesa Balance</strong> directly from your SMS webhook forwarding in real-time.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href="/analysis"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-base font-extrabold text-zinc-950 hover:bg-emerald-400 transition shadow-xl shadow-emerald-500/20"
                  >
                    <LineChart size={20} />
                    View Financial Analysis Demo
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-zinc-900 px-6 py-3.5 text-base font-bold text-white hover:bg-zinc-800 transition"
                  >
                    Get Started Free
                    <ArrowRight size={18} />
                  </Link>
                </div>

                <div className="mt-8 flex items-center gap-6 text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    No M-Pesa PIN required
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    Instant Webhook Parsing
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    100% Private
                  </span>
                </div>
              </div>

              {/* Live Dashboard Interactive Preview Widget */}
              <HeroDashboardPreview />
            </div>
          </div>
        </section>

        {/* CORE METRICS SPOTLIGHT SECTION (Money Received, Money Sent, Balance) */}
        <section className="border-y border-white/10 bg-zinc-900/50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                3 Key Metrics on One Screen
              </h2>
              <p className="mt-2 text-sm sm:text-base text-zinc-400">
                Never wonder where your money went. Every incoming SMS updates your metrics instantly.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Metric 1 */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 relative overflow-hidden group hover:border-emerald-500/40 transition">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 grid place-items-center mb-4 border border-emerald-500/20">
                  <ArrowDownLeft size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Money Received</h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Automatically group and sum up all incoming payments, peer transfers, salary, and business revenue. See your top senders ranked.
                </p>
                <div className="mt-4 pt-3 border-t border-white/5 text-emerald-400 font-extrabold text-sm">
                  +KES 20,500.00 logged this period
                </div>
              </div>

              {/* Metric 2 */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 relative overflow-hidden group hover:border-rose-500/40 transition">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 grid place-items-center mb-4 border border-rose-500/20">
                  <ArrowUpRight size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Money Sent</h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Track every outgoing shilling: Paybill payments, Till numbers, utilities, rent, and money sent to family or friends.
                </p>
                <div className="mt-4 pt-3 border-t border-white/5 text-rose-400 font-extrabold text-sm">
                  -KES 17,000.00 logged this period
                </div>
              </div>

              {/* Metric 3 */}
              <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-zinc-900 to-emerald-950/30 p-6 relative overflow-hidden group hover:border-emerald-500/60 transition">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 grid place-items-center mb-4 border border-emerald-500/30">
                  <Wallet size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Current M-Pesa Balance</h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Real-time running balance synced directly from official transaction SMS messages. Get alerts before your runway runs dry.
                </p>
                <div className="mt-4 pt-3 border-t border-white/10 text-white font-extrabold text-sm">
                  KES 19,750.00 live running balance
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PAIN POINTS */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-white">Does this sound familiar?</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {painPoints.map((quote) => (
                <div key={quote} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 text-sm italic text-zinc-300 leading-relaxed">
                  {quote}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-16 bg-zinc-900/30 border-y border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-extrabold text-white">Built for how Kenyans use money</h2>
              <p className="mt-2 text-zinc-400">M-Pesa first. Mobile first. Fast and effortless.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="rounded-2xl border border-white/10 bg-zinc-900 p-6 hover:border-emerald-500/30 transition">
                  <f.icon className="text-emerald-400" size={24} />
                  <h3 className="mt-4 font-bold text-lg text-white">{f.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-12">
              <h2 className="text-3xl font-extrabold text-white">How it works in 3 easy steps</h2>
              <p className="mt-2 text-zinc-400">Set up once in 2 minutes and let webhooks handle the rest.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.step} className="rounded-2xl border border-white/10 bg-zinc-900 p-6 relative">
                  <span className="text-sm font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Step {s.step}
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WEBHOOK TECHNICAL SPOTLIGHT */}
        <section className="py-16 border-y border-white/10 bg-zinc-900/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950/40 p-8 sm:p-12 grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 mb-4">
                  <Server size={14} />
                  <span>Developer & Forwarder Ready</span>
                </div>
                <h2 className="text-3xl font-extrabold text-white">
                  Ngrok & SMS Webhook Integration
                </h2>
                <p className="mt-4 text-zinc-300 text-sm sm:text-base leading-relaxed">
                  MfukoLens comes equipped with a high-performance SMS Webhook listener (`/api/webhook/sms`). Simply forward your device SMS notifications through ngrok or your preferred SMS forwarder app.
                </p>
                <div className="mt-6 space-y-2 text-xs font-mono bg-zinc-950 p-4 rounded-xl border border-white/10 text-emerald-300">
                  <p className="text-zinc-500">// Your active webhook endpoint:</p>
                  <p className="font-bold text-white">https://cuddle-perfume-dimness.ngrok-free.dev/api/webhook/sms</p>
                </div>
              </div>

              <div className="flex justify-center">
                <Link
                  href="/analysis"
                  className="inline-flex items-center gap-3 rounded-2xl bg-emerald-500 px-8 py-4 text-lg font-black text-zinc-950 hover:bg-emerald-400 transition shadow-2xl shadow-emerald-500/30"
                >
                  <LineChart size={24} />
                  Test Live Analysis Page
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PRIVACY GUARANTEE */}
        <section id="privacy" className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div>
                <ShieldCheck className="text-emerald-400" size={32} />
                <h2 className="mt-4 text-3xl font-extrabold text-white">Your Money Data Remains 100% Private</h2>
                <p className="mt-3 text-zinc-400 text-sm leading-relaxed">
                  We built MfukoLens with privacy first. Your data is encrypted and accessible only to you.
                </p>
              </div>
              <ul className="space-y-3 text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" /> We NEVER ask for your M-Pesa PIN or Safaricom password.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" /> Only you can view your transactions & analysis.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" /> Export or delete your data at any time with one click.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" /> No ads, no selling data to third parties.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/15 via-zinc-900 to-zinc-950 p-10 text-center relative overflow-hidden">
              <h2 className="text-3xl sm:text-4xl font-black text-white">Stop guessing. Start seeing.</h2>
              <p className="mt-3 text-zinc-300 max-w-lg mx-auto text-sm sm:text-base">
                View your live financial analysis right now with our interactive simulation engine.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href="/analysis"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-base font-extrabold text-zinc-950 hover:bg-emerald-400 transition"
                >
                  Open Financial Analysis Dashboard <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}