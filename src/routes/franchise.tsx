import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  Check,
  Coins,
  FileSignature,
  Handshake,
  Receipt,
  Shield,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/franchise")({
  head: () => ({
    meta: [
      { title: "Franchise Hub — ENGGAL GROUP" },
      {
        name: "description",
        content:
          "Bergabung sebagai mitra franchise ENGGAL GROUP. Paket Starter, Growth, dan Enterprise dengan smart contract royalti otomatis.",
      },
    ],
  }),
  component: FranchisePage,
});

const packages = [
  {
    name: "Starter",
    price: "Rp 15 jt",
    desc: "Untuk pemula yang ingin memulai bisnis kuliner",
    features: [
      "1 booth lengkap",
      "Training 3 hari",
      "Bahan baku awal 1 minggu",
      "Smart contract franchise",
      "Royalti 5%",
    ],
    cta: "Pilih Starter",
    highlight: false,
  },
  {
    name: "Growth",
    price: "Rp 35 jt",
    desc: "Paling populer untuk skala menengah",
    features: [
      "2 booth premium",
      "Training 7 hari + mentoring",
      "Bahan baku awal 1 bulan",
      "Smart contract + reward token",
      "Royalti 4%",
      "Marketing support",
    ],
    cta: "Pilih Growth",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Rp 80 jt",
    desc: "Untuk investor & area developer",
    features: [
      "5 booth premium + lokasi A",
      "Training tim lengkap",
      "Bahan baku awal 3 bulan",
      "Profit sharing on-chain",
      "Royalti 3%",
      "Eksklusif area kota",
    ],
    cta: "Pilih Enterprise",
    highlight: false,
  },
];

function FranchisePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 -z-10 opacity-50">
            <div className="absolute left-1/2 top-0 h-96 w-[600px] -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
          </div>
          <div className="container mx-auto max-w-7xl px-4 py-20 text-center md:px-6 md:py-28">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
              <Handshake className="size-3.5" />
              Mitra Franchise
            </div>
            <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold md:text-6xl">
              Mulai bisnis kuliner dengan{" "}
              <span className="text-gradient-gold">jaminan blockchain</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
              Pilih paket franchise yang sesuai. Smart contract akan otomatis
              mengatur royalti, profit sharing, dan reward sehingga Anda fokus
              pada operasional cabang.
            </p>
          </div>
        </section>

        {/* Packages */}
        <section className="py-20 md:py-24">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {packages.map((p) => (
                <div
                  key={p.name}
                  className={`relative overflow-hidden rounded-3xl border p-8 transition-all ${
                    p.highlight
                      ? "border-gold/60 bg-gradient-dark shadow-gold"
                      : "border-border/60 bg-card/40 hover:-translate-y-1 hover:border-gold/40"
                  }`}
                >
                  {p.highlight && (
                    <div className="absolute right-6 top-6 rounded-full bg-gradient-gold px-3 py-1 text-xs font-bold text-gold-foreground">
                      POPULAR
                    </div>
                  )}
                  <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
                    <Award className="size-3.5" />
                    {p.name}
                  </div>
                  <div className="mt-2 font-display text-4xl font-bold">
                    {p.price}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>

                  <div className="my-6 gold-divider" />

                  <ul className="space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                          <Check className="size-3" />
                        </div>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={p.highlight ? "gold" : "gold-outline"}
                    className="mt-8 w-full"
                    size="lg"
                  >
                    {p.cta}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mitra benefits */}
        <section className="border-t border-border/40 py-20 md:py-24">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold md:text-5xl">
                Yang mitra <span className="text-gradient-gold">dapatkan</span>
              </h2>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Receipt,
                  title: "Input Penjualan Mudah",
                  desc: "Catat penjualan harian via dashboard mitra. Otomatis sinkron ke pusat.",
                },
                {
                  icon: Coins,
                  title: "Royalti Otomatis",
                  desc: "Smart contract memotong & mentransfer royalti tanpa proses manual.",
                },
                {
                  icon: Shield,
                  title: "Kontrak Transparan",
                  desc: "Status kontrak franchise dapat diaudit kapan saja di blockchain explorer.",
                },
                {
                  icon: Store,
                  title: "Stok Terpantau",
                  desc: "Pantau stok bahan baku cabang dan request restock real-time.",
                },
              ].map((b) => (
                <div
                  key={b.title}
                  className="glass-card rounded-2xl p-6 text-center"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
                    <b.icon className="size-5 text-gold-foreground" />
                  </div>
                  <h3 className="font-display text-base font-semibold">
                    {b.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center md:px-6">
            <FileSignature className="mx-auto mb-4 size-10 text-gold" />
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Tanda tangani kontrak Anda{" "}
              <span className="text-gradient-gold">secara on-chain</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Tim kami akan memandu proses verifikasi, deploy smart contract,
              dan onboarding lokasi cabang dalam 7 hari kerja.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button variant="gold" size="xl">
                Konsultasi Gratis
              </Button>
              <Button variant="gold-outline" size="xl" asChild>
                <Link to="/dashboard">Lihat Dashboard</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
