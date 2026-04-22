import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  Crown,
  Download,
  FileText,
  MapPin,
  Package,
  TrendingUp,
  Users,
  Wallet,
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
  component: DashboardPage,
});

const revenueData = [
  { day: "Sen", value: 18.4 },
  { day: "Sel", value: 22.1 },
  { day: "Rab", value: 19.8 },
  { day: "Kam", value: 26.3 },
  { day: "Jum", value: 31.2 },
  { day: "Sab", value: 38.7 },
  { day: "Min", value: 34.5 },
];

const branchData = [
  { name: "Bandung", value: 42 },
  { name: "Jakarta", value: 38 },
  { name: "Surabaya", value: 31 },
  { name: "Medan", value: 24 },
  { name: "Bali", value: 19 },
];

const topBranches = [
  { name: "Cabang Dago Bandung", omzet: "Rp 42.8M", growth: "+18%", up: true },
  { name: "Cabang Senopati Jakarta", omzet: "Rp 38.1M", growth: "+12%", up: true },
  { name: "Cabang Tunjungan Surabaya", omzet: "Rp 31.4M", growth: "+9%", up: true },
  { name: "Cabang Sudirman Medan", omzet: "Rp 24.6M", growth: "-3%", up: false },
];

const recentTx = [
  { hash: "0x7a3f...92bc", type: "Royalty", amount: "+2.45 MATIC", time: "2m" },
  { hash: "0x1d8e...44a1", type: "Profit Share", amount: "+8.12 MATIC", time: "14m" },
  { hash: "0xb2c0...f7e9", type: "Reward Token", amount: "+150 EGT", time: "1h" },
  { hash: "0x9f44...c031", type: "Franchise Fee", amount: "+25.00 MATIC", time: "3h" },
];

function DashboardPage() {
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
                Ringkasan performa franchise hari ini • 22 April 2026
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="glass" size="default">
                <FileText className="size-4" /> Export PDF
              </Button>
              <Button variant="gold-outline" size="default">
                <Download className="size-4" /> Export Excel
              </Button>
              <Button variant="gold" size="default">
                <Wallet className="size-4" /> 0x7a...92bc
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: TrendingUp,
                label: "Omzet Hari Ini",
                value: "Rp 248.4 jt",
                change: "+12.4%",
                up: true,
              },
              {
                icon: Activity,
                label: "Transaksi 24h",
                value: "8,492",
                change: "+8.1%",
                up: true,
              },
              {
                icon: Coins,
                label: "Royalti Terkumpul",
                value: "412 MATIC",
                change: "+24.7%",
                up: true,
              },
              {
                icon: Users,
                label: "Cabang Aktif",
                value: "127",
                change: "+3 baru",
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
                  <h3 className="font-display text-lg font-semibold">
                    Omzet Mingguan
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Total omzet konsolidasi seluruh cabang (juta Rp)
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-bold text-gradient-gold">
                    Rp 1.74 M
                  </div>
                  <div className="text-xs text-success">+18.2% vs minggu lalu</div>
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
              <h3 className="font-display text-lg font-semibold">Top 5 Kota</h3>
              <p className="text-xs text-muted-foreground">Berdasarkan omzet (juta)</p>
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
                    <Bar
                      dataKey="value"
                      fill="oklch(0.78 0.14 82)"
                      radius={[0, 6, 6, 0]}
                    />
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
                  <h3 className="font-display text-lg font-semibold">
                    Cabang Terbaik
                  </h3>
                  <p className="text-xs text-muted-foreground">Performa bulan ini</p>
                </div>
                <MapPin className="size-5 text-gold" />
              </div>
              <div className="space-y-3">
                {topBranches.map((b, i) => (
                  <div
                    key={b.name}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-background/30 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold font-display text-sm font-bold text-gold-foreground">
                        #{i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{b.name}</div>
                        <div className="text-xs text-muted-foreground">{b.omzet}</div>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        b.up ? "text-success" : "text-destructive"
                      }`}
                    >
                      {b.growth}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold">
                    Transaksi Blockchain
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    On-chain Polygon network
                  </p>
                </div>
                <Activity className="size-5 text-gold" />
              </div>
              <div className="space-y-3">
                {recentTx.map((t) => (
                  <div
                    key={t.hash}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-background/30 p-4"
                  >
                    <div>
                      <div className="text-sm font-medium">{t.type}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {t.hash}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gold">
                        {t.amount}
                      </div>
                      <div className="text-xs text-muted-foreground">{t.time} ago</div>
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
                <h3 className="font-display text-lg font-semibold">
                  Stok Bahan Baku Pusat
                </h3>
                <p className="text-xs text-muted-foreground">
                  Tracked via supply chain smart contract
                </p>
              </div>
              <Package className="size-5 text-gold" />
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {[
                { name: "Tepung Cimol", pct: 84 },
                { name: "Sosis Premium", pct: 62 },
                { name: "Tahu Pilihan", pct: 91 },
                { name: "Otak-otak", pct: 45 },
                { name: "Bakso Sapi", pct: 73 },
                { name: "Bumbu Spesial", pct: 58 },
              ].map((s) => (
                <div key={s.name} className="rounded-lg border border-border/50 bg-background/30 p-4">
                  <div className="text-xs text-muted-foreground">{s.name}</div>
                  <div className="mt-1 font-display text-xl font-bold">{s.pct}%</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border/60">
                    <div
                      className="h-full bg-gradient-gold"
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
