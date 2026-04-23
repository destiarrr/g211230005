import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Gift, History, Sparkles, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/AuthGuards";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchMyLoyalty,
  fetchMyLoyaltyTx,
  fetchVouchers,
  timeAgo,
  type Voucher,
} from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/loyalty")({
  component: LoyaltyPage,
});

function LoyaltyPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container mx-auto max-w-7xl px-4 py-10 md:px-6">
          <LoyaltyInner />
        </main>
        <SiteFooter />
      </div>
    </RequireAuth>
  );
}

function LoyaltyInner() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const accountQ = useQuery({
    queryKey: ["loyalty", user?.id],
    queryFn: () => fetchMyLoyalty(user!.id),
    enabled: !!user,
  });
  const txQ = useQuery({
    queryKey: ["loyalty-tx", user?.id],
    queryFn: () => fetchMyLoyaltyTx(user!.id),
    enabled: !!user,
  });
  const vouchersQ = useQuery({ queryKey: ["vouchers"], queryFn: fetchVouchers });

  const balance = accountQ.data?.balance ?? 0;
  const earned = accountQ.data?.total_earned ?? 0;
  const redeemed = accountQ.data?.total_redeemed ?? 0;
  const txs = txQ.data ?? [];
  const vouchers = vouchersQ.data ?? [];

  const redeemMutation = useMutation({
    mutationFn: async (voucher: Voucher) => {
      if (!user) throw new Error("Login dulu");
      if (balance < voucher.cost_points)
        throw new Error("Saldo poin tidak cukup");

      const newBalance = balance - voucher.cost_points;
      const newRedeemed = redeemed + voucher.cost_points;

      // Upsert loyalty account
      const { error: e1 } = await supabase.from("loyalty_accounts").upsert({
        user_id: user.id,
        balance: newBalance,
        total_earned: earned,
        total_redeemed: newRedeemed,
      });
      if (e1) throw e1;

      // Log transaction
      const { error: e2 } = await supabase.from("loyalty_transactions").insert({
        user_id: user.id,
        amount: voucher.cost_points,
        tx_type: "redeem",
        reference: voucher.id,
      });
      if (e2) throw e2;

      // Insert redemption
      const { error: e3 } = await supabase.from("voucher_redemptions").insert({
        user_id: user.id,
        voucher_id: voucher.id,
        points_spent: voucher.cost_points,
      });
      if (e3) throw e3;

      // Self notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Voucher berhasil ditukar",
        body: `${voucher.title} — ${voucher.cost_points} ENGGAL token digunakan.`,
        type: "success",
      });
    },
    onSuccess: () => {
      toast.success("Voucher berhasil ditukar! 🎉");
      qc.invalidateQueries({ queryKey: ["loyalty", user?.id] });
      qc.invalidateQueries({ queryKey: ["loyalty-tx", user?.id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal redeem"),
  });

  // Demo: button to simulate earning points (for owner/customer testing)
  const earnDemo = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const earnAmount = 100;
      const newBalance = balance + earnAmount;
      const newEarned = earned + earnAmount;

      const { error: e1 } = await supabase.from("loyalty_accounts").upsert({
        user_id: user.id,
        balance: newBalance,
        total_earned: newEarned,
        total_redeemed: redeemed,
      });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("loyalty_transactions").insert({
        user_id: user.id,
        amount: earnAmount,
        tx_type: "earn",
        reference: "demo-bonus",
      });
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("+100 ENGGAL token (demo)");
      qc.invalidateQueries({ queryKey: ["loyalty", user?.id] });
      qc.invalidateQueries({ queryKey: ["loyalty-tx", user?.id] });
    },
  });

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          ENGGAL Loyalty Token
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kumpulkan token, tukar dengan voucher & cashback eksklusif.
        </p>
      </div>

      {/* Balance card */}
      <Card className="mb-6 overflow-hidden border-gold/30 bg-gradient-to-br from-gold/15 via-card to-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Saldo ENGGAL Token
            </p>
            <p className="font-display text-5xl font-bold text-gradient-gold">
              {balance.toLocaleString("id-ID")}
            </p>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="size-3 text-success" /> Total earn:{" "}
                <span className="font-semibold text-foreground">{earned.toLocaleString("id-ID")}</span>
              </span>
              <span className="flex items-center gap-1">
                <Gift className="size-3 text-gold" /> Total redeem:{" "}
                <span className="font-semibold text-foreground">{redeemed.toLocaleString("id-ID")}</span>
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-20 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
              <Coins className="size-10 text-gold-foreground" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => earnDemo.mutate()}
              disabled={earnDemo.isPending}
            >
              <Sparkles className="size-3" /> +100 (demo)
            </Button>
          </div>
        </div>
      </Card>

      {/* Vouchers */}
      <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-foreground">
        <Gift className="size-5 text-gold" /> Tukar Voucher
      </h2>
      {vouchers.length === 0 ? (
        <Card className="mb-8 p-6 text-center text-sm text-muted-foreground">
          Belum ada voucher tersedia.{" "}
          <Link to="/dashboard" className="text-gold hover:underline">
            Owner dapat menambah voucher dari panel admin.
          </Link>
        </Card>
      ) : (
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vouchers.map((v) => {
            const canRedeem = balance >= v.cost_points;
            return (
              <Card key={v.id} className="flex flex-col p-5">
                <div className="mb-2 flex items-start justify-between">
                  <Badge variant="outline" className="border-gold/40 text-gold">
                    {v.cost_points} token
                  </Badge>
                  {v.discount_amount > 0 && (
                    <Badge variant="outline">
                      Diskon Rp {v.discount_amount.toLocaleString("id-ID")}
                    </Badge>
                  )}
                </div>
                <h3 className="font-display text-lg font-bold">{v.title}</h3>
                {v.description && (
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">
                    {v.description}
                  </p>
                )}
                <Button
                  variant={canRedeem ? "gold" : "outline"}
                  className="mt-4"
                  disabled={!canRedeem || redeemMutation.isPending}
                  onClick={() => redeemMutation.mutate(v)}
                >
                  {canRedeem ? "Tukar Sekarang" : `Butuh ${v.cost_points - balance} lagi`}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* History */}
      <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-foreground">
        <History className="size-5 text-gold" /> Riwayat Transaksi
      </h2>
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead>Referensi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {txs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada transaksi token.
                </TableCell>
              </TableRow>
            ) : (
              txs.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs text-muted-foreground">{timeAgo(t.created_at)}</TableCell>
                  <TableCell>
                    {t.tx_type === "earn" ? (
                      <Badge variant="outline" className="border-success/40 text-success">+ Earn</Badge>
                    ) : (
                      <Badge variant="outline" className="border-gold/40 text-gold">- Redeem</Badge>
                    )}
                  </TableCell>
                  <TableCell className={`text-right font-mono font-bold ${t.tx_type === "earn" ? "text-success" : "text-gold"}`}>
                    {t.tx_type === "earn" ? "+" : "-"}{t.amount}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.reference ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
