import { supabase } from "@/integrations/supabase/client";

export type Branch = {
  id: string;
  name: string;
  city: string;
  manager_name: string | null;
  status: string;
  wallet_address: string | null;
  opened_at: string;
  created_at: string;
};

export type Sale = {
  id: string;
  branch_id: string;
  sale_date: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  created_at: string;
};

export type StockItem = {
  id: string;
  branch_id: string | null;
  item_name: string;
  current_qty: number;
  max_qty: number;
  unit: string;
};

export type RoyaltyTx = {
  id: string;
  branch_id: string | null;
  tx_hash: string;
  tx_type: "royalty" | "profit_share" | "reward_token" | "franchise_fee";
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};

export async function fetchBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Branch[];
}

export async function fetchSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .order("sale_date", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as Sale[];
}

export async function fetchStock(): Promise<StockItem[]> {
  const { data, error } = await supabase
    .from("stock_items")
    .select("*")
    .is("branch_id", null);
  if (error) throw error;
  return (data ?? []) as StockItem[];
}

export async function fetchRoyaltyTx(): Promise<RoyaltyTx[]> {
  const { data, error } = await supabase
    .from("royalty_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as RoyaltyTx[];
}

// helpers
export function formatRupiah(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return `Rp ${n.toFixed(0)}`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j`;
  const d = Math.floor(h / 24);
  return `${d}h`;
}
