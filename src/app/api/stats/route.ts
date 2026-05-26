import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { DayStats, TopItem, StatsResponse } from '@/types';

export async function GET() {
  try {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    /* ── Today stats ─────────────────────────── */
    const todayRow = db
      .prepare(
        `SELECT
           COALESCE(SUM(total), 0)      AS revenue,
           COUNT(*)                     AS transactions,
           COALESCE(SUM(item_count), 0) AS items_sold
         FROM sales
         WHERE date(created_at) = ?`,
      )
      .get(today) as { revenue: number; transactions: number; items_sold: number };

    const todayStats: DayStats = {
      date: today,
      revenue: todayRow.revenue,
      transactions: todayRow.transactions,
      items_sold: todayRow.items_sold,
    };

    /* ── Last 7 days ─────────────────────────── */
    const weekRows = db
      .prepare(
        `SELECT
           date(created_at)             AS date,
           COALESCE(SUM(total), 0)      AS revenue,
           COUNT(*)                     AS transactions,
           COALESCE(SUM(item_count), 0) AS items_sold
         FROM sales
         WHERE created_at >= date('now', '-6 days')
         GROUP BY date(created_at)
         ORDER BY date(created_at) ASC`,
      )
      .all() as DayStats[];

    // Fill in missing days so the chart always has 7 points
    const weekMap: Record<string, DayStats> = {};
    weekRows.forEach(r => (weekMap[r.date] = r));
    const week: DayStats[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      week.push(
        weekMap[key] ?? { date: key, revenue: 0, transactions: 0, items_sold: 0 },
      );
    }

    /* ── Top items (last 30 days) ────────────── */
    const topItems = db
      .prepare(
        `SELECT
           item_name,
           SUM(quantity)            AS quantity,
           SUM(item_price*quantity) AS revenue
         FROM sale_items si
         JOIN sales s ON s.id = si.sale_id
         WHERE s.created_at >= date('now', '-30 days')
         GROUP BY item_name
         ORDER BY quantity DESC
         LIMIT 8`,
      )
      .all() as TopItem[];

    /* ── Recent sales (last 10) ──────────────── */
    const recentSales = db
      .prepare(
        `SELECT s.id, s.total, s.item_count, s.created_at,
                json_group_array(json_object(
                  'item_name',  si.item_name,
                  'item_price', si.item_price,
                  'quantity',   si.quantity
                )) AS items
         FROM sales s
         LEFT JOIN sale_items si ON si.sale_id = s.id
         GROUP BY s.id
         ORDER BY s.created_at DESC
         LIMIT 10`,
      )
      .all() as Array<Record<string, unknown>>;

    const parsedSales = recentSales.map(s => ({
      ...s,
      items: JSON.parse(s.items as string),
    }));

    const response: StatsResponse = {
      today: todayStats,
      week,
      topItems,
      recentSales: parsedSales as StatsResponse['recentSales'],
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[GET /api/stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
