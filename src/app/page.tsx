'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useItems } from '@/hooks/useItems';
import { useCart } from '@/hooks/useCart';
import { CartItem, MenuItem } from '@/types';

interface ReceiptData {
  receiptNo: string;
  createdAt: string;
  items: CartItem[];
  total: number;
  paid: number;
  change: number;
  paymentMethod: string;
}

interface CartContentProps {
  cart: CartItem[];
  total: number;
  itemCount: number;
  onAdd: (item: MenuItem) => void;
  onDecrease: (id: string) => void;
  onSetQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCharge: () => void;
  onClose?: () => void;
}

function CartContent({
  cart,
  total,
  itemCount,
  onAdd,
  onDecrease,
  onSetQuantity,
  onRemove,
  onClear,
  onCharge,
  onClose,
}: CartContentProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Cart header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
        <h2 className="font-bold text-lg text-gray-800">Cart</h2>
        <div className="flex items-center gap-2">
          {itemCount > 0 && (
            <button
              onClick={onClear}
              className="text-sm text-red-500 hover:text-red-700 transition"
            >
              Clear all
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close cart"
              className="text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-gray-400">
            <span className="text-5xl mb-3">🛒</span>
            <p className="font-medium">Cart is empty</p>
            <p className="text-sm mt-1">Tap items to add</p>
          </div>
        ) : (
          <ul className="divide-y">
            {cart.map(({ item, quantity }) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-800 truncate">{item.name}</div>
                  <div className="text-xs text-gray-500">RM{item.price.toFixed(2)} each</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDecrease(item.id)}
                    aria-label={`Decrease ${item.name}`}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center font-bold text-gray-600 transition"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) onSetQuantity(item.id, v);
                    }}
                    onFocus={e => e.target.select()}
                    onBlur={e => { if (!e.target.value || parseInt(e.target.value) < 1) onRemove(item.id); }}
                    className="w-10 text-center font-semibold text-sm border border-slate-200 rounded-md focus:outline-none focus:border-emerald-400 py-0.5"
                  />
                  <button
                    onClick={() => onAdd(item)}
                    aria-label={`Increase ${item.name}`}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-emerald-100 hover:text-emerald-600 flex items-center justify-center font-bold text-gray-600 transition"
                  >
                    +
                  </button>
                </div>
                <div className="text-right min-w-[52px]">
                  <div className="font-semibold text-sm text-gray-800">
                    RM{(item.price * quantity).toFixed(2)}
                  </div>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition"
                  >
                    remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Total + Charge */}
      <div className="border-t p-4 flex-shrink-0 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 font-medium">Total</span>
          <span className="text-2xl font-bold text-gray-900">RM{total.toFixed(2)}</span>
        </div>
        <button
            onClick={onCharge}
            disabled={cart.length === 0}
            className="w-full bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-semibold hover:bg-emerald-700 active:bg-emerald-800 transition text-lg shadow-lg shadow-emerald-200 disabled:shadow-none"
          >
            Charge RM{total.toFixed(2)}
          </button>
      </div>
    </div>
  );
}

