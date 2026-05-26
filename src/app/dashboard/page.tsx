'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { StatsResponse, DayStats, TopItem, Sale, SaleItem } from '@/types';

/* ── Helpers ─────────────────────────────────────────── */
function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtShortDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/* ── Stat card ───────────────────────────────────────── */
function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col gap-1`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

/* ── Bar chart (pure CSS/SVG) ────────────────────────── */
function WeekChart({ days }: { days: DayStats[] }) {
  const max = Math.max(...days.map(d => d.revenue), 0.01);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Revenue — Last 7 Days</h3>
      <div className="flex items-end gap-2 h-36">
        {days.map(day => {
          const pct = (day.revenue / max) * 100;
          const isToday = day.date === new Date().toISOString().slice(0, 10);
          return (
            <div key={day.date} className="flex flex-col items-center flex-1 gap-1 min-w-0">
              <span className="text-[10px] text-slate-500 font-medium tabular-nums truncate w-full text-center">
                RM{day.revenue > 0 ? fmt(day.revenue) : '0'}
              </span>
              <div className="w-full flex items-end" style={{ height: '80px' }}>
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    isToday ? 'bg-emerald-500' : 'bg-emerald-200'
                  }`}
                  style={{ height: `${Math.max(pct, day.revenue > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span
                className={`text-[10px] font-medium truncate w-full text-center ${
                  isToday ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {fmtShortDate(day.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Top items table ─────────────────────────────────── */
function TopItemsTable({ items }: { items: TopItem[] }) {
  if (items.length === 0)
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-slate-700">Top Items (last 30 days)</h3>
        <p className="text-sm text-slate-400 py-4 text-center">No sales data yet</p>
      </div>
    );

  const maxQty = Math.max(...items.map(i => i.quantity));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Items (last 30 days)</h3>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={item.item_name} className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 w-4 shrink-0">{idx + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-slate-800 truncate">{item.item_name}</span>
                <span className="text-xs text-slate-500 shrink-0 ml-2">
                  {item.quantity} sold · RM{fmt(item.revenue)}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${(item.quantity / maxQty) * 100}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Recent transactions ─────────────────────────────── */
function RecentSales({ sales, onDelete }: { sales: Sale[]; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/sales/${id}`, { method: 'DELETE' });
      onDelete(id);
    } finally {
      setDeleting(null);
      setConfirming(null);
    }
  }

  if (sales.length === 0)
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Recent Transactions</h3>
        <p className="text-sm text-slate-400 py-4 text-center">No transactions yet</p>
      </div>
    );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">Recent Transactions</h3>
      </div>
      <ul className="divide-y divide-slate-100">
        {sales.map(sale => (
          <li key={sale.id}>
            <div className="flex items-center hover:bg-slate-50 transition">
              <button
                onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                className="flex-1 flex items-center justify-between px-5 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 tabular-nums">
                    {fmtTime(sale.created_at)}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-medium">
                    {sale.item_count} item{sale.item_count !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(sale.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-700">RM{fmt(sale.total)}</span>
                  <span className="text-slate-300 text-xs">{expanded === sale.id ? '▲' : '▼'}</span>
                </div>
              </button>
              {/* Delete controls */}
              {confirming === sale.id ? (
                <div className="flex items-center gap-1 pr-3">
                  <span className="text-xs text-slate-500 mr-1">Delete?</span>
                  <button
                    onClick={() => handleDelete(sale.id)}
                    disabled={deleting === sale.id}
                    className="text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded px-2 py-1 font-medium transition"
                  >
                    {deleting === sale.id ? '…' : 'Yes'}
                  </button>
                  <button
                    onClick={() => setConfirming(null)}
                    className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 rounded px-2 py-1 font-medium transition"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(sale.id)}
                  className="mr-3 text-slate-300 hover:text-red-400 transition text-base leading-none"
                  title="Delete transaction"
                >
                  ✕
                </button>
              )}
            </div>
            {expanded === sale.id && sale.items && (
              <ul className="px-5 pb-3 space-y-1 bg-slate-50">
                {sale.items.map((si: SaleItem, i: number) => (
                  <li key={i} className="flex justify-between text-xs text-slate-600">
                    <span>
                      {si.item_name} × {si.quantity}
                    </span>
                    <span className="tabular-nums">RM{fmt(si.item_price * si.quantity)}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Dashboard page ──────────────────────────────────── */
export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      setStats(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    // Auto-refresh every 30 s
    const id = setInterval(loadStats, 30_000);
    return () => clearInterval(id);
  }, [loadStats]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">🌿</span>
          <div>
            <h1 className="text-xl font-bold leading-tight">Dashboard</h1>
            <p className="text-xs text-white/70">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadStats}
            title="Refresh"
            className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition"
          >
            🔄
          </button>
          <Link
            href="/"
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition font-medium"
          >
            🛒 POS
          </Link>
          <Link
            href="/admin"
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition font-medium"
          >
            ⚙ Items
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Loading / Error states */}
        {loading && (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <span className="animate-spin text-2xl mr-3">⏳</span> Loading…
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm flex items-center gap-2">
            ⚠️ {error} —{' '}
            <button onClick={loadStats} className="underline font-medium">
              retry
            </button>
          </div>
        )}

        {stats && (
          <>
            {/* ── Summary cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Today's Revenue"
                value={`RM${fmt(stats.today.revenue)}`}
                sub={`${stats.today.transactions} transaction${stats.today.transactions !== 1 ? 's' : ''}`}
                accent="text-emerald-600"
              />
              <StatCard
                label="Items Sold Today"
                value={String(stats.today.items_sold)}
                sub="units"
                accent="text-teal-600"
              />
              <StatCard
                label="Week Revenue"
                value={`RM${fmt(stats.week.reduce((s, d) => s + d.revenue, 0))}`}
                sub="last 7 days"
                accent="text-emerald-600"
              />
              <StatCard
                label="Week Transactions"
                value={String(stats.week.reduce((s, d) => s + d.transactions, 0))}
                sub="last 7 days"
                accent="text-teal-600"
              />
            </div>

            {/* ── Week chart ── */}
            <WeekChart days={stats.week} />

            {/* ── Bottom grid: top items + recent sales ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TopItemsTable items={stats.topItems} />
              <RecentSales sales={stats.recentSales} onDelete={() => loadStats()} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
