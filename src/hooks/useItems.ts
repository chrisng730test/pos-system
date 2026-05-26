'use client';

import { useState, useEffect } from 'react';
import { MenuItem } from '@/types';

const DEFAULT_ITEMS: MenuItem[] = [
  { id: '1', name: 'Coffee', price: 3.50, category: 'Drinks' },
  { id: '2', name: 'Tea', price: 2.50, category: 'Drinks' },
  { id: '3', name: 'Water', price: 1.00, category: 'Drinks' },
  { id: '4', name: 'Sandwich', price: 6.50, category: 'Food' },
  { id: '5', name: 'Muffin', price: 3.00, category: 'Food' },
  { id: '6', name: 'Salad', price: 8.00, category: 'Food' },
];

const STORAGE_KEY = 'pos-items';

export function useItems() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      } else {
        setItems(DEFAULT_ITEMS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ITEMS));
      }
    } catch {
      setItems(DEFAULT_ITEMS);
    } finally {
      setLoaded(true);
    }
  }, []);

  const persist = (next: MenuItem[]) => {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addItem = (item: Omit<MenuItem, 'id'>) => {
    const next: MenuItem = { ...item, id: crypto.randomUUID() };
    persist([...items, next]);
  };

  const updateItem = (id: string, updates: Partial<Omit<MenuItem, 'id'>>) => {
    persist(items.map(i => (i.id === id ? { ...i, ...updates } : i)));
  };

  const deleteItem = (id: string) => {
    persist(items.filter(i => i.id !== id));
  };

  const categories = [...new Set(items.map(i => i.category))].filter(Boolean);

  return { items, addItem, updateItem, deleteItem, categories, loaded };
}
