import { Link } from "@tanstack/react-router";
import { Github, Instagram, Twitter } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/50">
      <div className="container mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold">
                <span className="font-display text-lg font-bold text-gold-foreground">E</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-base font-bold">ENGGAL</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold">
                  Group
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Platform Web3 franchise UMKM kuliner pertama di Indonesia. Transparan,
              otomatis, terdesentralisasi.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
              >
                <Twitter className="size-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
              >
                <Instagram className="size-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
              >
                <Github className="size-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-gold">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/dashboard" className="hover:text-foreground">
                  Owner Dashboard
                </Link>
              </li>
              <li>
                <Link to="/franchise" className="hover:text-foreground">
                  Franchise Hub
                </Link>
              </li>
              <li>
                <Link to="/investor" className="hover:text-foreground">
                  Investor Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-gold">
              Teknologi
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>Smart Contract Solidity</li>
              <li>Polygon Network</li>
              <li>MetaMask Integration</li>
              <li>Loyalty Token</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-gold">
              Kontak
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>hello@enggalgroup.id</li>
              <li>Bandung, Indonesia</li>
              <li>+62 812 0000 0000</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 text-xs text-muted-foreground md:flex-row">
          <p>© 2025 ENGGAL GROUP. All rights reserved.</p>
          <p>
            Powered by <span className="text-gold">Blockchain Technology</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
