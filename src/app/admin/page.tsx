'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useItems } from '@/hooks/useItems';
import { useInventoryHistory } from '@/hooks/useInventoryHistory';
import { MenuItem } from '@/types';

interface RestockState {
  open: boolean;
  item: MenuItem | null;
  qty: string;
  reason: string;
  error?: string;
  loading: boolean;
}

interface ItemFormState {
  name: string;
  price: string;
  category: string;
  inventory: string;
}

interface FormErrors {
  name?: string;
  price?: string;
  category?: string;
}

function validateForm(f: ItemFormState): FormErrors {
  const errors: FormErrors = {};
  if (!f.name.trim()) errors.name = 'Name is required';
  if (!f.price || isNaN(Number(f.price)) || Number(f.price) <= 0)
    errors.price = 'Enter a valid price';
  if (!f.category.trim()) errors.category = 'Category is required';
  return errors;
}

const EMPTY_FORM: ItemFormState = { name: '', price: '', category: '', inventory: '' };

export default function AdminPage() {
  const { items, addItem, updateItem, deleteItem, categories, loaded } = useItems();
  const {
    history = [],
    loading: loadingHistory,
    refresh: refreshHistory,
    deleteInventoryLog,
  } = useInventoryHistory();
  const [restock, setRestock] = useState<RestockState>({ open: false, item: null, qty: '', reason: '', loading: false });
  const [tab, setTab] = useState<'items' | 'log'>('items');
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);

  // Restock modal logic
  const openRestock = (item: MenuItem) => setRestock({ open: true, item, qty: '', reason: '', loading: false });
  const closeRestock = () => setRestock({ open: false, item: null, qty: '', reason: '', loading: false });
  const handleRestock = async () => {
    if (!restock.item) return;
    const qty = parseInt(restock.qty, 10);
    if (isNaN(qty) || qty === 0) {
      setRestock(r => ({ ...r, error: 'Enter a non-zero quantity' }));
      return;
    }
    setRestock(r => ({ ...r, loading: true, error: undefined }));
    const res = await fetch('/api/inventory-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: restock.item.id, change: qty }),
    });
    if (res.ok) {
      closeRestock();
      refreshHistory();
      setTimeout(() => window.location.reload(), 300);
    } else {
      setRestock(r => ({ ...r, error: 'Failed to update inventory' }));
    }
  };

  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM);
const [formErrors, setFormErrors] = useState<FormErrors>({});

const [editId, setEditId] = useState<string | null>(null);

const [editForm, setEditForm] = useState<ItemFormState>({
  name: '',
  price: '',
  category: '',
  inventory: '',
});

const [editErrors, setEditErrors] = useState<FormErrors>({});

const [deleteConfirmId, setDeleteConfirmId] =
  useState<string | null>(null);

/* ── Start Edit ───────────────────── */
const startEdit = (item: MenuItem) => {

  setEditId(item.id);

  setEditForm({
    name: item.name,
    price: String(item.price),
    category: item.category,
    inventory: '',
  });

  setEditErrors({});

  setDeleteConfirmId(null);
};

/* ── Cancel Edit ──────────────────── */
const cancelEdit = () => {

  setEditId(null);

  setEditErrors({});
};

/* ── Handle Update ────────────────── */
const handleUpdate = (id: string) => {

  const errors = validateForm(editForm);

  if (Object.keys(errors).length) {
    setEditErrors(errors);
    return;
  }

  updateItem(id, {
    name: editForm.name.trim(),
    price: Number(editForm.price),
    category: editForm.category.trim(),
  });

  setEditId(null);

  setEditErrors({});
};

/* ── Add Item ─────────────────────── */
const handleAdd = async (
  e: React.FormEvent
) => {

  e.preventDefault();

  const errors = validateForm(form);

  if (Object.keys(errors).length) {
    setFormErrors(errors);
    return;
  }

  const inventory =
    Number(form.inventory) || 0;

  const newItem = {
  name: form.name.trim(),
  price: Number(form.price),
  category: form.category.trim(),
  inventory,
};

  // Add item
  await addItem(newItem);
  

  setForm(EMPTY_FORM);

  setFormErrors({});
};

