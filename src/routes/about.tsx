import { createFileRoute } from "@tanstack/react-router";
import { Code2, Database, Globe, Lock, Rocket, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Tentang ENGGAL GROUP — Web3 Franchise Platform" },
      {
        name: "description",
        content:
          "ENGGAL GROUP adalah platform Web3 yang menggabungkan UMKM kuliner dengan teknologi blockchain Polygon, smart contract Solidity, dan loyalty token.",
      },
    ],
  }),
  component: AboutPage,
});

const stack = [
  { icon: Globe, name: "Frontend", value: "Next.js • React • Tailwind CSS" },
  { icon: Code2, name: "Backend", value: "Node.js • Express.js" },
  { icon: Lock, name: "Blockchain", value: "Solidity • Polygon • Hardhat" },
  { icon: Sparkles, name: "Web3", value: "MetaMask • Ethers.js" },
  { icon: Database, name: "Database", value: "MongoDB / MySQL" },
  { icon: Rocket, name: "Infra", value: "Edge Cloud • Real-time" },
];

function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative border-b border-border/40">
          <div className="container mx-auto max-w-4xl px-4 py-20 text-center md:px-6 md:py-28">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
              Tentang Kami
            </div>
            <h1 className="font-display text-4xl font-bold md:text-6xl">
              Membangun masa depan{" "}
              <span className="text-gradient-gold">UMKM kuliner</span> Indonesia
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              ENGGAL GROUP lahir dari satu visi: membawa transparansi, otomatisasi,
              dan kepercayaan ke industri franchise UMKM lewat teknologi Web3 yang
              biasanya hanya dipakai perusahaan global.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Tech <span className="text-gradient-gold">Stack</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Dibangun production-ready untuk skala nasional.
              </p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {stack.map((s) => (
                <div key={s.name} className="glass-card rounded-2xl p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
                    <s.icon className="size-5 text-gold-foreground" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">
                    {s.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 py-20">
          <div className="container mx-auto max-w-4xl px-4 md:px-6">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="glass-card rounded-2xl p-8">
                <h3 className="font-display text-2xl font-bold text-gold">
                  Visi
                </h3>
                <p className="mt-4 text-muted-foreground">
                  Menjadi platform franchise UMKM kuliner berbasis blockchain
                  terbesar di Asia Tenggara dalam 5 tahun.
                </p>
              </div>
              <div className="glass-card rounded-2xl p-8">
                <h3 className="font-display text-2xl font-bold text-gold">
                  Misi
                </h3>
                <p className="mt-4 text-muted-foreground">
                  Memberdayakan UMKM kuliner Indonesia dengan teknologi yang
                  transparan, adil, dan otomatis—agar mitra, owner, dan
                  pelanggan tumbuh bersama.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
