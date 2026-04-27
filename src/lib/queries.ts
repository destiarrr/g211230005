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
  min_qty: number;
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

export type Supplier = {
  id: string;
  name: string;
  contact: string | null;
  address: string | null;
  wallet_address: string | null;
  created_at: string;
};

export type StockMovement = {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  from_location: string;
  to_location: string;
  supplier_id: string | null;
  branch_id: string | null;
  tx_hash: string | null;
  notes: string | null;
  created_at: string;
};

export type Voucher = {
  id: string;
  title: string;
  description: string | null;
  cost_points: number;
  discount_amount: number;
  active: boolean;
};

export type LoyaltyAccount = {
  user_id: string;
  balance: number;
  total_earned: number;
  total_redeemed: number;
};

export type LoyaltyTx = {
  id: string;
  user_id: string;
  amount: number;
  tx_type: "earn" | "redeem";
  reference: string | null;
  created_at: string;
};

export type PaymentProof = {
  id: string;
  user_id: string;
  branch_id: string | null;
  payment_type: "franchise_fee" | "royalty" | "supply";
  amount: number;
  method: "transfer" | "qris" | "crypto";
  proof_url: string | null;
  reference_note: string | null;
  status: "pending" | "verified" | "rejected";
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  link: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  category: string | null;
  default_price: number;
  unit: string;
  active: boolean;
};

export type Order = {
  id: string;
  user_id: string;
  branch_id: string | null;
  category: "offline" | "shopeefood" | "gofood";
  total: number;
  notes: string | null;
  order_date: string;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
};

export type StockRecord = {
  id: string;
  branch_id: string | null;
  record_date: string;
  record_type: "pembukaan" | "penutupan";
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit: string;
  notes: string | null;
  created_at: string;
};

export type ProductionRecord = {
  id: string;
  branch_id: string | null;
  item_name: string;
  price: number;
  supplier: string | null;
  place: string | null;
  purchase_date: string;
  notes: string | null;
  created_at: string;
};

export type OperationalTool = {
  id: string;
  branch_id: string | null;
  tool_name: string;
  brand: string | null;
  price: number;
  purchase_place: string | null;
  replace_period_months: number;
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
};

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function fetchOrderItems(orderIds: string[]): Promise<OrderItem[]> {
  if (orderIds.length === 0) return [];
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", orderIds);
  if (error) throw error;
  return (data ?? []) as OrderItem[];
}

export async function fetchStockRecords(): Promise<StockRecord[]> {
  const { data, error } = await supabase
    .from("stock_records")
    .select("*")
    .order("record_date", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as StockRecord[];
}

export async function fetchProductionRecords(): Promise<ProductionRecord[]> {
  const { data, error } = await supabase
    .from("production_records")
    .select("*")
    .order("purchase_date", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as ProductionRecord[];
}

export async function fetchOperationalTools(): Promise<OperationalTool[]> {
  const { data, error } = await supabase
    .from("operational_tools")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OperationalTool[];
}

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
    .order("item_name");
  if (error) throw error;
  return (data ?? []) as StockItem[];
}

export async function fetchRoyaltyTx(): Promise<RoyaltyTx[]> {
  const { data, error } = await supabase
    .from("royalty_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as RoyaltyTx[];
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Supplier[];
}

export async function fetchStockMovements(): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as StockMovement[];
}

export async function fetchVouchers(): Promise<Voucher[]> {
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .eq("active", true)
    .order("cost_points");
  if (error) throw error;
  return (data ?? []) as Voucher[];
}

export async function fetchMyLoyalty(userId: string): Promise<LoyaltyAccount | null> {
  const { data, error } = await supabase
    .from("loyalty_accounts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as LoyaltyAccount | null) ?? null;
}

export async function fetchMyLoyaltyTx(userId: string): Promise<LoyaltyTx[]> {
  const { data, error } = await supabase
    .from("loyalty_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as LoyaltyTx[];
}

export async function fetchPayments(): Promise<PaymentProof[]> {
  const { data, error } = await supabase
    .from("payment_proofs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PaymentProof[];
}

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

// helpers
export function formatRupiah(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return `Rp ${n.toFixed(0)}`;
}

export function formatRupiahFull(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
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

export function mockTxHash(): string {
  const chars = "0123456789abcdef";
  let s = "0x";
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * 16)];
  return s + "..." + Math.random().toString(16).slice(2, 6);
}
