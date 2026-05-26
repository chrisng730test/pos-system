import { useState, useEffect } from 'react';

export interface InventoryHistoryRow {
  id: number;
  item_id: string;
  change: number;
  reason: string;
  created_at: string;
}

export function useInventoryHistory() {
  const [history, setHistory] = useState<InventoryHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    const res = await fetch('/api/inventory-history');
    const data = await res.json();
    setHistory(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const deleteInventoryLog = async (id: number) => {
    await fetch('/api/inventory-history', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchHistory();
  };

  return { history, loading, refresh: fetchHistory, deleteInventoryLog };
}
