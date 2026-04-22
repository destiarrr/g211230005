import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  LineChart as LineIcon,
  PieChart as PieIcon,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/investor")({
  head: () => ({
    meta: [
      { title: "Investor Portal — ENGGAL GROUP" },
      {
        name: "description",
        content:
          "Akses laporan keuangan transparan ENGGAL GROUP, danai ekspansi cabang baru, pantau ROI on-chain.",
      },
    ],
  }),
  component: InvestorPage,
});

const growthData = [
  { m: "Jan", v: 124 },
  { m: "Feb", v: 142 },
  { m: "Mar", v: 168 },
  { m: "Apr", v: 195 },
  { m: "Mei", v: 224 },
  { m: "Jun", v: 268 },
  { m: "Jul", v: 312 },
];

const allocation = [
  { name: "Operasional", value: 45 },
  { name: "Ekspansi", value: 30 },
  { name: "Marketing", value: 15 },
  { name: "R&D Produk", value: 10 },
];

const COLORS = [
  "oklch(0.78 0.14 82)",
  "oklch(0.86 0.09 88)",
  "oklch(0.6 0.1 75)",
  "oklch(0.45 0.08 70)",
];

const opportunities = [
  {
    city: "Yogyakarta",
    target: "Rp 500 jt",
    raised: 78,
    roi: "24%/tahun",
    branches: 5,
  },
  {
    city: "Makassar",
    target: "Rp 750 jt",
    raised: 52,
    roi: "22%/tahun",
    branches: 8,
  },
  {
    city: "Semarang",
    target: "Rp 400 jt",
    raised: 91,
    roi: "26%/tahun",
    branches: 4,
  },
];

function InvestorPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 -z-10 opacity-40">
            <div className="absolute left-1/4 top-10 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
            <div className="absolute right-1/4 top-32 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
          </div>
          <div className="container mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
                  <TrendingUp className="size-3.5" />
                  Investor Portal
                </div>
                <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
                  Investasi UMKM kuliner,{" "}
                  <span className="text-gradient-gold">terverifikasi blockchain</span>
                </h1>
                <p className="mt-5 text-muted-foreground">
                  Setiap rupiah yang Anda tanam tercatat on-chain. Laporan
                  keuangan, alokasi dana, dan distribusi profit dapat diaudit
                  kapan saja.
                </p>
                <div className="mt-8 flex gap-3">
                  <Button variant="gold" size="xl">
                    <Wallet className="size-4" /> Connect Wallet
                  </Button>
                  <Button variant="gold-outline" size="xl">
                    Lihat Pitch Deck
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Building2, label: "Total Aset", v: "Rp 14.2 M" },
                  { icon: TrendingUp, label: "ROI 12 bulan", v: "23.4%" },
                  { icon: BarChart3, label: "Cabang Didanai", v: "47" },
                  { icon: Target, label: "Target 2026", v: "200 cabang" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="glass-card rounded-2xl p-5"
                  >
                    <s.icon className="size-5 text-gold" />
                    <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                    <div className="mt-1 font-display text-2xl font-bold text-gradient-gold">
                      {s.v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Charts */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="glass-card rounded-2xl p-6 lg:col-span-2">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gold">
                  <LineIcon className="size-3.5" /> Growth
                </div>
                <h3 className="font-display text-xl font-semibold">
                  Pertumbuhan Omzet Konsolidasi
                </h3>
                <p className="text-xs text-muted-foreground">
                  Dalam miliar rupiah • 7 bulan terakhir
                </p>
                <div className="mt-6 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="oklch(0.3 0.01 70 / 40%)"
                      />
                      <XAxis dataKey="m" stroke="oklch(0.7 0.02 85)" fontSize={12} />
                      <YAxis stroke="oklch(0.7 0.02 85)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(0.17 0.008 65)",
                          border: "1px solid oklch(0.78 0.14 82 / 30%)",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="v"
                        stroke="oklch(0.78 0.14 82)"
                        strokeWidth={3}
                        dot={{ fill: "oklch(0.78 0.14 82)", r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gold">
                  <PieIcon className="size-3.5" /> Allocation
                </div>
                <h3 className="font-display text-xl font-semibold">
                  Alokasi Dana
                </h3>
                <p className="text-xs text-muted-foreground">
                  Berdasarkan smart contract treasury
                </p>
                <div className="mt-2 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocation}
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {allocation.map((_, i) => (
                          <Cell key={i} fill={COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(0.17 0.008 65)",
                          border: "1px solid oklch(0.78 0.14 82 / 30%)",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-2">
                  {allocation.map((a, i) => (
                    <div key={a.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[i] }}
                        />
                        <span className="text-muted-foreground">{a.name}</span>
                      </div>
                      <span className="font-semibold">{a.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Crowdfunding opportunities */}
        <section className="border-t border-border/40 py-20">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
                  Crowdfunding
                </div>
                <h2 className="font-display text-3xl font-bold md:text-5xl">
                  Peluang <span className="text-gradient-gold">ekspansi</span> aktif
                </h2>
              </div>
              <p className="max-w-md text-sm text-muted-foreground">
                Danai pembukaan cabang baru di kota target. Profit dibagi otomatis
                via smart contract setiap akhir bulan.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {opportunities.map((o) => (
                <div
                  key={o.city}
                  className="glass-card group rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-gold"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        Kota
                      </div>
                      <div className="font-display text-2xl font-bold">
                        {o.city}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-xs font-medium text-success">
                      <ArrowUpRight className="size-3" />
                      {o.roi}
                    </span>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-semibold">{o.target}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-border/60">
                      <div
                        className="h-full bg-gradient-gold"
                        style={{ width: `${o.raised}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>{o.raised}% terkumpul</span>
                      <span>{o.branches} cabang</span>
                    </div>
                  </div>

                  <Button variant="gold" className="mt-6 w-full">
                    Investasi Sekarang
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
