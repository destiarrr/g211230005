import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  Coins,
  Crown,
  FileSpreadsheet,
  FileText,
  Loader2,
  MapPin,
  Package,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RequireAuth } from "@/components/AuthGuards";
import {
  fetchBranches,
  fetchSales,
  fetchStock,
  fetchRoyaltyTx,
  formatRupiah,
  formatRupiahFull,
  timeAgo,
} from "@/lib/queries";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Owner Dashboard — ENGGAL GROUP" },
      {
        name: "description",
        content:
          "Dashboard owner pusat ENGGAL GROUP. Pantau omzet, royalti, performa cabang, dan stok bahan baku secara real-time.",
      },
    ],
  }),
  component: DashboardPageGuarded,
});

function DashboardPageGuarded() {
  return (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  );
}

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];


function DashboardPage() {
  const branchesQ = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });
  const salesQ = useQuery({ queryKey: ["sales"], queryFn: fetchSales });
  const stockQ = useQuery({ queryKey: ["stock"], queryFn: fetchStock });
  const royaltyQ = useQuery({ queryKey: ["royalty"], queryFn: fetchRoyaltyTx });

  const loading =
    branchesQ.isLoading || salesQ.isLoading || stockQ.isLoading || royaltyQ.isLoading;

  const branches = branchesQ.data ?? [];
  const sales = salesQ.data ?? [];
  const stock = stockQ.data ?? [];
  const royalty = royaltyQ.data ?? [];

  // Today
  const today = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter((s) => s.sale_date === today);
  const todayOmzet = todaySales.reduce((a, s) => a + Number(s.total_amount), 0);
  const txCount24h = todaySales.length;

  // Royalty total (7d)
  const royaltyTotal = royalty.reduce(
    (a, r) => (r.tx_type === "royalty" ? a + Number(r.amount) : a),
    0,
  );

  // Weekly omzet by day-of-week (last 7 days)
  const weekly: Record<string, number> = Object.fromEntries(DAYS.map((d) => [d, 0]));
  const last7 = new Date();
  last7.setDate(last7.getDate() - 6);
  sales.forEach((s) => {
    const d = new Date(s.sale_date);
    if (d >= last7) {
      weekly[DAYS[d.getDay()]] += Number(s.total_amount) / 1_000_000;
    }
  });
  const revenueData = DAYS.map((day) => ({ day, value: Number(weekly[day].toFixed(2)) }));
  const weeklyTotal = revenueData.reduce((a, r) => a + r.value, 0);

  // Top branches by total sales
  const branchTotals = new Map<string, number>();
  sales.forEach((s) => {
    branchTotals.set(s.branch_id, (branchTotals.get(s.branch_id) ?? 0) + Number(s.total_amount));
  });
  const topBranches = branches
    .map((b) => ({
      ...b,
      omzet: branchTotals.get(b.id) ?? 0,
    }))
    .sort((a, b) => b.omzet - a.omzet)
    .slice(0, 5);

  const branchData = topBranches.map((b) => ({
    name: b.city,
    value: Number((b.omzet / 1_000_000).toFixed(1)),
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          {/* Header */}
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
                <Crown className="size-3" />
                Owner Pusat
              </div>
              <h1 className="font-display text-3xl font-bold md:text-4xl">
                Selamat datang, <span className="text-gradient-gold">Owner</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Ringkasan performa franchise • {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="glass"
                size="default"
                disabled={sales.length === 0}
                onClick={() => {
                  const headers = ["Tanggal", "Cabang", "Produk", "Qty", "Harga", "Total"];
                  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? "-";
                  const rows = sales.map((s) => [
                    s.sale_date,
                    branchName(s.branch_id),
                    s.product_name,
                    s.quantity,
                    Number(s.unit_price),
                    Number(s.total_amount),
                  ]);
                  exportToPDF({
                    title: "Laporan Penjualan",
                    subtitle: `Total ${sales.length} transaksi • ${formatRupiahFull(sales.reduce((a, s) => a + Number(s.total_amount), 0))}`,
                    headers,
                    rows,
                    filename: `laporan-penjualan-${today}.pdf`,
                  });
                }}
              >
                <FileText className="size-4" /> PDF Penjualan
              </Button>
              <Button
                variant="glass"
                size="default"
                disabled={sales.length === 0}
                onClick={() => {
                  const headers = ["Tanggal", "Cabang", "Produk", "Qty", "Harga", "Total"];
                  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? "-";
                  const rows = sales.map((s) => [
                    s.sale_date,
                    branchName(s.branch_id),
                    s.product_name,
                    s.quantity,
                    Number(s.unit_price),
                    Number(s.total_amount),
                  ]);
                  exportToExcel({
                    sheetName: "Penjualan",
                    headers,
                    rows,
                    filename: `laporan-penjualan-${today}.xlsx`,
                  });
                }}
              >
                <FileText className="size-4" /> Excel Penjualan
              </Button>
              <Button
                variant="glass"
                size="default"
                disabled={royalty.length === 0}
                onClick={() => {
                  const headers = ["Tanggal", "Tipe", "Tx Hash", "Amount", "Currency", "Status"];
                  const rows = royalty.map((r) => [
                    new Date(r.created_at).toLocaleString("id-ID"),
                    r.tx_type,
                    r.tx_hash,
                    Number(r.amount),
                    r.currency,
                    r.status,
                  ]);
                  exportToPDF({
                    title: "Laporan Royalti On-Chain",
                    subtitle: `${royalty.length} transaksi blockchain`,
                    headers,
                    rows,
                    filename: `laporan-royalti-${today}.pdf`,
                  });
                }}
              >
                <FileText className="size-4" /> PDF Royalti
              </Button>
              <Link to="/mitra">
                <Button variant="gold" size="default">
                  <Plus className="size-4" /> Input Penjualan
                </Button>
              </Link>
            </div>
          </div>

          {loading && (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Memuat data dari Lovable Cloud...
            </div>
          )}

          {/* KPI Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: TrendingUp,
                label: "Omzet Hari Ini",
                value: formatRupiah(todayOmzet),
                change: todaySales.length > 0 ? "Live" : "Belum ada",
                up: true,
              },
              {
                icon: Activity,
                label: "Transaksi Hari Ini",
                value: txCount24h.toLocaleString("id-ID"),
                change: "Real-time",
                up: true,
              },
              {
                icon: Coins,
                label: "Royalti Terkumpul",
                value: `${royaltyTotal.toFixed(2)} MATIC`,
                change: "On-chain",
                up: true,
              },
              {
                icon: Users,
                label: "Cabang Aktif",
                value: branches.filter((b) => b.status === "active").length.toString(),
                change: `${branches.length} total`,
                up: true,
              },
            ].map((k) => (
              <div
                key={k.label}
                className="glass-card relative overflow-hidden rounded-2xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15 text-gold">
                    <k.icon className="size-5" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      k.up
                        ? "bg-success/15 text-success"
                        : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {k.up ? (
                      <ArrowUpRight className="size-3" />
                    ) : (
                      <ArrowDownRight className="size-3" />
                    )}
                    {k.change}
                  </span>
                </div>
                <div className="mt-5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {k.label}
                  </div>
                  <div className="mt-1 font-display text-2xl font-bold">
                    {k.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="glass-card rounded-2xl p-6 lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold">Omzet 7 Hari Terakhir</h3>
                  <p className="text-xs text-muted-foreground">Konsolidasi seluruh cabang (juta Rp)</p>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-bold text-gradient-gold">
                    Rp {weeklyTotal.toFixed(2)} jt
                  </div>
                  <div className="text-xs text-success">Live data</div>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.78 0.14 82)" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="oklch(0.78 0.14 82)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.01 70 / 40%)" />
                    <XAxis dataKey="day" stroke="oklch(0.7 0.02 85)" fontSize={12} />
                    <YAxis stroke="oklch(0.7 0.02 85)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.17 0.008 65)",
                        border: "1px solid oklch(0.78 0.14 82 / 30%)",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="oklch(0.78 0.14 82)"
                      strokeWidth={2.5}
                      fill="url(#goldFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-display text-lg font-semibold">Top Kota</h3>
              <p className="text-xs text-muted-foreground">Berdasarkan omzet (juta Rp)</p>
              <div className="mt-6 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="oklch(0.7 0.02 85)"
                      fontSize={12}
                      width={70}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.17 0.008 65)",
                        border: "1px solid oklch(0.78 0.14 82 / 30%)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill="oklch(0.78 0.14 82)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tables */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="glass-card rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold">Cabang Terbaik</h3>
                  <p className="text-xs text-muted-foreground">Total omzet semua waktu</p>
                </div>
                <MapPin className="size-5 text-gold" />
              </div>
              <div className="space-y-3">
                {topBranches.length === 0 && !loading && (
                  <p className="text-sm text-muted-foreground">
                    Belum ada cabang. <Link to="/cabang" className="text-gold hover:underline">Tambah cabang</Link>
                  </p>
                )}
                {topBranches.map((b, i) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-background/30 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold font-display text-sm font-bold text-gold-foreground">
                        #{i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{b.name}</div>
                        <div className="text-xs text-muted-foreground">{formatRupiah(b.omzet)}</div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-success">{b.city}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold">Transaksi Blockchain</h3>
                  <p className="text-xs text-muted-foreground">On-chain Polygon (mock)</p>
                </div>
                <Activity className="size-5 text-gold" />
              </div>
              <div className="space-y-3">
                {royalty.length === 0 && !loading && (
                  <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
                )}
                {royalty.slice(0, 6).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-background/30 p-4"
                  >
                    <div>
                      <div className="text-sm font-medium capitalize">{t.tx_type.replace("_", " ")}</div>
                      <div className="font-mono text-xs text-muted-foreground">{t.tx_hash}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gold">
                        +{Number(t.amount).toFixed(4)} {t.currency}
                      </div>
                      <div className="text-xs text-muted-foreground">{timeAgo(t.created_at)} lalu</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="mt-6 glass-card rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">Stok Bahan Baku Pusat</h3>
                <p className="text-xs text-muted-foreground">Tracked via supply chain smart contract</p>
              </div>
              <Package className="size-5 text-gold" />
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {stock.map((s) => {
                const pct = Math.min(100, Math.round((s.current_qty / Math.max(1, s.max_qty)) * 100));
                return (
                  <div key={s.id} className="rounded-lg border border-border/50 bg-background/30 p-4">
                    <div className="text-xs text-muted-foreground">{s.item_name}</div>
                    <div className="mt-1 font-display text-xl font-bold">{pct}%</div>
                    <div className="text-[10px] text-muted-foreground">{s.current_qty} / {s.max_qty} {s.unit}</div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border/60">
                      <div className="h-full bg-gradient-gold" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
