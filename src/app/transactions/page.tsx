'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Sale, SaleItem } from '@/types';
import * as XLSX from 'xlsx';

function exportTransactionsXLSX(sales: Sale[]) {
  const rows = [
    ['Receipt No', 'Date', 'Time', 'Payment', 'Items', 'Total (RM)'],
    ...sales.map(s => [
      s.receipt_no ?? '',
      new Date(s.created_at).toLocaleDateString('en-MY'),
      new Date(s.created_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }),
      s.payment_method === 'ewallet' ? 'e-Wallet' : 'Cash',
      s.items?.map(i => `${i.item_name} x${i.quantity}`).join(', ') ?? '',
      s.total,
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `transactions-${date}.xlsx`);
}

const fmt = (n: number) => n.toFixed(2);
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });

/* ── Reprint helper ─────────────────────────────────── */
function reprintSale(sale: Sale) {
  if (!sale.items?.length) return;
  const dt = new Date(sale.created_at);
  const dateStr = fmtDate(sale.created_at);
  const timeStr = fmtTime(sale.created_at);
  const itemRows = sale.items
    .map(
      (si: SaleItem) =>
        `<div class="row"><span>${si.item_name} x${si.quantity}</span><span>RM${(si.item_price * si.quantity).toFixed(2)}</span></div>`,
    )
    .join('');
  const receiptNo = sale.receipt_no ?? '—';
  const isEwallet = sale.payment_method === 'ewallet';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${receiptNo}</title>
<style>
  body{font-family:monospace;font-size:14px;padding:24px;max-width:320px;margin:0 auto}
  .center{text-align:center} .bold{font-weight:bold}
  .row{display:flex;justify-content:space-between;margin:5px 0}
  .divider{border:none;border-top:2px dashed #aaa;margin:10px 0}
  .big{font-size:16px;font-weight:bold} .muted{color:#666} .green{color:#059669;font-weight:bold}
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
  ${isEwallet
    ? `<div class="row" style="color:#2563eb"><span>e-Wallet</span><span>RM${fmt(sale.total)}</span></div>`
    : `<div class="row muted"><span>Cash Paid</span><span>RM${sale.amount_paid != null ? fmt(sale.amount_paid) : '—'}</span></div>
       <div class="row green"><span>Change</span><span>RM${sale.change_amount != null ? fmt(sale.change_amount) : '—'}</span></div>`
  }
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

/* ── Transaction row ─────────────────────────────────── */
function TxRow({
  sale,
  onDelete,
}: {
  sale: Sale;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <li className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-slate-400 hover:text-slate-600 transition flex-shrink-0"
          aria-label="Toggle items"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {sale.receipt_no && (
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {sale.receipt_no}
              </span>
            )}
            {sale.payment_method && (
              <span
                className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                  sale.payment_method === 'ewallet'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {sale.payment_method === 'ewallet' ? 'e-Wallet' : 'Cash'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
            <span className="tabular-nums">{fmtDate(sale.created_at)}</span>
            <span className="tabular-nums">{fmtTime(sale.created_at)}</span>
            <span>
              {sale.item_count} item{sale.item_count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Total */}
        <span className="font-bold text-emerald-700 tabular-nums text-sm whitespace-nowrap">
          RM{fmt(sale.total)}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Reprint */}
          <button
            onClick={() => reprintSale(sale)}
            title="Reprint receipt"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-500 transition"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M5 4v3H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2h1a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1Zm2 0h6v3H7V4Zm-1 9v-1h8v1a.5.5 0 0 1-.5.5h-7A.5.5 0 0 1 6 13Zm7-5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Delete */}
          {confirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDelete(sale.id)}
                className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-lg font-medium transition"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirm(false)}
                className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded-lg font-medium transition"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              title="Delete transaction"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 transition"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded items */}
      {expanded && sale.items && (
        <ul className="px-5 pb-3 pt-1 space-y-1 bg-slate-50 border-t border-slate-100">
          {sale.items.map((si: SaleItem, i: number) => (
            <li key={i} className="flex justify-between text-xs text-slate-600 py-0.5">
              <span>
                {si.item_name} × {si.quantity}
              </span>
              <span className="tabular-nums font-mono">
                RM{(si.item_price * si.quantity).toFixed(2)}
              </span>
            </li>
          ))}
          <li className="flex justify-between text-xs font-bold text-slate-700 border-t border-slate-200 pt-1 mt-1">
            <span>Total</span>
            <span className="tabular-nums font-mono">RM{fmt(sale.total)}</span>
          </li>
        </ul>
      )}
    </li>
  );
}

/* ── Transactions page ──────────────────────────────── */
export default function TransactionsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const loadSales = useCallback(async () => {
    try {
      setError(null);
      const url = dateFilter ? `/api/sales?date=${dateFilter}` : '/api/sales';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load transactions');
      setSales(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    setLoading(true);
    loadSales();
  }, [loadSales]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/sales/${id}`, { method: 'DELETE' });
      setSales(prev => prev.filter(s => s.id !== id));
    } catch {
      alert('Failed to delete transaction');
    }
  };

  const filtered = sales.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.receipt_no ?? '').toLowerCase().includes(q) ||
      (s.payment_method ?? '').toLowerCase().includes(q)
    );
  });

  const totalRevenue = filtered.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">🌿</span>
          <div>
            <h1 className="text-xl font-bold leading-tight">Transactions</h1>
            <p className="text-xs text-white/70">All receipt records</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSales}
            title="Refresh"
            className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.389Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {!loading && filtered.length > 0 && (
            <button
              onClick={() => exportTransactionsXLSX(filtered)}
              title="Export Excel"
              className="text-sm bg-white/20 hover:bg-white/30 px-2.5 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm4.75 6.75a.75.75 0 0 1 1.5 0v2.546l.943-1.048a.75.75 0 1 1 1.114 1.004l-2.25 2.5a.75.75 0 0 1-1.114 0l-2.25-2.5a.75.75 0 1 1 1.114-1.004l.943 1.048V8.75Z" clipRule="evenodd" /></svg>
              XLSX
            </button>
          )}
          <Link
            href="/"
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M1 1.75A.75.75 0 0 1 1.75 1h1.628a1.75 1.75 0 0 1 1.734 1.51L5.18 3a65.25 65.25 0 0 1 13.36 1.412.75.75 0 0 1 .58.875 48.645 48.645 0 0 1-1.618 6.2.75.75 0 0 1-.712.513H6a2.5 2.5 0 0 0-2.5 2.5v.75H14.25a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75V7.5a.75.75 0 0 1 .75-.75h.5l-.276-1.596A.25.25 0 0 0 3.977 5H1.75A.75.75 0 0 1 1 4.25v-2.5ZM6 16.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6.5 1a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z" />
            </svg>
            POS
          </Link>
          <Link
            href="/dashboard"
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M12 9a1 1 0 0 1-1-1V3c0-.552.45-1.007.997-.93a7.004 7.004 0 0 1 5.933 5.933c.077.547-.378.997-.93.997h-5ZM8.5 4.034C8.5 3.482 8.053 3.031 7.504 3.1a7.001 7.001 0 0 0-5.404 9.252c.178.458.66.648 1.103.498l4.803-1.616a1 1 0 0 0 .644-.943V4.034ZM6.988 12.986A1 1 0 0 0 6 14c0 .552.449 1.008.997.934a7.009 7.009 0 0 0 4.52-2.783.951.951 0 0 0-.172-1.29l-3.695-3.076-.662 5.2Z" />
            </svg>
            Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              placeholder="Search receipt no. or payment method…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-emerald-400 transition"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-emerald-400 transition"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-500 hover:bg-slate-50 transition"
            >
              Clear date
            </button>
          )}
        </div>

        {/* Summary bar */}
        {!loading && !error && (
          <div className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-4 py-3 shadow-sm text-sm">
            <span className="text-slate-500">
              {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
              {dateFilter ? ` on ${fmtDate(dateFilter + 'T00:00:00')}` : ''}
            </span>
            <span className="font-bold text-emerald-700 tabular-nums">
              Total: RM{totalRevenue.toFixed(2)}
            </span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <svg
              className="animate-spin w-5 h-5 text-emerald-500 mr-3"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading…
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm flex items-center gap-2">
            ⚠️ {error} —{' '}
            <button onClick={loadSales} className="underline font-medium">
              retry
            </button>
          </div>
        )}

        {/* List */}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-sm">No transactions found.</div>
            ) : (
              <ul className="space-y-2">
                {filtered.map(sale => (
                  <TxRow key={sale.id} sale={sale} onDelete={handleDelete} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
