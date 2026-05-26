export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface SaleItem {
  item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  receipt_no?: string;
  total: number;
  item_count: number;
  created_at: string;
  items?: SaleItem[];
}

export interface DayStats {
  date: string;
  revenue: number;
  transactions: number;
  items_sold: number;
}

export interface TopItem {
  item_name: string;
  quantity: number;
  revenue: number;
}

export interface StatsResponse {
  today: DayStats;
  week: DayStats[];
  topItems: TopItem[];
  recentSales: Sale[];
}
