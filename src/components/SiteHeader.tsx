import { Link } from "@tanstack/react-router";
import { Menu, Wallet } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Beranda" },
  { to: "/franchise", label: "Franchise" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/investor", label: "Investor" },
  { to: "/about", label: "Tentang" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold shadow-gold">
            <span className="font-display text-lg font-bold text-gold-foreground">E</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-base font-bold tracking-wide text-foreground">
              ENGGAL
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold">
              Group
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-gold" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="gold" size="default">
            <Wallet className="size-4" />
            Connect Wallet
          </Button>
        </div>

        <button
          className="rounded-md p-2 text-foreground lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <Menu className="size-5" />
        </button>
      </div>

      <div
        className={cn(
          "border-t border-border/40 bg-background/95 backdrop-blur-xl lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="container mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="rounded-md px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              activeProps={{ className: "text-gold bg-accent" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
          <Button variant="gold" className="mt-2 w-full">
            <Wallet className="size-4" />
            Connect Wallet
          </Button>
        </nav>
      </div>
    </header>
  );
}
