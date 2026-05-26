'use client';

import { useState, useEffect } from 'react';
import { MenuItem } from '@/types';

export function useItems() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Fetch items from API
  const fetchItems = async () => {
    const res = await fetch('/api/items');
    const data = await res.json();
    setItems(data);
    setLoaded(true);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line
  }, []);


  const addItem = async (item: Omit<MenuItem, 'id'>) => {
    const newItem = { ...item, inventory: item.inventory ?? 0 };
    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    fetchItems();
  };

  const updateItem = async (id: string, updates: Partial<Omit<MenuItem, 'id'>>) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    await fetch('/api/items', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, ...updates }),
    });
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    await fetch('/api/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchItems();
  };

  const categories = [...new Set(items.map(i => i.category))].filter(Boolean);

  return { items, addItem, updateItem, deleteItem, categories, loaded };
}
