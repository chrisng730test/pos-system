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

/* ── Receipt reprint ─────────────────────────────────── */
function reprintSale(sale: Sale) {
  if (!sale.items?.length) return;
  const dt = new Date(sale.created_at);
  const dateStr = dt.toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = dt.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
  const itemRows = sale.items
    .map(si => `<div class="row"><span>${si.item_name} x${si.quantity}</span><span>RM${(si.item_price * si.quantity).toFixed(2)}</span></div>`)
    .join('');
  const receiptNo = sale.receipt_no ?? '—';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${receiptNo}</title>
<style>
  body{font-family:monospace;font-size:14px;padding:24px;max-width:320px;margin:0 auto}
  .center{text-align:center} .bold{font-weight:bold}
  .row{display:flex;justify-content:space-between;margin:5px 0}
  .divider{border:none;border-top:2px dashed #aaa;margin:10px 0}
  .big{font-size:16px;font-weight:bold} .muted{color:#666}
  .tag{display:inline-block;background:#f1f5f9;padding:2px 10px;border-radius:999px;font-size:12px}
</style></head><body>
  <div class="center">
    <div class="bold" style="font-size:20px">ZYN POS</div>
    <div class="muted" style="font-size:12px;margin-top:4px">${dateStr} &middot; ${timeStr}</div>
    <div class="tag" style="margin-top:6px">${receiptNo}</div>
  </div>
  <hr class="divider">
  ${itemRows}
  <hr class="divider">
  <div class="row big"><span>TOTAL</span><span>RM${fmt(sale.total)}</span></div>
  <hr class="divider">
  <div class="center muted" style="font-size:12px">Thank you! Please come again.</div>
</body></html>`;
  const win = window.open('', '_blank', 'width=420,height=620');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.onafterprint = () => win.close();
  setTimeout(() => win.print(), 400);
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
                  {sale.receipt_no && (
                    <span className="text-xs font-mono text-slate-400">{sale.receipt_no}</span>
                  )}
                  {sale.payment_method && (
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                      sale.payment_method === 'ewallet'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {sale.payment_method === 'ewallet' ? 'e-Wallet' : 'Cash'}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {new Date(sale.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-700">RM{fmt(sale.total)}</span>
                  <span className="text-slate-300">
                    {expanded === sale.id ? (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.5a.75.75 0 1 1-1.08 1.06L10 8.06l-3.7 3.97a.75.75 0 0 1-1.08-1.06l4.25-4.5Z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
                    )}
                  </span>
                </div>
              </button>
              {/* Reprint + Delete controls */}
              <button
                onClick={() => reprintSale(sale)}
                className="mr-1 text-slate-400 hover:text-emerald-600 transition bg-slate-100 hover:bg-emerald-50 rounded-lg p-1.5"
                title="Reprint receipt"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0 1 18 8.653v4.097A2.25 2.25 0 0 1 15.75 15h-.241l.305 1.984A1.75 1.75 0 0 1 14.084 19H5.915a1.75 1.75 0 0 1-1.73-2.016L4.492 15H4.25A2.25 2.25 0 0 1 2 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.75-.107 1.126-.153V2.75Zm8.5 0v3.301a49.344 49.344 0 0 0-7 0V2.75a.25.25 0 0 1 .25-.25h6.5a.25.25 0 0 1 .25.25ZM5.5 13.3l-.652 4.229a.25.25 0 0 0 .247.221h9.81a.25.25 0 0 0 .247-.221L14.5 13.3a49.453 49.453 0 0 0-9 0Zm7-2.55a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 0 1.5H13.25a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" /></svg>
              </button>
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
                  className="mr-3 text-slate-300 hover:text-red-400 transition rounded-lg p-1.5 hover:bg-red-50"
                  title="Delete transaction"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
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

  const loadStats = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null);
      const res = await fetch('/api/stats', { signal });
      if (!res.ok) throw new Error('Failed to load stats');
      setStats(await res.json());
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadStats(controller.signal);
    const id = setInterval(() => loadStats(controller.signal), 30_000);
    return () => {
      controller.abort();
      clearInterval(id);
    };
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
            onClick={() => loadStats()}
            title="Refresh"
            className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.389Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" /></svg>
          </button>
          <Link
            href="/"
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M1 1.75A.75.75 0 0 1 1.75 1h1.628a1.75 1.75 0 0 1 1.734 1.51L5.18 3a65.25 65.25 0 0 1 13.36 1.412.75.75 0 0 1 .58.875 48.645 48.645 0 0 1-1.618 6.2.75.75 0 0 1-.712.513H6a2.5 2.5 0 0 0-2.5 2.5v.75H14.25a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75V7.5a.75.75 0 0 1 .75-.75h.5l-.276-1.596A.25.25 0 0 0 3.977 5H1.75A.75.75 0 0 1 1 4.25v-2.5ZM6 16.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6.5 1a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z" /></svg>
            POS
          </Link>
          <Link
            href="/transactions"
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Zm0 6a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H4Zm-1 7a1 1 0 0 1 1-1h12a1 1 0 0 1 0 2H4a1 1 0 0 1-1-1Z" clipRule="evenodd" /></svg>
            Transactions
          </Link>
          <Link
            href="/admin"
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.34 1.804A1 1 0 0 1 9.32 1h1.36a1 1 0 0 1 .98.804l.295 1.473c.497.144.971.342 1.422.587l1.25-.834a1 1 0 0 1 1.262.125l.962.962a1 1 0 0 1 .125 1.262l-.834 1.25c.245.45.443.925.587 1.422l1.473.294a1 1 0 0 1 .804.98v1.361a1 1 0 0 1-.804.98l-1.473.295a6.95 6.95 0 0 1-.587 1.422l.834 1.25a1 1 0 0 1-.125 1.262l-.962.962a1 1 0 0 1-1.262.125l-1.25-.834a6.953 6.953 0 0 1-1.422.587l-.294 1.473a1 1 0 0 1-.98.804H9.32a1 1 0 0 1-.98-.804l-.295-1.473a6.957 6.957 0 0 1-1.422-.587l-1.25.834a1 1 0 0 1-1.262-.125l-.962-.962a1 1 0 0 1-.125-1.262l.834-1.25a6.957 6.957 0 0 1-.587-1.422L1.804 11.32A1 1 0 0 1 1 10.34V8.98a1 1 0 0 1 .804-.98l1.473-.295c.144-.497.342-.971.587-1.422l-.834-1.25a1 1 0 0 1 .125-1.262l.962-.962A1 1 0 0 1 5.38 2.684l1.25.834a6.957 6.957 0 0 1 1.422-.587l.289-1.127ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" /></svg>
            Items
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Loading / Error states */}
        {loading && (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <svg className="animate-spin w-5 h-5 text-emerald-500 mr-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg> Loading…
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm flex items-center gap-2">
            ⚠️ {error} —{' '}
            <button onClick={() => loadStats()} className="underline font-medium">
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
