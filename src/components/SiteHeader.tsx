import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  LogOut,
  Menu,
  User as UserIcon,
  Wallet,
  Check,
} from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useWallet, shortAddr } from "@/hooks/use-wallet";
import { useNotifications } from "@/hooks/use-notifications";
import { timeAgo } from "@/lib/queries";
import { toast } from "sonner";

const navItems = [
  { to: "/", label: "Beranda" },
  { to: "/franchise", label: "Franchise" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/mitra", label: "Mitra" },
  { to: "/cabang", label: "Cabang" },
  { to: "/stok", label: "Stok" },
  { to: "/payments", label: "Pembayaran" },
  { to: "/loyalty", label: "Loyalty" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, role, signOut } = useAuth();
  const { address, connect, disconnect, connecting } = useWallet();
  const { notifications, unread, markAllRead } = useNotifications();
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

  const NotifBell = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <p className="text-sm font-semibold">Notifikasi</p>
          {unread > 0 && (
            <button
              onClick={() => void markAllRead()}
              className="text-xs text-gold hover:underline"
            >
              Tandai semua dibaca
            </button>
          )}
        </div>
        <ScrollArea className="h-72">
          {notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Belum ada notifikasi
            </p>
          ) : (
            <div className="divide-y divide-border/40">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-2 p-3 text-sm",
                    !n.read && "bg-gold/5",
                  )}
                >
                  <div
                    className={cn(
                      "mt-1 size-2 shrink-0 rounded-full",
                      n.type === "error" && "bg-destructive",
                      n.type === "warning" && "bg-warning",
                      n.type === "success" && "bg-success",
                      n.type === "info" && "bg-gold",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{n.title}</p>
                    {n.body && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {n.read && <Check className="size-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold shadow-gold">
            <span className="font-display text-lg font-bold text-gold-foreground">
              E
            </span>
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

        <nav className="hidden items-center gap-1 xl:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-gold" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          {user && <NotifBell />}
          {address ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-gold/40 text-gold">
                  <Wallet className="size-4" />
                  {shortAddr(address)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs">
                  Wallet terhubung
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    void navigator.clipboard.writeText(address);
                    toast.success("Address disalin");
                  }}
                >
                  Salin address
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void disconnect()}>
                  Putuskan wallet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => void connect()}
              disabled={connecting}
            >
              <Wallet className="size-4" />
              {connecting ? "Menghubungkan..." : "Connect Wallet"}
            </Button>
          )}
          {user ? (
            <>
              {roleBadge}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <UserIcon className="size-4" />
                    <span className="max-w-[120px] truncate">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Akun saya</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => void navigate({ to: "/dashboard" })}
                  >
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => void navigate({ to: "/loyalty" })}
                  >
                    Loyalty Token
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="size-4" /> Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button variant="gold" size="sm" asChild>
              <Link to="/auth">Masuk</Link>
            </Button>
          )}
        </div>

        <button
          className="rounded-md p-2 text-foreground xl:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <Menu className="size-5" />
        </button>
      </div>

      <div
        className={cn(
          "border-t border-border/40 bg-background/95 backdrop-blur-xl xl:hidden",
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
          <div className="mt-2 flex flex-col gap-2">
            {address ? (
              <Button
                variant="outline"
                className="w-full gap-2 border-gold/40 text-gold"
                onClick={() => void disconnect()}
              >
                <Wallet className="size-4" /> {shortAddr(address)} (Disconnect)
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => void connect()}
                disabled={connecting}
              >
                <Wallet className="size-4" />
                {connecting ? "Menghubungkan..." : "Connect Wallet"}
              </Button>
            )}
            {user ? (
              <>
                <div className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2">
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                  {roleBadge}
                </div>
                <Button variant="outline" className="w-full" onClick={handleSignOut}>
                  <LogOut className="size-4" /> Keluar
                </Button>
              </>
            ) : (
              <Button variant="gold" className="w-full" asChild>
                <Link to="/auth" onClick={() => setOpen(false)}>
                  Masuk / Daftar
                </Link>
              </Button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
