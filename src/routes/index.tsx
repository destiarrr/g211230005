import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Blocks,
  Coins,
  Package,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import heroBg from "@/assets/hero-bg.jpg";
import foodShowcase from "@/assets/food-showcase.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ENGGAL GROUP — Web3 Franchise Platform Kuliner UMKM" },
      {
        name: "description",
        content:
          "Platform Web3 franchise UMKM kuliner berbasis blockchain. Smart contract royalti otomatis, loyalty token, dan dashboard real-time untuk owner & mitra.",
      },
    ],
  }),
  component: HomePage,
});

const features = [
  {
    icon: Blocks,
    title: "Smart Contract Royalti",
    desc: "Pembagian royalti, franchise fee, dan profit sharing otomatis melalui smart contract Solidity di jaringan Polygon.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    desc: "Pantau omzet harian, mingguan, bulanan seluruh cabang dengan dashboard yang clean & responsif.",
  },
  {
    icon: Coins,
    title: "Loyalty Token",
    desc: "Setiap transaksi pelanggan menghasilkan token reward yang dapat ditukar voucher, cashback, atau membership.",
  },
  {
    icon: Package,
    title: "Supply Chain Tracking",
    desc: "Lacak bahan baku dari supplier ke pusat hingga cabang dengan validasi kualitas berbasis blockchain.",
  },
  {
    icon: ShieldCheck,
    title: "Transparansi Penuh",
    desc: "Setiap transaksi tercatat di blockchain. Owner, mitra, dan investor melihat data yang sama dan tidak bisa dimanipulasi.",
  },
  {
    icon: Users,
    title: "Investor Crowdfunding",
    desc: "Buka pendanaan ekspansi cabang baru dengan akses laporan keuangan transparan untuk para investor.",
  },
];

const stats = [
  { value: "120+", label: "Cabang Aktif" },
  { value: "Rp 2.4M", label: "Omzet Harian" },
  { value: "8K+", label: "Token Holder" },
  { value: "99.9%", label: "Uptime Smart Contract" },
];

const products = [
  "Cimol Stick Kentang",
  "Sosis Crispy",
  "Tahu Crispy",
  "Otak-otak Crispy",
  "Bakso Crispy",
  "Street Food Premium",
];

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 -z-10 bg-cover bg-center opacity-60"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/80 to-background" />

          <div className="container mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-32 lg:py-40">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-medium text-gold backdrop-blur">
                <Sparkles className="size-3.5" />
                Web3 Franchise Platform • Powered by Polygon
              </div>

              <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
                Masa Depan{" "}
                <span className="text-gradient-gold">Franchise UMKM</span>{" "}
                Kuliner Indonesia
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                ENGGAL GROUP menghadirkan platform franchise berbasis blockchain
                untuk Cimol Stick, Sosis Crispy, Tahu Crispy & jajanan street food
                lainnya. Royalti otomatis, profit sharing transparan, loyalty token
                untuk pelanggan.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button variant="gold" size="xl" asChild>
                  <Link to="/dashboard">
                    Buka Dashboard
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button variant="gold-outline" size="xl" asChild>
                  <Link to="/franchise">
                    <Wallet className="size-4" />
                    Daftar Mitra
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/40 md:grid-cols-4">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="bg-card/80 px-6 py-6 backdrop-blur"
                  >
                    <div className="font-display text-2xl font-bold text-gradient-gold md:text-3xl">
                      {s.value}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="relative py-20 md:py-28">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-gold">
                Fitur Unggulan
              </div>
              <h2 className="font-display text-3xl font-bold md:text-5xl">
                Semua yang Anda butuhkan untuk{" "}
                <span className="text-gradient-gold">scale franchise</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Dirancang untuk owner pusat, mitra cabang, pelanggan setia, dan
                investor yang ingin tumbuh bersama.
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group glass-card relative overflow-hidden rounded-2xl p-7 transition-all hover:-translate-y-1 hover:shadow-gold"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
                    <f.icon className="size-5 text-gold-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {f.desc}
                  </p>
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRODUCTS / SHOWCASE */}
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-gold opacity-20 blur-3xl" />
                <img
                  src={foodShowcase}
                  alt="Produk street food premium ENGGAL GROUP"
                  width={1280}
                  height={1280}
                  loading="lazy"
                  className="relative w-full rounded-3xl border border-gold/20 shadow-elegant"
                />
              </div>

              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-gold">
                  Produk Kami
                </div>
                <h2 className="font-display text-3xl font-bold md:text-5xl">
                  Jajanan Premium,{" "}
                  <span className="text-gradient-gold">Sistem Modern</span>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Bisnis kuliner street food yang sudah teruji rasa & pasarnya,
                  kini dikelola dengan teknologi yang biasa dipakai unicorn
                  global.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {products.map((p) => (
                    <div
                      key={p}
                      className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/40 px-4 py-3 backdrop-blur"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gold/15 text-gold">
                        <Store className="size-3.5" />
                      </div>
                      <span className="text-sm font-medium">{p}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <Button variant="gold" size="lg" asChild>
                    <Link to="/franchise">
                      Pelajari Paket Franchise <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="relative py-20 md:py-28">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-gold">
                Cara Kerja
              </div>
              <h2 className="font-display text-3xl font-bold md:text-5xl">
                Tiga langkah <span className="text-gradient-gold">on-chain</span>
              </h2>
            </div>

            <div className="relative mt-16 grid gap-8 md:grid-cols-3">
              <div className="absolute left-1/2 top-12 hidden h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-gold/50 to-transparent md:block" />
              {[
                {
                  icon: Wallet,
                  step: "01",
                  title: "Connect MetaMask",
                  desc: "Login sebagai owner, mitra, atau investor menggunakan wallet Web3 Anda.",
                },
                {
                  icon: Zap,
                  step: "02",
                  title: "Smart Contract Aktif",
                  desc: "Kontrak franchise & royalti dideploy otomatis. Aturan tidak bisa diubah sepihak.",
                },
                {
                  icon: TrendingUp,
                  step: "03",
                  title: "Tumbuh Bersama",
                  desc: "Pantau performa, terima royalti otomatis, dan dapatkan reward token loyalty.",
                },
              ].map((s) => (
                <div key={s.step} className="relative text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-gold/40 bg-background shadow-gold">
                    <s.icon className="size-9 text-gold" />
                  </div>
                  <div className="mt-4 font-display text-sm font-semibold tracking-widest text-gold">
                    STEP {s.step}
                  </div>
                  <h3 className="mt-2 font-display text-xl font-semibold">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-20 md:py-28">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-dark p-10 text-center shadow-elegant md:p-20">
              <div className="absolute inset-0 -z-10 opacity-30">
                <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-gold/30 blur-3xl" />
                <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
              </div>

              <h2 className="mx-auto max-w-3xl font-display text-3xl font-bold md:text-5xl">
                Siap menjadi bagian dari{" "}
                <span className="text-gradient-gold">revolusi UMKM</span>?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Bergabung dengan ratusan mitra yang sudah merasakan transparansi
                & kemudahan sistem franchise berbasis blockchain.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button variant="gold" size="xl" asChild>
                  <Link to="/franchise">Mulai Sekarang</Link>
                </Button>
                <Button variant="glass" size="xl" asChild>
                  <Link to="/investor">Saya Investor</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