/* ── Delete Item ──────────────────── */
const handleDelete = (id: string) => {

  deleteItem(id);

  setDeleteConfirmId(null);
};
  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-400 text-lg">Loading…</p>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-slate-50 flex">

    <Sidebar />

    <div className="flex-1 min-w-0 overflow-x-hidden">
      {/* Top action bar */}
<div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">

  {/* Left side */}
  <div className="flex items-center gap-2">
    <h1 className="text-3xl text-slate-800 text-emerald-800 px-2 py-1.5 rounded-full font-bold">
      Settings
    </h1>
  </div>

  {/* Right side */}
  <div className="flex items-center gap-2">

    <div className="bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-1.5 rounded-lg">
      {items.length} item{items.length !== 1 ? 's' : ''}
    </div>

    <div className="bg-emerald-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg">
      {history.length} logs
    </div>

  </div>
</div>

      <div className="max-w-7xl mx-auto p-6">

  {/* Tabs */}
  <div className="flex gap-6 mb-6 border-b border-slate-200">
    <button
      className={`pb-3 text-sm font-semibold transition ${
        tab === 'items'
          ? 'text-emerald-700 border-b-2 border-emerald-600'
          : 'text-slate-500'
      }`}
      onClick={() => setTab('items')}
    >
      Items
    </button>

    <button
      className={`pb-3 text-sm font-semibold transition ${
        tab === 'log'
          ? 'text-emerald-700 border-b-2 border-emerald-600'
          : 'text-slate-500'
      }`}
      onClick={() => setTab('log')}
    >
      Inventory Log
    </button>
  </div>

  {/* Add Item Card */}
  <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
    <div className="flex items-center gap-2 mb-5">
      <span className="text-emerald-600 text-xl">➕</span>

      <h2 className="text-xl font-bold text-slate-800">
        Add New Item
      </h2>
    </div>

    <form
      onSubmit={handleAdd}
      className="grid grid-cols-1 md:grid-cols-5 gap-4"
    >
      <div>
        <label className="text-sm text-slate-600 font-medium block mb-1">
          Item Name
        </label>

        <input
          type="text"
          value={form.name}
          onChange={e =>
            setForm({
              ...form,
              name: e.target.value,
            })
          }
          placeholder="e.g. Latte"
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="text-sm text-slate-600 font-medium block mb-1">
          Price (RM)
        </label>

        <input
          type="number"
          value={form.price}
          onChange={e =>
            setForm({
              ...form,
              price: e.target.value,
            })
          }
          placeholder="e.g. 4.50"
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="text-sm text-slate-600 font-medium block mb-1">
          Category
        </label>

        <input
          type="text"
          value={form.category}
          onChange={e =>
            setForm({
              ...form,
              category: e.target.value,
            })
          }
          placeholder="e.g. Drinks"
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="text-sm text-slate-600 font-medium block mb-1">
          Inventory
        </label>

        <input
          type="number"
          value={form.inventory}
          onChange={e =>
            setForm({
              ...form,
              inventory: e.target.value,
            })
          }
          placeholder="e.g. 10"
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-semibold shadow-lg shadow-emerald-100 transition"
        >
          + Add Item
        </button>
      </div>
    </form>
  </section>

  {/* Dashboard Grid */}
  {tab === 'items' && (
<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

    {/* Items Panel */}
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

      <div className="px-6 py-5 border-b bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800">
          Items ({items.length})
        </h2>
      </div>

      <div className="divide-y">

        {items.map(item => (
          <div
            key={item.id}
            className="p-5 hover:bg-slate-50 transition"
          >

            {editId === item.id ? (
              <div className="space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        name: e.target.value,
                      })
                    }
                    className="border rounded-xl px-3 py-2"
                  />

                  <input
                    type="number"
                    value={editForm.price}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        price: e.target.value,
                      })
                    }
                    className="border rounded-xl px-3 py-2"
                  />

                  <input
                    type="text"
                    value={editForm.category}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        category: e.target.value,
                      })
                    }
                    className="border rounded-xl px-3 py-2"
                  />

        
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(item.id)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium"
                  >
                    Save
                  </button>

                  <button
                    onClick={cancelEdit}
                    className="bg-slate-200 px-4 py-2 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                </div>

              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">

                <div>
                  <div className="font-semibold text-slate-800">
                    {item.name}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                      {item.inventory} in stock
                    </span>

                    <span className="text-xs text-slate-500">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">

                  <div className="font-bold text-emerald-700">
                    RM{item.price.toFixed(2)}
                  </div>

                  <div className="flex items-center gap-2">

                    {/* Modern monochrome edit (pencil) icon */}
                    <button
  onClick={() => startEdit(item)}
  className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-500 transition flex items-center justify-center"
  title="Edit"
