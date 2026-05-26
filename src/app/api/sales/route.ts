import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { SaleItem } from '@/types';

/* ── POST /api/sales  ─────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, total, items }: { id: string; total: number; items: SaleItem[] } = body;

    if (!id || typeof total !== 'number' || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const db = getDb();
    const item_count = items.reduce((s, i) => s + i.quantity, 0);
    const created_at = new Date().toISOString();

    const insertSale = db.prepare(
      'INSERT INTO sales (id, total, item_count, created_at) VALUES (?, ?, ?, ?)',
    );
    const insertItem = db.prepare(
      'INSERT INTO sale_items (sale_id, item_id, item_name, item_price, quantity) VALUES (?, ?, ?, ?, ?)',
    );

    db.transaction(() => {
      insertSale.run(id, total, item_count, created_at);
      for (const item of items) {
        insertItem.run(id, item.item_id, item.item_name, item.item_price, item.quantity);
      }
    })();

    return NextResponse.json({ id, created_at }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/sales]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* ── GET /api/sales?date=YYYY-MM-DD  ─────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    const db = getDb();

    if (date) {
      const sales = db
        .prepare(
          `SELECT s.*, json_group_array(json_object(
             'item_id',    si.item_id,
             'item_name',  si.item_name,
             'item_price', si.item_price,
             'quantity',   si.quantity
           )) AS items
           FROM sales s
           LEFT JOIN sale_items si ON si.sale_id = s.id
           WHERE date(s.created_at) = ?
           GROUP BY s.id
           ORDER BY s.created_at DESC`,
        )
        .all(date) as Array<Record<string, unknown>>;

      const parsed = sales.map(s => ({
        ...s,
        items: JSON.parse(s.items as string),
      }));
      return NextResponse.json(parsed);
    }

    const sales = db
      .prepare('SELECT * FROM sales ORDER BY created_at DESC LIMIT 50')
      .all();
    return NextResponse.json(sales);
  } catch (err) {
    console.error('[GET /api/sales]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
