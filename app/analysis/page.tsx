'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Topbar from '@/app/components/Topbar';
import Footer from '@/app/components/Footer';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function FinancialAnalysisPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'receive' | 'send'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch transactions from backend
  const fetchTransactions = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/webhook/sms');
      const data = await res.json();
      if (data.transactions && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Poll for incoming SMS messages
  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 3000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  // Compute key financial metrics dynamically from live transactions
  const metrics = useMemo(() => {
    let moneyReceived = 0;
    let moneySent = 0;
    let countReceived = 0;
    let countSent = 0;

    const senderMap: Record<string, number> = {};
    const payeeMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.type === 'receive') {
        moneyReceived += tx.amount;
        countReceived++;
        senderMap[tx.sender] = (senderMap[tx.sender] || 0) + tx.amount;
      } else if (tx.type === 'send') {
        moneySent += tx.amount;
        countSent++;
        payeeMap[tx.sender] = (payeeMap[tx.sender] || 0) + tx.amount;
        categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
      }
    });

    const currentBalance = transactions.length > 0 ? transactions[0].balanceAfter : 0;
    const netCashflow = moneyReceived - moneySent;

    const topSenderEntry = Object.entries(senderMap).sort((a, b) => b[1] - a[1])[0] || ['None', 0];
    const topPayeeEntry = Object.entries(payeeMap).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    return {
      currentBalance,
      moneyReceived,
      moneySent,
      netCashflow,
      countReceived,
      countSent,
      topSender: { name: topSenderEntry[0], amount: topSenderEntry[1] },
      topPayee: { name: topPayeeEntry[0], amount: topPayeeEntry[1] },
      categoryBreakdown: Object.entries(categoryMap)
        .map(([name, amount]) => ({ name, amount, percentage: Math.round((amount / (moneySent || 1)) * 100) }))
        .sort((a, b) => b.amount - a.amount),
    };
  }, [transactions]);

  // Filtered transactions for the live list
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesTab = activeTab === 'all' || tx.type === activeTab;
      const matchesSearch =
        (tx.sender || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.message || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [transactions, activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased flex flex-col font-sans">
      <Topbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Financial Analysis & Cashflow
            </h1>
            <p className="mt-1 text-sm sm:text-base text-zinc-400">
              Live intelligence on Money Received, Money Sent, and Current M-Pesa Balance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTransactions}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition"
              title="Refresh transactions"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-emerald-400' : ''} />
              Sync Feed
            </button>
          </div>
        </div>

        {/* PRIMARY FINANCIAL KPI CARDS (Current Balance, Money Received, Money Sent) */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Current M-Pesa Balance */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-emerald-950/40 p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Current M-Pesa Balance
                </p>
                <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white tabular-nums">
                  KES {metrics.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h2>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Wallet size={24} />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
              <span className="text-zinc-400">Net Cashflow this period:</span>
              <span className={`font-bold ${metrics.netCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.netCashflow >= 0 ? '+' : ''}KES {metrics.netCashflow.toLocaleString('en-US')}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
              <AlertCircle size={14} />
              <span>≈ 14 days estimated budget runway remaining</span>
            </div>
          </div>

          {/* Card 2: Money Received */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-xl transition hover:border-emerald-500/40">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Total Money Received
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-400 tabular-nums">
                  +KES {metrics.moneyReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h2>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ArrowDownLeft size={24} />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
              <span className="text-zinc-400">Received Transactions:</span>
              <span className="font-bold text-white">{metrics.countReceived} payments</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Top Sender:</span>
              <span className="font-semibold text-emerald-300 truncate max-w-[160px]">
                {metrics.topSender.name} (KES {metrics.topSender.amount.toLocaleString()})
              </span>
            </div>
          </div>

          {/* Card 3: Money Sent */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-xl transition hover:border-rose-500/40 sm:col-span-2 lg:col-span-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Total Money Sent
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-rose-400 tabular-nums">
                  -KES {metrics.moneySent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h2>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <ArrowUpRight size={24} />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
              <span className="text-zinc-400">Outflow Transactions:</span>
              <span className="font-bold text-white">{metrics.countSent} payments</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Top Spending Destination:</span>
              <span className="font-semibold text-rose-300 truncate max-w-[160px]">
                {metrics.topPayee.name} (KES {metrics.topPayee.amount.toLocaleString()})
              </span>
            </div>
          </div>
        </div>

        {/* ANALYTICS GRID: CATEGORY BREAKDOWN & HIGHLIGHTS */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Outflow Category Breakdown */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-xl lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg text-white">Outflow Category Analysis</h3>
                <p className="text-xs text-zinc-400">Where your money goes when you send or pay</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
                {metrics.categoryBreakdown.length} Categories
              </span>
            </div>

            <div className="space-y-4">
              {metrics.categoryBreakdown.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-4">No outflow categories recorded yet.</p>
              ) : (
                metrics.categoryBreakdown.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-200">{cat.name}</span>
                      <span className="text-zinc-400">
                        KES {cat.amount.toLocaleString()} <span className="text-zinc-500">({cat.percentage}%)</span>
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Financial Insight Banner */}
            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-200">Financial Insight:</p>
                <p className="mt-0.5 text-amber-300/90 leading-relaxed">
                  Net cashflow is <strong className="text-white">{metrics.netCashflow >= 0 ? '+' : ''}KES {metrics.netCashflow.toLocaleString()}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Cashflow Highlights */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-white mb-4">Cashflow Highlights</h3>

              {/* Highest Money Received */}
              <div className="rounded-xl bg-zinc-950 border border-emerald-500/20 p-4 mb-4">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-1">
                  <ArrowDownLeft size={14} />
                  Top Inflow Source
                </div>
                <p className="font-bold text-white text-base">{metrics.topSender.name}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Received <span className="text-emerald-400 font-semibold">KES {metrics.topSender.amount.toLocaleString()}</span>
                </p>
              </div>

              {/* Highest Money Sent */}
              <div className="rounded-xl bg-zinc-950 border border-rose-500/20 p-4">
                <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold mb-1">
                  <ArrowUpRight size={14} />
                  Top Outflow Destination
                </div>
                <p className="font-bold text-white text-base">{metrics.topPayee.name}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Paid <span className="text-rose-400 font-semibold">KES {metrics.topPayee.amount.toLocaleString()}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TRANSACTIONS LOG */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xl text-white">Parsed Transactions</h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                SMS messages forwarded to your webhook are automatically parsed and displayed below.
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Tab Pills */}
              <div className="flex items-center rounded-xl bg-zinc-950 p-1 border border-white/10 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'all' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All ({transactions.length})
                </button>
                <button
                  onClick={() => setActiveTab('receive')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'receive' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Received ({metrics.countReceived})
                </button>
                <button
                  onClick={() => setActiveTab('send')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'send' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Sent ({metrics.countSent})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search sender, code, merchant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl bg-zinc-950 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none w-48 sm:w-60"
                />
              </div>
            </div>
          </div>

          {/* Transactions Table/List */}
          <div className="divide-y divide-white/5 border-t border-white/10">
            {loading ? (
              <div className="py-12 text-center text-sm text-zinc-400 flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin text-emerald-400" />
                Loading transactions...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-500">
                No matching transactions found.
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div key={tx.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/40 px-2 rounded-xl transition">
                  <div className="flex items-start gap-3.5">
                    {/* Icon indicator */}
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-xl flex-shrink-0 mt-0.5 ${
                        tx.type === 'receive'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : tx.type === 'balance'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {tx.type === 'receive' ? (
                        <ArrowDownLeft size={20} />
                      ) : tx.type === 'balance' ? (
                        <Wallet size={20} />
                      ) : (
                        <ArrowUpRight size={20} />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm sm:text-base">{tx.sender}</span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          {tx.id}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          tx.type === 'balance' ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' : 'bg-zinc-800/70 text-zinc-400'
                        }`}>
                          {tx.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{tx.message}</p>
                      <span className="text-[11px] text-zinc-500">{tx.dateStr || new Date(tx.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Amount & Running Balance */}
                  <div className="sm:text-right flex sm:flex-col justify-between items-end">
                    <span
                      className={`text-base sm:text-lg font-extrabold tabular-nums ${
                        tx.type === 'receive'
                          ? 'text-emerald-400'
                          : tx.type === 'balance'
                          ? 'text-blue-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'receive' ? '+' : tx.type === 'balance' ? 'ℹ Bal: ' : '-'}KES {(tx.type === 'balance' ? tx.balanceAfter : tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      Bal: KES {tx.balanceAfter.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
