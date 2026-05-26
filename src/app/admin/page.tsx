'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useItems } from '@/hooks/useItems';
import { MenuItem } from '@/types';

interface ItemFormState {
  name: string;
  price: string;
  category: string;
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

const EMPTY_FORM: ItemFormState = { name: '', price: '', category: '' };

export default function AdminPage() {
  const { items, addItem, updateItem, deleteItem, categories, loaded } = useItems();

  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ItemFormState>(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState<FormErrors>({});

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  /* ── Add item ─────────────────────────────── */
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(form);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    addItem({ name: form.name.trim(), price: Number(form.price), category: form.category.trim() });
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  /* ── Edit item ────────────────────────────── */
  const startEdit = (item: MenuItem) => {
    setEditId(item.id);
    setEditForm({ name: item.name, price: String(item.price), category: item.category });
    setEditErrors({});
    setDeleteConfirmId(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditErrors({});
  };

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

  /* ── Delete item ──────────────────────────── */
  const handleDelete = (id: string) => {
    deleteItem(id);
    setDeleteConfirmId(null);
  };

  /* ── Group items by category ──────────────── */
  const grouped: Record<string, MenuItem[]> = {};
  items.forEach(item => {
    const cat = item.category || 'Uncategorized';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-400 text-lg">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-4 flex items-center gap-3 shadow-lg">
        <Link
          href="/"
          className="hover:bg-white/20 p-1.5 rounded-lg transition text-lg leading-none"
          aria-label="Back to POS"
        >
          ←
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2"><span className="text-2xl leading-none">🌿</span> Manage Items</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* ── Add item form ──────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Add New Item</h2>
          <form onSubmit={handleAdd} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Latte"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                    formErrors.name ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  placeholder="e.g. 4.50"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                    formErrors.price ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {formErrors.price && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  list="category-suggestions"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Drinks"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                    formErrors.category ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                <datalist id="category-suggestions">
                  {categories.map(c => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                {formErrors.category && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 active:bg-emerald-800 transition text-sm shadow-md shadow-emerald-200"
            >
              + Add Item
            </button>
          </form>
        </section>

        {/* ── Item list ─────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-base font-semibold text-gray-800">
              Items ({items.length})
            </h2>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>No items yet. Add your first item above.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([cat, catItems]) => (
              <div key={cat}>
                <div className="px-5 py-2 bg-gray-50 border-y text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {cat} · {catItems.length}
                </div>
                <ul className="divide-y">
                  {catItems.map(item => (
                    <li key={item.id} className="px-5 py-3">
                      {editId === item.id ? (
                        /* ── Inline edit row ── */
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={e =>
                                setEditForm({ ...editForm, name: e.target.value })
                              }
                              placeholder="Name"
                              className={`border rounded-lg px-2 py-1.5 text-sm flex-1 min-w-[110px] focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                                editErrors.name ? 'border-red-400' : 'border-gray-300'
                              }`}
                            />
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={editForm.price}
                              onChange={e =>
                                setEditForm({ ...editForm, price: e.target.value })
                              }
                              placeholder="Price"
                              className={`border rounded-lg px-2 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                                editErrors.price ? 'border-red-400' : 'border-gray-300'
                              }`}
                            />
                            <input
                              type="text"
                              list="category-suggestions"
                              value={editForm.category}
                              onChange={e =>
                                setEditForm({ ...editForm, category: e.target.value })
                              }
                              placeholder="Category"
                              className={`border rounded-lg px-2 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                                editErrors.category ? 'border-red-400' : 'border-gray-300'
                              }`}
                            />
                          </div>
                          {(editErrors.name || editErrors.price || editErrors.category) && (
                            <p className="text-red-500 text-xs">
                              {editErrors.name || editErrors.price || editErrors.category}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdate(item.id)}
                              className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition shadow-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : deleteConfirmId === item.id ? (
                        /* ── Delete confirm ── */
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm text-gray-700 flex-1">
                            Delete <strong>{item.name}</strong>?
                          </span>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 transition"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        /* ── Normal row ── */
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-800 text-sm">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-emerald-700 font-semibold text-sm tabular-nums">
                            RM{item.price.toFixed(2)}
                          </span>
                          <button
                            onClick={() => startEdit(item)}
                            title="Edit"
                            className="text-gray-400 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-emerald-50 transition"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmId(item.id);
                              setEditId(null);
                            }}
                            title="Delete"
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
