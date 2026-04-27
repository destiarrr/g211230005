import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Receipt, Download, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { RequireAuth, RoleGate } from "@/components/AuthGuards";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  fetchBranches, fetchProducts, fetchOrders, fetchOrderItems,
  formatRupiahFull, timeAgo,
} from "@/lib/queries";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

export const Route = createFileRoute("/kasir")({
  head: () => ({
    meta: [
      { title: "Kasir POS — ENGGAL CHAIN" },
      { name: "description", content: "Input pesanan multi-produk dengan kategori Offline / ShopeeFood / GoFood." },
    ],
  }),
  component: KasirPageGuarded,
});

function KasirPageGuarded() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container mx-auto max-w-7xl px-4 py-10 md:px-6">
          <RoleGate allow={["owner", "mitra"]}>
            <KasirInner />
          </RoleGate>
        </main>
        <SiteFooter />
      </div>
    </RequireAuth>
  );
}

type CartItem = { product_id: string | null; product_name: string; quantity: number; price: number };

const CATEGORIES = [
  { value: "offline", label: "🏪 Offline", color: "bg-success/15 text-success border-success/40" },
  { value: "shopeefood", label: "🟠 ShopeeFood", color: "bg-warning/15 text-warning border-warning/40" },
  { value: "gofood", label: "🟢 GoFood", color: "bg-gold/15 text-gold border-gold/40" },
] as const;