/* ── Payment Modal ──────────────────────────────────── */
function PaymentModal({
  total,
  onConfirm,
  onCancel,
}: {
  total: number;
  onConfirm: (paid: number, paymentMethod: string) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<'method' | 'cash' | 'ewallet'>('method');
  const [tendered, setTendered] = useState('');

  const paid = parseFloat(tendered) || 0;
  const change = paid - total;
  const valid = paid >= total;

  const suggestions = Array.from(
    new Set([total, Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, 50, 100]),
  )
    .filter(v => v >= total)
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 rounded-t-2xl">
          <h2 className="text-white text-xl font-bold">Payment</h2>
          <p className="text-emerald-100 text-sm mt-0.5">
            {step === 'method' && 'Select payment method'}
            {step === 'cash' && 'Enter cash received'}
            {step === 'ewallet' && 'Confirm e-Wallet payment'}
          </p>
        </div>

        {/* Step: method selection */}
        {step === 'method' && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Amount Due</span>
              <span className="text-2xl font-bold text-slate-900">RM{total.toFixed(2)}</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Choose payment method:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStep('cash')}
                className="flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition"
              >
                <span className="text-3xl">💵</span>
                <span className="font-bold text-slate-700">Cash</span>
              </button>
              <button
                onClick={() => setStep('ewallet')}
                className="flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition"
              >
                <span className="text-3xl">📱</span>
                <span className="font-bold text-slate-700">e-Wallet</span>
              </button>
            </div>
            <button
              onClick={onCancel}
              className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Step: cash */}
        {step === 'cash' && (
          <div className="p-6 space-y-5">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Amount Due</span>
              <span className="text-2xl font-bold text-slate-900">RM{total.toFixed(2)}</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Cash Received (RM)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={tendered}
                onChange={e => setTendered(e.target.value)}
                placeholder={total.toFixed(2)}
                autoFocus
                className="w-full border-2 border-slate-200 focus:border-emerald-400 rounded-xl px-4 py-3 text-2xl font-bold text-right text-slate-900 focus:outline-none transition"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {suggestions.map(amt => (
                <button
                  key={amt}
                  onClick={() => setTendered(amt.toFixed(2))}
                  className={`py-2.5 rounded-xl text-sm font-bold border-2 transition ${
                    parseFloat(tendered) === amt
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700'
                  }`}
                >
                  {Number.isInteger(amt) ? amt : amt.toFixed(2)}
                </button>
              ))}
            </div>
            <div
              className={`flex justify-between items-center px-4 py-3.5 rounded-xl border-2 transition ${
                valid ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <span className={`font-bold text-base ${valid ? 'text-emerald-700' : 'text-slate-400'}`}>
                Change
              </span>
              <span className={`text-2xl font-bold ${valid ? 'text-emerald-700' : 'text-slate-300'}`}>
                {valid ? `RM${change.toFixed(2)}` : '—'}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('method')}
                className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
              >
                ← Back
              </button>
              <button
                onClick={() => valid && onConfirm(paid, 'cash')}
                disabled={!valid}
                className="flex-[2] py-3.5 rounded-xl bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-base hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 disabled:shadow-none"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        )}

        {/* Step: ewallet */}
        {step === 'ewallet' && (
          <div className="p-6 space-y-5">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Amount Due</span>
              <span className="text-2xl font-bold text-slate-900">RM{total.toFixed(2)}</span>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-5 py-4 text-center space-y-2">
              <p className="text-blue-800 font-bold text-base">⚠️ Staff Check Required</p>
              <p className="text-blue-700 text-sm">
                Please ensure{' '}
                <span className="font-bold">RM{total.toFixed(2)}</span>{' '}
                has been received in the e-Wallet app before confirming.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('method')}
                className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
              >
                ← Back
              </button>
              <button
                onClick={() => onConfirm(total, 'ewallet')}
                className="flex-[2] py-3.5 rounded-xl bg-blue-600 text-white font-bold text-base hover:bg-blue-700 transition shadow-lg shadow-blue-200"
              >
                Payment Received ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Receipt print helper ───────────────────────────── */
function printReceipt(data: ReceiptData) {
  const dt = new Date(data.createdAt);
  const dateStr = dt.toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = dt.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });

  const itemRows = data.items
    .map(
      ({ item, quantity }) =>
        `<div class="row"><span>${item.name} x${quantity}</span><span>RM${(item.price * quantity).toFixed(2)}</span></div>`,
    )
    .join('');

  const paymentRows = data.paymentMethod === 'ewallet'
    ? `<div class="row blue"><span>📱 e-Wallet</span><span>RM${data.total.toFixed(2)}</span></div>`
    : `<div class="row muted"><span>Cash</span><span>RM${data.paid.toFixed(2)}</span></div>
  <div class="row green"><span>Change</span><span>RM${data.change.toFixed(2)}</span></div>`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt ${data.receiptNo}</title>
<style>
  body{font-family:monospace;font-size:14px;padding:24px;max-width:320px;margin:0 auto}
  .center{text-align:center} .bold{font-weight:bold}
  .row{display:flex;justify-content:space-between;margin:5px 0}
  .divider{border:none;border-top:2px dashed #aaa;margin:10px 0}
  .big{font-size:16px;font-weight:bold}
  .muted{color:#666} .green{color:#059669;font-weight:bold}
  .blue{color:#2563eb;font-weight:bold}
  .tag{display:inline-block;background:#f1f5f9;padding:2px 10px;border-radius:999px;font-size:12px}
</style></head>
<body>
  <div class="center">
    <div class="bold" style="font-size:20px">ZYN POS</div>
    <div class="muted" style="font-size:12px;margin-top:4px">${dateStr} &middot; ${timeStr}</div>
    <div class="tag" style="margin-top:6px">${data.receiptNo}</div>
  </div>
  <hr class="divider">
  ${itemRows}
  <hr class="divider">
  <div class="row big"><span>TOTAL</span><span>RM${data.total.toFixed(2)}</span></div>
  ${paymentRows}
  <hr class="divider">
  <div class="center muted" style="font-size:12px">Thank you! Please come again.</div>
</body></html>`;

  const win = window.open('', '_blank', 'width=420,height=620');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 300);
}

/* ── Receipt Modal ──────────────────────────────────── */
function ReceiptModal({ data, onClose }: { data: ReceiptData; onClose: () => void }) {
  const dt = new Date(data.createdAt);
  const dateStr = dt.toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = dt.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="text-xl font-bold">🌿 ZYN POS</div>
            <div className="text-xs text-slate-500 mt-1">{dateStr} · {timeStr}</div>
            <div className="mt-2 inline-block bg-slate-100 text-slate-600 text-xs font-mono px-3 py-1 rounded-full">
              {data.receiptNo}
            </div>
          </div>
          <div className="border-t-2 border-dashed border-slate-200 my-3" />
          <div className="space-y-2 text-sm font-mono">
            {data.items.map(({ item, quantity }) => (
              <div key={item.id} className="flex justify-between gap-3">
                <span className="flex-1 truncate">{item.name} x{quantity}</span>
                <span className="tabular-nums shrink-0">RM{(item.price * quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t-2 border-dashed border-slate-200 my-3" />
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between font-bold text-base">
              <span>TOTAL</span>
              <span>RM{data.total.toFixed(2)}</span>
            </div>
            {data.paymentMethod === 'ewallet' ? (
              <div className="flex justify-between text-blue-600 font-bold">
                <span>📱 e-Wallet</span>
                <span>RM{data.total.toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Cash</span>
                  <span>RM{data.paid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Change</span>
                  <span>RM{data.change.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
          <div className="border-t-2 border-dashed border-slate-200 my-3" />
          <p className="text-center text-xs text-slate-400">Thank you! Please come again.</p>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={() => printReceipt(data)}
            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2 text-sm"
          >
            🖨 Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function POSPage() {
  const { items, categories, loaded } = useItems();
  const { cart, addToCart, decreaseQuantity, setQuantity, removeFromCart, clearCart, total, itemCount } =
    useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cartOpen, setCartOpen] = useState(false);
  const [payStep, setPayStep] = useState<'idle' | 'payment' | 'receipt'>('idle');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const filteredItems =
    selectedCategory === 'All' ? items : items.filter(i => i.category === selectedCategory);

  const handleCharge = () => {
    setPayStep('payment');
  };

  const handleConfirmPayment = (paid: number, paymentMethod: string) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 9000 + 1000);
    const receiptNo = `RCP-${dateStr}-${rand}`;

    const saleItems = cart.map(c => ({
      item_id: c.item.id,
      item_name: c.item.name,
      item_price: c.item.price,
      quantity: c.quantity,
    }));

    fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: crypto.randomUUID(), receipt_no: receiptNo, total, items: saleItems, payment_method: paymentMethod, amount_paid: paid, change_amount: paid - total }),
    }).catch(console.error);

    setReceiptData({ receiptNo, createdAt: now.toISOString(), items: [...cart], total, paid, change: paid - total, paymentMethod });
    setPayStep('receipt');
  };

  const handleCloseReceipt = () => {
    clearCart();
    setPayStep('idle');
    setCartOpen(false);
    setReceiptData(null);
  };

  const cartProps: CartContentProps = {
    cart,
    total,
    itemCount,
    onAdd: addToCart,
    onDecrease: decreaseQuantity,
    onSetQuantity: setQuantity,
    onRemove: removeFromCart,
    onClear: clearCart,
    onCharge: handleCharge,
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-400 text-lg">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3 flex items-center justify-between shadow-lg flex-shrink-0">
        <h1 className="text-xl font-bold tracking-wide flex items-center gap-2"><span className="text-2xl leading-none">🌿</span> ZYN POS</h1>
        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-0.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition font-medium"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M12 9a1 1 0 0 1-1-1V3c0-.552.45-1.007.997-.93a7.004 7.004 0 0 1 5.933 5.933c.077.547-.378.997-.93.997h-5ZM8.5 4.034C8.5 3.482 8.053 3.031 7.504 3.1a7.001 7.001 0 0 0-5.404 9.252c.178.458.66.648 1.103.498l4.803-1.616a1 1 0 0 0 .644-.943V4.034ZM6.988 12.986A1 1 0 0 0 6 14c0 .552.449 1.008.997.934a7.009 7.009 0 0 0 4.52-2.783.951.951 0 0 0-.172-1.29l-3.695-3.076-.662 5.2Z" />
            </svg>
            <span className="text-xs leading-none">Dashboard</span>
          </Link>
          <Link
            href="/transactions"
            className="flex flex-col items-center gap-0.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition font-medium"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4 3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Zm0 6a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H4Zm-1 7a1 1 0 0 1 1-1h12a1 1 0 0 1 0 2H4a1 1 0 0 1-1-1Z" clipRule="evenodd" />
            </svg>
            <span className="text-xs leading-none">Transactions</span>
          </Link>
          <Link
            href="/admin"
            className="flex flex-col items-center gap-0.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition font-medium"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.34 1.804A1 1 0 0 1 9.32 1h1.36a1 1 0 0 1 .98.804l.295 1.473c.497.144.971.342 1.422.587l1.25-.834a1 1 0 0 1 1.262.125l.962.962a1 1 0 0 1 .125 1.262l-.834 1.25c.245.45.443.925.587 1.422l1.473.294a1 1 0 0 1 .804.98v1.361a1 1 0 0 1-.804.98l-1.473.295a6.95 6.95 0 0 1-.587 1.422l.834 1.25a1 1 0 0 1-.125 1.262l-.962.962a1 1 0 0 1-1.262.125l-1.25-.834a6.953 6.953 0 0 1-1.422.587l-.294 1.473a1 1 0 0 1-.98.804H9.32a1 1 0 0 1-.98-.804l-.295-1.473a6.957 6.957 0 0 1-1.422-.587l-1.25.834a1 1 0 0 1-1.262-.125l-.962-.962a1 1 0 0 1-.125-1.262l.834-1.25a6.957 6.957 0 0 1-.587-1.422L1.804 11.32A1 1 0 0 1 1 10.34V8.98a1 1 0 0 1 .804-.98l1.473-.295c.144-.497.342-.971.587-1.422l-.834-1.25a1 1 0 0 1 .125-1.262l.962-.962A1 1 0 0 1 5.38 2.684l1.25.834a6.957 6.957 0 0 1 1.422-.587l.289-1.127ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
            </svg>
            <span className="text-xs leading-none">Items</span>
          </Link>
        </nav>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Items panel ─────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Category filter bar */}
          <div className="flex gap-2 px-4 py-3 bg-white border-b border-slate-200 overflow-x-auto flex-shrink-0 shadow-sm">
            {['All', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Item grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <p className="text-lg font-medium">No items found</p>
                <Link href="/admin" className="text-emerald-500 hover:underline text-sm">
                  Add items in Manage Items →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredItems.map(item => {
                  const cartItem = cart.find(c => c.item.id === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className={`relative bg-white rounded-2xl p-4 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-150 active:scale-95 ${
                        cartItem ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-100' : 'shadow-sm border border-slate-100'
                      }`}
                    >
                      {cartItem && (
                        <span className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {cartItem.quantity}
                        </span>
                      )}
                      <div className="text-sm text-emerald-600 font-bold mb-1 uppercase tracking-wide">
                        {item.category}
                      </div>
                      <div className="font-bold text-gray-700 text-xl leading-tight">
                        {item.name}
                      </div>
                      <div className="mt-2 text-emerald-700 font-bold text-2xl">
                        RM{item.price.toFixed(2)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Desktop cart panel ───────────────────────── */}
        <div className="hidden md:flex flex-col w-80 lg:w-96 bg-white border-l border-slate-200 shadow-[-4px_0_16px_rgba(0,0,0,0.04)]">
          <CartContent {...cartProps} />
        </div>
      </div>

      {/* ── Mobile: sticky cart button ───────────────── */}
      {itemCount > 0 && (
        <div className="md:hidden flex-shrink-0 p-3 bg-white border-t">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl py-3.5 font-semibold flex items-center justify-between px-4 hover:from-emerald-700 hover:to-teal-700 transition shadow-md"
          >
            <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm font-bold">
              {itemCount}
            </span>
            <span>View Cart</span>
            <span className="font-bold">RM{total.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* ── Mobile: cart drawer ───────────────────────── */}
      {cartOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
          />
          <div className="relative bg-white rounded-t-2xl shadow-2xl max-h-[82vh] flex flex-col overflow-hidden">
            <CartContent {...cartProps} onClose={() => setCartOpen(false)} />
          </div>
        </div>
      )}

      {/* Payment modal */}
      {payStep === 'payment' && (
        <PaymentModal
          total={total}
          onConfirm={handleConfirmPayment}
          onCancel={() => setPayStep('idle')}
        />
      )}

      {/* Receipt modal */}
      {payStep === 'receipt' && receiptData && (
        <ReceiptModal data={receiptData} onClose={handleCloseReceipt} />
      )}
    </div>
  );
}
