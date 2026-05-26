import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function ensureTables(db: any) {

  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      inventory INTEGER DEFAULT 0
    )
  `);
}

// GET items
export async function GET() {

  const db = getDb();

  ensureTables(db);

  const rows = db.prepare(`
    SELECT *
    FROM items
    ORDER BY name ASC
  `).all();

  return NextResponse.json(rows);
}

// POST add item
export async function POST(req: NextRequest) {
  const db = getDb();
  ensureTables(db);
  const body = await req.json();
  const {
    name,
    price,
    category,
    inventory = 0,
    id,
  } = body;
  if (!name || typeof price !== 'number' || !category) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  // If id is provided, treat as update (for legacy clients)
  if (id) {
    db.prepare(`UPDATE items SET name = ?, price = ?, category = ?, inventory = ? WHERE id = ?`).run(
      name,
      price,
      category,
      inventory,
      id
    );
    return NextResponse.json({ ok: true });
  }
  db.prepare(`
    INSERT INTO items (
      id,
      name,
      price,
      category,
      inventory
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    name,
    price,
    category,
    inventory
  );
  return NextResponse.json({ ok: true });
}

// PUT update item
export async function PUT(req: NextRequest) {
  const db = getDb();
  ensureTables(db);
  const body = await req.json();
  const { id, name, price, category, inventory = 0 } = body;
  if (!id || !name || typeof price !== 'number' || !category) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  db.prepare(`UPDATE items SET name = ?, price = ?, category = ?, inventory = ? WHERE id = ?`).run(
    name,
    price,
    category,
    inventory,
    id
  );
  return NextResponse.json({ ok: true });
}

// DELETE item
export async function DELETE(req: NextRequest) {
  const db = getDb();
  ensureTables(db);
  const body = await req.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  db.prepare('DELETE FROM items WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}