import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { MenuItem } from '@/types';

// GET all items
export async function GET() {
  const db = getDb();
  db.exec(`CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL
  )`);
  const items = db.prepare('SELECT * FROM items').all();
  return NextResponse.json(items);
}

// POST add or update item
export async function POST(req: NextRequest) {
  const db = getDb();
  const item = await req.json() as MenuItem;
  db.prepare(`INSERT OR REPLACE INTO items (id, name, price, category) VALUES (?, ?, ?, ?)`)
    .run(item.id, item.name, item.price, item.category);
  return NextResponse.json({ ok: true });
}

// DELETE item
export async function DELETE(req: NextRequest) {
  const db = getDb();
  const { id } = await req.json();
  db.prepare('DELETE FROM items WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