function KasirInner() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const branchesQ = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });
  const productsQ = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const ordersQ = useQuery({ queryKey: ["orders"], queryFn: fetchOrders });

  const branches = branchesQ.data ?? [];
  const products = productsQ.data ?? [];
  const orders = ordersQ.data ?? [];

  const orderIds = orders.slice(0, 30).map((o) => o.id);
  const itemsQ = useQuery({
    queryKey: ["order_items", orderIds.join(",")],
    queryFn: () => fetchOrderItems(orderIds),
    enabled: orderIds.length > 0,
  });
  const items = itemsQ.data ?? [];

  const [branchId, setBranchId] = useState<string>("");
  const [category, setCategory] = useState<"offline" | "shopeefood" | "gofood">("offline");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filter, setFilter] = useState<"all" | "today" | "week" | "month">("today");

  if (!branchId && branches.length > 0) setBranchId(branches[0].id);

  const total = useMemo(
    () => cart.reduce((a, it) => a + it.quantity * it.price, 0),
    [cart],
  );

  const addProduct = (productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setCart((c) => {
      const existing = c.find((it) => it.product_id === p.id);
      if (existing) {
        return c.map((it) =>
          it.product_id === p.id ? { ...it, quantity: it.quantity + 1 } : it,
        );
      }
      return [...c, { product_id: p.id, product_name: p.name, quantity: 1, price: p.default_price }];
    });
  };

  const updateItem = (idx: number, patch: Partial<CartItem>) => {
    setCart((c) => c.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const removeItem = (idx: number) => setCart((c) => c.filter((_, i) => i !== idx));

  const submit = useMutation({
    mutationFn: async () => {
      if (!branchId) throw new Error("Pilih cabang dulu");
      if (cart.length === 0) throw new Error("Keranjang kosong");
      if (!user) throw new Error("Tidak terautentikasi");

      const { data: orderRow, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          branch_id: branchId,
          category,
          total,
          notes: notes || null,
        })
        .select("id")
        .single();
      if (orderErr) throw orderErr;

      const itemsPayload = cart.map((it) => ({
        order_id: orderRow.id,
        product_id: it.product_id,
        product_name: it.product_name,
        quantity: it.quantity,
        price: it.price,
      }));
      const { error: itemErr } = await supabase.from("order_items").insert(itemsPayload);
      if (itemErr) throw itemErr;
    },
    onSuccess: () => {
      toast.success("Pesanan tercatat!", { description: "Royalti 5% otomatis dikirim ke smart contract." });
      setCart([]);
      setNotes("");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["royalty"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal"),
  });

  // filtering for history
  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;
    const now = new Date();
    let cut = new Date(0);
    if (filter === "today") cut = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (filter === "week") cut = new Date(now.getTime() - 7 * 86400000);
    else if (filter === "month") cut = new Date(now.getFullYear(), now.getMonth(), 1);
    return orders.filter((o) => new Date(o.created_at) >= cut);
  }, [orders, filter]);

  const periodOmzet = filteredOrders.reduce((a, o) => a + Number(o.total), 0);
  const branchName = (id: string | null) => branches.find((b) => b.id === id)?.name ?? "—";

  const exportPDF = () => {
    exportToPDF({
      title: "Laporan Penjualan Kasir",
      subtitle: `Periode: ${filter} • ENGGAL CHAIN`,
      headers: ["Tanggal", "Cabang", "Kategori", "Total", "Catatan"],
      rows: filteredOrders.map((o) => [
        new Date(o.created_at).toLocaleString("id-ID"),
        branchName(o.branch_id),
        o.category,
        formatRupiahFull(Number(o.total)),
        o.notes ?? "-",
      ]),
      filename: `kasir-${filter}-${new Date().toISOString().slice(0, 10)}.pdf`,
    });
    toast.success("PDF diunduh");
  };

  const exportExcel = () => {
    exportToExcel({
      sheetName: "Kasir",
      headers: ["Tanggal", "Cabang", "Kategori", "Total", "Catatan"],
      rows: filteredOrders.map((o) => [
        new Date(o.created_at).toLocaleString("id-ID"),
        branchName(o.branch_id),
        o.category,
        Number(o.total),
        o.notes ?? "",
      ]),
      filename: `kasir-${filter}-${new Date().toISOString().slice(0, 10)}.xlsx`,
    });
    toast.success("Excel diunduh");
  };

  return (
    <>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
          <ShoppingCart className="size-3" /> Kasir POS
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Input Pesanan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buat pesanan multi-produk. Setiap order memicu royalti & loyalty point otomatis.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form kiri */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Cabang</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Pilih cabang" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kategori</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tambah Produk</Label>
                <Select value="" onValueChange={addProduct}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Pilih produk..." /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {formatRupiahFull(Number(p.default_price))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-0">
            <div className="border-b border-border/40 p-4">
              <h3 className="font-semibold">Keranjang</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="w-24 text-right">Qty</TableHead>
                  <TableHead className="w-40 text-right">Harga</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      Keranjang kosong. Tambahkan produk di atas.
                    </TableCell>
                  </TableRow>
                ) : cart.map((it, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{it.product_name}</TableCell>
                    <TableCell className="text-right">
                      <Input type="number" min="1" value={it.quantity}
                        onChange={(e) => updateItem(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                        className="h-8 w-20 text-right" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input type="number" min="0" value={it.price}
                        onChange={(e) => updateItem(idx, { price: Number(e.target.value) || 0 })}
                        className="h-8 w-32 text-right" />
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-gold">
                      {formatRupiahFull(it.quantity * it.price)}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(idx)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Ringkasan kanan */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold">Ringkasan</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Item</span><span>{cart.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Qty total</span><span>{cart.reduce((a, c) => a + c.quantity, 0)}</span></div>
              <div className="flex justify-between border-t border-border/40 pt-2 text-base">
                <span className="font-semibold">Total</span>
                <span className="font-display text-xl font-bold text-gradient-gold">{formatRupiahFull(total)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Royalti 5%</span>
                <span className="font-mono text-gold">{((total * 0.05) / 12000).toFixed(4)} MATIC</span>
              </div>
            </div>
            <div className="mt-4">
              <Label className="text-xs">Catatan (opsional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1" />
            </div>
            <Button
              variant="gold" className="mt-4 w-full"
              onClick={() => submit.mutate()}
              disabled={submit.isPending || cart.length === 0 || !branchId}
            >
              <Receipt className="size-4" />
              {submit.isPending ? "Menyimpan..." : "Simpan Pesanan"}
            </Button>
          </Card>
        </div>
      </div>

      {/* Riwayat */}
      <div className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">Riwayat Pesanan</h2>
          <div className="flex flex-wrap gap-2">
            {(["today", "week", "month", "all"] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "gold" : "outline"} onClick={() => setFilter(f)}>
                {f === "today" ? "Hari ini" : f === "week" ? "7 Hari" : f === "month" ? "Bulan ini" : "Semua"}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={exportPDF} disabled={filteredOrders.length === 0}>
              <Download className="size-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportExcel} disabled={filteredOrders.length === 0}>
              <Download className="size-4" /> Excel
            </Button>
          </div>
        </div>
        <Card className="mb-3 p-4 text-sm">
          <span className="text-muted-foreground">Total {filter}: </span>
          <span className="font-display font-bold text-gradient-gold">{formatRupiahFull(periodOmzet)}</span>
          <span className="ml-3 text-muted-foreground">({filteredOrders.length} pesanan)</span>
        </Card>
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Cabang</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Belum ada pesanan.</TableCell></TableRow>
              ) : filteredOrders.slice(0, 30).map((o) => {
                const its = items.filter((i) => i.order_id === o.id);
                const cat = CATEGORIES.find((c) => c.value === o.category);
                return (
                  <TableRow key={o.id}>
                    <TableCell className="text-xs text-muted-foreground">{timeAgo(o.created_at)}</TableCell>
                    <TableCell>{branchName(o.branch_id)}</TableCell>
                    <TableCell><Badge variant="outline" className={cat?.color}>{cat?.label}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {its.length === 0 ? "—" : its.map((i) => `${i.product_name}×${i.quantity}`).join(", ")}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-gold">
                      {formatRupiahFull(Number(o.total))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
