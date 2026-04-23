import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, User as UserIcon, Wallet } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const navItems = [
  { to: "/", label: "Beranda" },
  { to: "/franchise", label: "Franchise" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/mitra", label: "Mitra" },
  { to: "/cabang", label: "Cabang" },
  { to: "/investor", label: "Investor" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Berhasil keluar");
    void navigate({ to: "/" });
  };

  const roleBadge = role ? (
    <Badge variant="outline" className="border-gold/40 text-gold capitalize">
      {role}
    </Badge>
  ) : null;

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
          {user ? (
            <>
              {roleBadge}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <UserIcon className="size-4" />
                    <span className="max-w-[140px] truncate">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Akun saya</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void navigate({ to: "/dashboard" })}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="size-4" /> Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth">Masuk</Link>
              </Button>
              <Button variant="gold" size="default">
                <Wallet className="size-4" />
                Connect Wallet
              </Button>
            </>
          )}
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
          {user ? (
            <>
              <div className="mt-2 flex items-center justify-between rounded-md border border-border/40 px-3 py-2">
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                {roleBadge}
              </div>
              <Button variant="outline" className="mt-2 w-full" onClick={handleSignOut}>
                <LogOut className="size-4" /> Keluar
              </Button>
            </>
          ) : (
            <Button variant="gold" className="mt-2 w-full" asChild>
              <Link to="/auth" onClick={() => setOpen(false)}>
                Masuk / Daftar
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
