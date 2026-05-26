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

    db.transaction(() => {
      db.prepare('DELETE FROM sale_items WHERE sale_id = ?').run(id);
      db.prepare('DELETE FROM sales WHERE id = ?').run(id);
    })();

    return NextResponse.json({ deleted: id });
  } catch (err) {
    console.error('[DELETE /api/sales/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
