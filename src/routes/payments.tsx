import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RequireAuth } from "@/components/AuthGuards";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchBranches,
  fetchPayments,
  formatRupiahFull,
  timeAgo,
} from "@/lib/queries";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Pembayaran — ENGGAL GROUP" },
      {
        name: "description",
        content:
          "Upload bukti pembayaran franchise fee, royalti bulanan, atau pembelian bahan baku. Owner dapat memverifikasi pembayaran secara real-time.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <PaymentsPage />
    </RequireAuth>
  ),
});

type PaymentType = "franchise_fee" | "royalty" | "supply";
type Method = "transfer" | "qris" | "crypto";

function PaymentsPage() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const isOwner = role === "owner";

  const branchesQ = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });
  const paymentsQ = useQuery({ queryKey: ["payments"], queryFn: fetchPayments });

  const branches = branchesQ.data ?? [];
  const payments = paymentsQ.data ?? [];
  const myPayments = payments.filter((p) => p.user_id === user?.id);
  const pendingPayments = payments.filter((p) => p.status === "pending");

  // form state
  const [paymentType, setPaymentType] = useState<PaymentType>("royalty");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("transfer");
  const [branchId, setBranchId] = useState<string>("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Belum login");
      const amt = parseFloat(amount);
      if (!amt || amt <= 0) throw new Error("Nominal tidak valid");

      let proofUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("payment-proofs")
          .upload(path, file);
        if (upErr) throw upErr;
        proofUrl = path;
      }

      const { error } = await supabase.from("payment_proofs").insert({
        user_id: user.id,
        branch_id: branchId || null,
        payment_type: paymentType,
        amount: amt,
        method,
        proof_url: proofUrl,
        reference_note: note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bukti pembayaran terkirim. Menunggu verifikasi owner.");
      qc.invalidateQueries({ queryKey: ["payments"] });
      setAmount("");
      setNote("");
      setFile(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verify = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "verified" | "rejected" }) => {
      const { error } = await supabase
        .from("payment_proofs")
        .update({ status, verified_by: user?.id, verified_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.status === "verified" ? "Pembayaran diverifikasi" : "Pembayaran ditolak");
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function downloadProof(path: string) {
    const { data, error } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(path, 60);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
            <CircleDollarSign className="size-3" />
            Pembayaran Manual
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">
            Pembayaran <span className="text-gradient-gold">Franchise</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload bukti transfer / QRIS / crypto. Owner akan memverifikasi & rilis royalti on-chain.
          </p>

          <Tabs defaultValue="upload" className="mt-8">
            <TabsList>
              <TabsTrigger value="upload">Upload Bukti</TabsTrigger>
              <TabsTrigger value="mine">Riwayat Saya ({myPayments.length})</TabsTrigger>
              {isOwner && (
                <TabsTrigger value="verify">
                  Verifikasi ({pendingPayments.length})
                </TabsTrigger>
              )}
            </TabsList>

            {/* Upload */}
            <TabsContent value="upload" className="mt-6">
              <div className="glass-card rounded-2xl p-6">
                <form
                  className="grid gap-4 md:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit.mutate();
                  }}
                >
                  <div>
                    <Label>Jenis Pembayaran</Label>
                    <Select value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
                      <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="franchise_fee">Franchise Fee</SelectItem>
                        <SelectItem value="royalty">Royalti Bulanan</SelectItem>
                        <SelectItem value="supply">Pembelian Bahan Baku</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Metode</Label>
                    <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
                      <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transfer">Transfer Bank</SelectItem>
                        <SelectItem value="qris">QRIS</SelectItem>
                        <SelectItem value="crypto">Crypto Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nominal (Rp)</Label>
                    <Input
                      type="number"
                      min="0"
                      className="mt-2"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="contoh: 5000000"
                    />
                  </div>
                  <div>
                    <Label>Cabang (opsional)</Label>
                    <Select value={branchId} onValueChange={setBranchId}>
                      <SelectTrigger className="mt-2"><SelectValue placeholder="Pilih cabang" /></SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Catatan / Referensi</Label>
                    <Textarea
                      className="mt-2"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="contoh: Royalti September 2025 — cabang Yogyakarta"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Bukti Transfer (gambar/PDF)</Label>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      className="mt-2"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                    {file && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {file.name} • {(file.size / 1024).toFixed(0)} KB
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" variant="gold" disabled={submit.isPending} className="w-full md:w-auto">
                      {submit.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                      Kirim Bukti
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>

            {/* My history */}
            <TabsContent value="mine" className="mt-6">
              <PaymentTable
                rows={myPayments}
                onProof={downloadProof}
                showActions={false}
              />
            </TabsContent>

            {isOwner && (
              <TabsContent value="verify" className="mt-6">
                <PaymentTable
                  rows={pendingPayments}
                  onProof={downloadProof}
                  showActions
                  onVerify={(id) => verify.mutate({ id, status: "verified" })}
                  onReject={(id) => verify.mutate({ id, status: "rejected" })}
                  busyId={verify.isPending ? verify.variables?.id : undefined}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
      <SiteFooter />
    </div>
  );

  function PaymentTable({
    rows,
    onProof,
    showActions,
    onVerify,
    onReject,
    busyId,
  }: {
    rows: typeof payments;
    onProof: (p: string) => void;
    showActions: boolean;
    onVerify?: (id: string) => void;
    onReject?: (id: string) => void;
    busyId?: string;
  }) {
    return (
      <div className="glass-card overflow-x-auto rounded-2xl p-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-left text-xs uppercase text-muted-foreground">
              <th className="pb-2">Tanggal</th>
              <th className="pb-2">Jenis</th>
              <th className="pb-2">Metode</th>
              <th className="pb-2 text-right">Nominal</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Bukti</th>
              {showActions && <th className="pb-2 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={showActions ? 7 : 6} className="py-6 text-center text-muted-foreground">
                  Tidak ada data.
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-border/30">
                <td className="py-3 text-xs">{timeAgo(p.created_at)} lalu</td>
                <td className="py-3 capitalize">{p.payment_type.replace("_", " ")}</td>
                <td className="py-3 capitalize">{p.method}</td>
                <td className="py-3 text-right font-semibold text-gold">
                  {formatRupiahFull(Number(p.amount))}
                </td>
                <td className="py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.status === "verified"
                      ? "bg-success/15 text-success"
                      : p.status === "rejected"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-gold/15 text-gold"
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="py-3">
                  {p.proof_url ? (
                    <button onClick={() => onProof(p.proof_url!)} className="text-xs text-gold hover:underline">
                      Lihat
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
                {showActions && (
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="gold"
                        disabled={busyId === p.id}
                        onClick={() => onVerify?.(p.id)}
                      >
                        <CheckCircle2 className="size-3" /> Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === p.id}
                        onClick={() => onReject?.(p.id)}
                      >
                        <XCircle className="size-3" /> Reject
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