>
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.0"
    className="w-5 h-5 relative top-[1.5px]"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.862 5.487a2.1 2.1 0 0 0-2.974-2.974l-7.1 7.1a2 2 0 0 0-.553.98l-.6 2.4a.5.5 0 0 0 .61.61l2.4-.6a2 2 0 0 0 .98-.553l7.1-7.1Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.5 7.5l-3-3"
    />
  </svg>
</button>

                    {/* Modern monochrome box (restock) icon */}
                    <button
                      onClick={() => openRestock(item)}
                      className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-500 transition flex items-center justify-center"
                      title="Restock"
                    >
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                        <rect x="3.5" y="6.5" width="13" height="10" rx="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 6.5L10 2.5l7.5 4" />
                      </svg>
                    </button>

                    {/* Modern monochrome trash (delete) icon */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-500 transition flex items-center justify-center"
                      title="Delete"
                    >
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 6.5v-1A1.5 1.5 0 0 1 9 4h2a1.5 1.5 0 0 1 1.5 1.5v1" />
                        <rect x="4.5" y="6.5" width="11" height="9" rx="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 9.5v4m3-4v4" />
                      </svg>
                    </button>

                  </div>

                </div>

              </div>
            )}

          </div>
        ))}

      </div>
    </section>

    {/* Inventory Log */}
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

      <div className="px-6 py-5 border-b bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800">
          Inventory Log
        </h2>
      </div>

      <div className="overflow-x-auto max-h-[700px]">

        <table className="w-full text-sm">
          

          <tbody>

           {(history || []).slice(0, 6).map(log => (
              <tr
                key={log.id}
                className="border-t hover:bg-slate-50"
              >
                <td className="px-5 py-4 text-slate-500">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-5 py-4">
                  {items.find(i => i.id === log.item_id)?.name || log.item_id}
                </td>
                <td
                  className={`px-5 py-4 font-bold ${
                    log.change > 0
                      ? 'text-emerald-600'
                      : 'text-red-500'
                  }`}
                >
                  {log.change > 0 ? '+' : ''}
                  {log.change}
                </td>
                <td className="px-5 py-4">
                  {/* Modern monochrome trash (delete) icon */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-500 transition flex items-center justify-center"
                      title="Delete"
                    >
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 6.5v-1A1.5 1.5 0 0 1 9 4h2a1.5 1.5 0 0 1 1.5 1.5v1" />
                        <rect x="4.5" y="6.5" width="11" height="9" rx="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 9.5v4m3-4v4" />
                      </svg>
                    </button>
                </td>
              </tr>
            ))}

          </tbody>
        </table>
{history.length > 6 && (
  <div className="flex justify-end p-4 border-t bg-slate-50">

    <button
      onClick={() => setTab('log')}
      className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold"
    >
      View All Logs →
    </button>

  </div>
)}
      </div>
    </section>

    </div>
)}
{tab === 'log' && (
<section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

  <div className="px-6 py-5 border-b bg-slate-50 flex items-center justify-between">

  <div>
    <h2 className="text-lg font-bold text-slate-800">
      Full Inventory Log
    </h2>

    <p className="text-xs text-slate-400 mt-1">
      {selectedLogs.length} selected
    </p>
  </div>

  <div className="flex items-center gap-3">

    <button
      onClick={() => {

        if (selectedLogs.length === history.length) {
          setSelectedLogs([]);
        } else {
          setSelectedLogs(
            history.map(log => log.id)
          );
        }

      }}
      className="text-sm bg-slate-200 hover:bg-slate-300 px-3 py-2 rounded-xl font-medium"
    >
      {selectedLogs.length === history.length
        ? 'Unselect All'
        : 'Select All'}
    </button>

    {selectedLogs.length > 0 && (
      <button
        onClick={async () => {

          const confirmed = confirm(
            `Delete ${selectedLogs.length} inventory logs?`
          );

          if (!confirmed) return;

          for (const id of selectedLogs) {
            await deleteInventoryLog(id);
          }

          setSelectedLogs([]);

          refreshHistory();

        }}
        className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold"
      >
        Delete Selected
      </button>
    )}

    <button
      onClick={() => setTab('items')}
      className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold"
    >
      ← Back to Items
    </button>

  </div>

</div>

  <div className="overflow-auto max-h-[700px]">

    <table className="w-full text-sm">

      <thead className="bg-slate-50 sticky top-0">

  <tr className="text-slate-500">

    <th className="px-5 py-4 w-[52px] text-center">

  <div className="flex justify-center">

    <input
      type="checkbox"
      checked={
        history.length > 0 &&
        selectedLogs.length === history.length
      }
      onChange={e => {

        if (e.target.checked) {

          setSelectedLogs(
            history.map((log: any) => log.id)
          );

        } else {

          setSelectedLogs([]);

        }

      }}
    />

  </div>

</th>

    <th className="text-left px-5 py-4">
      Date
    </th>

    <th className="text-left px-5 py-4">
      Item
    </th>

    <th className="text-left px-5 py-4">
      Change
    </th>

    <th className="text-left px-5 py-4">
      Action
    </th>

  </tr>

</thead>

      <tbody>

        {(history || []).map(log => (
          <tr
            key={log.id}
            
            className="border-t hover:bg-slate-50"
          >
            <td className="px-5 py-4">

  <input
    type="checkbox"
    checked={selectedLogs.includes((log as any).id)}
    onChange={e => {

      if (e.target.checked) {

        setSelectedLogs([
          ...selectedLogs,
          (log as any).id,
        ]);

      } else {

        setSelectedLogs(
          selectedLogs.filter(
            id => id !== (log as any).id
          )
        );

      }

    }}
  />

</td>
            <td className="px-5 py-4 text-slate-500">
              {new Date(log.created_at).toLocaleString()}
            </td>
            <td className="px-5 py-4">
              {items.find(i => i.id === log.item_id)?.name || log.item_id}
            </td>
            <td
              className={`px-5 py-4 font-bold ${
                log.change > 0
                  ? 'text-emerald-600'
                  : 'text-red-500'
              }`}
            >
              {log.change > 0 ? '+' : ''}
              {log.change}
            </td>
            <td className="px-5 py-4">

  <button
    onClick={() => deleteInventoryLog(log.id)}
    className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-500 transition flex items-center justify-center"
    title="Delete log entry"
  >

    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="w-5 h-5"
    >

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 6.5v-1A1.5 1.5 0 0 1 9 4h2a1.5 1.5 0 0 1 1.5 1.5v1"
      />

      <rect
        x="4.5"
        y="6.5"
        width="11"
        height="9"
        rx="2"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.5 9.5v4m3-4v4"
      />

    </svg>

  </button>

</td>
          </tr>
        ))}

      </tbody>

    </table>

  </div>

</section>
)}
  {restock.open && restock.item && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">

      <h2 className="text-xl font-bold mb-2">
        Adjust Stock
      </h2>

      <p className="text-slate-500 mb-5">
        {restock.item.name}
      </p>

      <div className="space-y-4">

        <div>
          <label className="text-sm font-medium text-slate-600 block mb-1">
            Stock Adjustment
          </label>

          <input
            type="number"
            value={restock.qty}
            onChange={e =>
              setRestock({
                ...restock,
                qty: e.target.value,
              })
            }
            placeholder="e.g. 10 or -2"
            className="w-full border border-slate-300 rounded-xl px-4 py-3"
          />

          <p className="text-xs text-slate-400 mt-1">
            Positive = add stock, Negative = reduce stock
          </p>
        </div>

        {restock.error && (
          <div className="text-red-500 text-sm">
            {restock.error}
          </div>
        )}

        <div className="flex gap-3 pt-2">

          <button
            onClick={handleRestock}
            disabled={restock.loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold"
          >
            {restock.loading ? 'Saving...' : 'Update Stock'}
          </button>

          <button
            onClick={closeRestock}
            className="flex-1 bg-slate-200 hover:bg-slate-300 py-3 rounded-xl font-semibold"
          >
            Cancel
          </button>

        </div>

      </div>

    </div>

  </div>
)}
      </div>
    </div>
     </div>
  );
}