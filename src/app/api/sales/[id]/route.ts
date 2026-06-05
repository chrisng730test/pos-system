import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/* ── DELETE /api/sales/:id  ───────────────────────────────────── */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const db = getDb();

    const sale = db.prepare('SELECT id FROM sales WHERE id = ?').get(id);
    if (!sale) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const soldItems = db
      .prepare('SELECT item_id, quantity FROM sale_items WHERE sale_id = ?')
      .all(id) as Array<{ item_id: string; quantity: number }>;

    const restoreInventory = db.prepare('UPDATE items SET inventory = inventory + ? WHERE id = ?');

    db.transaction(() => {
      for (const item of soldItems) {
        restoreInventory.run(item.quantity, item.item_id);
      }
      db.prepare('DELETE FROM sale_items WHERE sale_id = ?').run(id);
      db.prepare('DELETE FROM sales WHERE id = ?').run(id);
    })();

    return NextResponse.json({ deleted: id });
  } catch (err) {
    console.error('[DELETE /api/sales/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
