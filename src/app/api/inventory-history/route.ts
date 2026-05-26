import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Ensure inventory_history table exists
function ensureTables(db: any) {

  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT NOT NULL,
      change INTEGER NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )
  `);

  // Add inventory column if missing
  try {
    db.exec(`
      ALTER TABLE items
      ADD COLUMN inventory INTEGER DEFAULT 0
    `);
  } catch {}

}

// GET inventory history
export async function GET() {
  const db = getDb();

  ensureTables(db);

  const rows = db
    .prepare(`
      SELECT *
      FROM inventory_history
      ORDER BY created_at DESC
      LIMIT 200
    `)
    .all();

  return NextResponse.json(rows);
}

// POST inventory adjustment
export async function POST(req: NextRequest) {
  const db = getDb();
  ensureTables(db);
  const body = await req.json();
  const { item_id, change } = body;
  if (!item_id || typeof change !== 'number' || change === 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  // Update inventory in items table
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(item_id);
  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }
  const newInventory = (item.inventory ?? 0) + change;
  db.prepare('UPDATE items SET inventory = ? WHERE id = ?').run(newInventory, item_id);
  // Log inventory change
  db.prepare(`
    INSERT INTO inventory_history (item_id, change, created_at)
    VALUES (?, ?, ?)
  `).run(item_id, change, new Date().toISOString());
  return NextResponse.json({ ok: true });
}

// DELETE inventory log row
export async function DELETE(req: NextRequest) {
  const db = getDb();
  ensureTables(db);
  const body = await req.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  db.prepare('DELETE FROM inventory_history WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}