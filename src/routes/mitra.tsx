import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Store, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { fetchBranches, fetchSales, formatRupiah, timeAgo } from "@/lib/queries";

export const Route = createFileRoute("/mitra")({
  head: () => ({
    meta: [
      { title: "Dashboard Mitra — ENGGAL GROUP" },
      {
        name: "description",
        content:
          "Input penjualan harian, pantau profit, dan kirim royalti otomatis via smart contract sebagai mitra franchise ENGGAL GROUP.",
      },
    ],
  }),
  component: MitraPage,
});

const PRODUCTS = [
  { name: "Cimol Stick Kentang", price: 10000 },
  { name: "Sosis Crispy", price: 12000 },
  { name: "Tahu Crispy", price: 8000 },
  { name: "Otak-otak Crispy", price: 13000 },
  { name: "Bakso Crispy", price: 11000 },
];

function MitraPage() {
  const qc = useQueryClient();
  const branchesQ = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });
  const salesQ = useQuery({ queryKey: ["sales"], queryFn: fetchSales });

  const [branchId, setBranchId] = useState<string>("");
  const [product, setProduct] = useState<string>(PRODUCTS[0].name);
  const [qty, setQty] = useState<string>("10");
  const [price, setPrice] = useState<string>(String(PRODUCTS[0].price));

  const branches = branchesQ.data ?? [];
  const sales = salesQ.data ?? [];

  const selectedBranch = branches.find((b) => b.id === branchId);
  const branchSales = branchId ? sales.filter((s) => s.branch_id === branchId) : [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = branchSales.filter((s) => s.sale_date === todayStr);
  const todayOmzet = todaySales.reduce((a, s) => a + Number(s.total_amount), 0);
  const todayProfit = todayOmzet * 0.35; // 35% margin demo
  const todayRoyalty = todayOmzet * 0.05;

  const insertSale = useMutation({
    mutationFn: async () => {
      if (!branchId) throw new Error("Pilih cabang terlebih dahulu");
      const q = parseInt(qty);
      const p = parseFloat(price);
      if (!q || q <= 0) throw new Error("Quantity tidak valid");
      if (!p || p <= 0) throw new Error("Harga tidak valid");

      const { error } = await supabase.from("sales").insert({
        branch_id: branchId,
        product_name: product,
        quantity: q,
        unit_price: p,
        sale_date: todayStr,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Penjualan tercatat! Royalti 5% otomatis dikirim ke smart contract.");
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["royalty"] });
      setQty("10");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Auto-pick first branch
  if (!branchId && branches.length > 0) {
    setBranchId(branches[0].id);
  }

  const handleProductChange = (v: string) => {
    setProduct(v);
    const p = PRODUCTS.find((x) => x.name === v);
    if (p) setPrice(String(p.price));
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
            <Store className="size-3" />
            Mitra Franchise
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">
            Dashboard <span className="text-gradient-gold">Mitra</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Input penjualan harian — royalti otomatis dihitung & dikirim via smart contract
          </p>

          {branches.length === 0 && !branchesQ.isLoading && (
            <div className="mt-6 rounded-lg border border-gold/30 bg-gold/5 p-4 text-sm">
              Belum ada cabang terdaftar.{" "}
              <Link to="/cabang" className="font-semibold text-gold hover:underline">
                Daftarkan cabang dulu →
              </Link>
            </div>
          )}

          {/* Branch selector */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="glass-card rounded-2xl p-6 lg:col-span-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Pilih Cabang
              </Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Pilih cabang Anda" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedBranch && (
                <div className="mt-6 space-y-3 border-t border-border/50 pt-6">
                  <div>
                    <div className="text-xs text-muted-foreground">Manajer</div>
                    <div className="text-sm font-medium">{selectedBranch.manager_name ?? "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Status Kontrak</div>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                      ● {selectedBranch.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Wallet</div>
                    <div className="flex items-center gap-1.5 font-mono text-xs text-gold">
                      <Wallet className="size-3" />
                      {selectedBranch.wallet_address?.slice(0, 8)}...
                      {selectedBranch.wallet_address?.slice(-4)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* KPI mitra */}
            <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
              {[
                { label: "Omzet Hari Ini", value: formatRupiah(todayOmzet), icon: TrendingUp },
                { label: "Profit (35%)", value: formatRupiah(todayProfit), icon: TrendingUp },
                {
                  label: "Royalti (5%)",
                  value: `${(todayRoyalty / 12000).toFixed(4)} MATIC`,
                  icon: Wallet,
                },
              ].map((k) => (
                <div key={k.label} className="glass-card rounded-2xl p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15 text-gold">
                    <k.icon className="size-5" />
                  </div>
                  <div className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">
                    {k.label}
                  </div>
                  <div className="mt-1 font-display text-xl font-bold">{k.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Form input penjualan */}
          <div className="mt-6 glass-card rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold">Input Penjualan Hari Ini</h3>
            <p className="text-xs text-muted-foreground">
              Setiap entry akan otomatis trigger smart contract royalty 5%
            </p>
            <form
              className="mt-6 grid gap-4 md:grid-cols-4"
              onSubmit={(e) => {
                e.preventDefault();
                insertSale.mutate();
              }}
            >
              <div>
                <Label>Produk</Label>
                <Select value={product} onValueChange={handleProductChange}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCTS.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  className="mt-2"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </div>
              <div>
                <Label>Harga / pcs (Rp)</Label>
                <Input
                  type="number"
                  min="0"
                  className="mt-2"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  variant="gold"
                  className="w-full"
                  disabled={insertSale.isPending || !branchId}
                >
                  {insertSale.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Catat Penjualan
                </Button>
              </div>
            </form>
            <div className="mt-4 rounded-lg border border-border/50 bg-background/30 p-3 text-xs">
              <span className="text-muted-foreground">Estimasi total: </span>
              <span className="font-display font-bold text-gradient-gold">
                {formatRupiah((parseInt(qty) || 0) * (parseFloat(price) || 0))}
              </span>
              <span className="ml-3 text-muted-foreground">Royalti otomatis: </span>
              <span className="font-mono font-semibold text-gold">
                {(((parseInt(qty) || 0) * (parseFloat(price) || 0) * 0.05) / 12000).toFixed(4)} MATIC
              </span>
            </div>
          </div>

          {/* Riwayat */}
          <div className="mt-6 glass-card rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold">Riwayat Penjualan Cabang</h3>
            <p className="text-xs text-muted-foreground">10 transaksi terakhir</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2">Tanggal</th>
                    <th className="pb-2">Produk</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Harga</th>
                    <th className="pb-2 text-right">Total</th>
                    <th className="pb-2 text-right">Dibuat</th>
                  </tr>
                </thead>
                <tbody>
                  {branchSales.slice(0, 10).map((s) => (
                    <tr key={s.id} className="border-b border-border/30">
                      <td className="py-3">{s.sale_date}</td>
                      <td className="py-3">{s.product_name}</td>
                      <td className="py-3 text-right">{s.quantity}</td>
                      <td className="py-3 text-right">{formatRupiah(Number(s.unit_price))}</td>
                      <td className="py-3 text-right font-semibold text-gold">
                        {formatRupiah(Number(s.total_amount))}
                      </td>
                      <td className="py-3 text-right text-xs text-muted-foreground">
                        {timeAgo(s.created_at)} lalu
                      </td>
                    </tr>
                  ))}
                  {branchSales.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                        Belum ada penjualan untuk cabang ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
