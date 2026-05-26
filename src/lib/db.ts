import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'pos.db');

// Persist the connection on globalThis so Next.js HMR module re-evaluations
// (Turbopack) don't open a new connection without closing the old one.
const g = globalThis as typeof globalThis & { __posDb?: Database.Database };

export function getDb(): Database.Database {
  if (g.__posDb) return g.__posDb;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id          TEXT    PRIMARY KEY,
      total       REAL    NOT NULL,
      item_count  INTEGER NOT NULL,
      created_at  TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id     TEXT    NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      item_id     TEXT    NOT NULL,
      item_name   TEXT    NOT NULL,
      item_price  REAL    NOT NULL,
      quantity    INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_name ON sale_items(item_name);
  `);

  // Migration: add receipt_no if it doesn't exist yet
  const cols = _db.prepare('PRAGMA table_info(sales)').all() as { name: string }[];
  if (!cols.some(c => c.name === 'receipt_no')) {
    _db.prepare('ALTER TABLE sales ADD COLUMN receipt_no TEXT').run();
  }
  if (!cols.some(c => c.name === 'payment_method')) {
    _db.prepare('ALTER TABLE sales ADD COLUMN payment_method TEXT').run();
  }

  g.__posDb = _db;
  return _db;
}
