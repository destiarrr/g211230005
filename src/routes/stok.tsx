import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Download, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth, RoleGate } from "@/components/AuthGuards";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchBranches, fetchProducts, fetchStockRecords,
} from "@/lib/queries";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

export const Route = createFileRoute("/stok")({
  head: () => ({
    meta: [
      { title: "Stok Harian — ENGGAL CHAIN" },
      { name: "description", content: "Catatan stok pembukaan & penutupan harian dengan kalkulasi pemakaian otomatis." },
    ],
  }),
  component: StokGuarded,
});

function StokGuarded() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container mx-auto max-w-7xl px-4 py-10 md:px-6">
          <RoleGate allow={["owner", "mitra"]}>
            <StokInner />
          </RoleGate>
        </main>
        <SiteFooter />
      </div>
    </RequireAuth>
  );
}

function StokInner() {
  const branchesQ = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });
  const productsQ = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const recordsQ = useQuery({ queryKey: ["stock_records"], queryFn: fetchStockRecords });

  const branches = branchesQ.data ?? [];
  const products = productsQ.data ?? [];
  const records = recordsQ.data ?? [];

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState<string>(today);
  const [branchId, setBranchId] = useState<string>("pusat");

  const branchName = (id: string | null) => branches.find((b) => b.id === id)?.name ?? "Pusat";

  // For chosen date+branch, compute summary per product
  const branchFilter = (r: { branch_id: string | null }) =>
    branchId === "pusat" ? r.branch_id === null : r.branch_id === branchId;

  const summary = useMemo(() => {
    const rows = records.filter((r) => r.record_date === date && branchFilter(r));
    const map = new Map<string, { product: string; opening: number; closing: number; unit: string }>();
    for (const r of rows) {
      const key = r.product_name;
      const cur = map.get(key) ?? { product: key, opening: 0, closing: 0, unit: r.unit };
      if (r.record_type === "pembukaan") cur.opening += Number(r.quantity);
      else cur.closing += Number(r.quantity);
      cur.unit = r.unit;
      map.set(key, cur);
    }
    return Array.from(map.values()).map((m) => ({ ...m, used: m.opening - m.closing }));
  }, [records, date, branchId]);

  const totalUsed = summary.reduce((a, s) => a + Math.max(0, s.used), 0);
  const lowItems = summary.filter((s) => s.closing <= 5);

  const exportPDF = () => {
    exportToPDF({
      title: `Laporan Stok Harian — ${date}`,
      subtitle: `Cabang: ${branchName(branchId === "pusat" ? null : branchId)}`,
      headers: ["Produk", "Pembukaan", "Penutupan", "Pemakaian", "Unit"],
      rows: summary.map((s) => [s.product, String(s.opening), String(s.closing), String(s.used), s.unit]),
      filename: `stok-${date}.pdf`,
    });
    toast.success("PDF diunduh");
  };

  const exportExcel = () => {
    exportToExcel({
      sheetName: "Stok Harian",
      headers: ["Tanggal", "Cabang", "Produk", "Pembukaan", "Penutupan", "Pemakaian", "Unit"],
      rows: summary.map((s) => [date, branchName(branchId === "pusat" ? null : branchId), s.product, s.opening, s.closing, s.used, s.unit]),
      filename: `stok-${date}.xlsx`,
    });
    toast.success("Excel diunduh");
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
            <Package className="size-3" /> Stok Harian
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold">Stok Pembukaan & Penutupan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Catat stok harian per cabang. Pemakaian dihitung otomatis.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <NewStockDialog branches={branches} products={products} type="pembukaan" date={date} branchId={branchId} />
          <NewStockDialog branches={branches} products={products} type="penutupan" date={date} branchId={branchId} />
        </div>
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="text-xs">Tanggal</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-44" />
          </div>
          <div>
            <Label className="text-xs">Cabang</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="mt-1 w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pusat">🏢 Pusat</SelectItem>
                {branches.map((b) => <SelectItem key={b.id} value={b.id}>🏪 {b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Total pemakaian: </span>
              <span className="font-display font-bold text-gradient-gold">{totalUsed} pcs</span>
            </div>
            <Button variant="outline" size="sm" onClick={exportPDF} disabled={summary.length === 0}>
              <Download className="size-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportExcel} disabled={summary.length === 0}>
              <Download className="size-4" /> Excel
            </Button>
          </div>
        </div>
      </Card>

      {lowItems.length > 0 && (
        <Card className="mb-4 border-warning/40 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
            <div className="flex-1">
              <p className="font-semibold">{lowItems.length} produk stok penutupan menipis (≤ 5)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {lowItems.map((it) => (
                  <Badge key={it.product} variant="outline" className="border-warning/40 text-warning">
                    {it.product} — sisa {it.closing} {it.unit}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Ringkasan Hari Ini</TabsTrigger>
          <TabsTrigger value="history">Riwayat Catatan</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Pembukaan</TableHead>
                  <TableHead className="text-right">Penutupan</TableHead>
                  <TableHead className="text-right">Pemakaian</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada catatan untuk tanggal & cabang ini.
                  </TableCell></TableRow>
                ) : summary.map((s) => (
                  <TableRow key={s.product}>
                    <TableCell className="font-medium">{s.product}</TableCell>
                    <TableCell className="text-right font-mono">{s.opening}</TableCell>
                    <TableCell className="text-right font-mono">{s.closing}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-gold">{Math.max(0, s.used)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Cabang</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Belum ada catatan stok.</TableCell></TableRow>
                ) : records.slice(0, 100).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{r.record_date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        r.record_type === "pembukaan"
                          ? "border-success/40 text-success"
                          : "border-gold/40 text-gold"
                      }>{r.record_type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{r.product_name}</TableCell>
                    <TableCell className="text-right font-mono">{r.quantity}</TableCell>
                    <TableCell className="text-xs">{r.unit}</TableCell>
                    <TableCell className="text-xs">{branchName(r.branch_id)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function NewStockDialog({
  branches, products, type, date, branchId,
}: {
  branches: { id: string; name: string }[];
  products: { id: string; name: string; unit: string }[];
  type: "pembukaan" | "penutupan";
  date: string;
  branchId: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  // qty per product
  const [qtys, setQtys] = useState<Record<string, string>>({});

  const m = useMutation({
    mutationFn: async () => {
      const rows = products
        .map((p) => ({
          product_id: p.id,
          product_name: p.name,
          unit: p.unit,
          quantity: Number(qtys[p.id] ?? "0") || 0,
        }))
        .filter((r) => r.quantity >= 0);
      if (rows.length === 0) throw new Error("Tidak ada data");
      const payload = rows.map((r) => ({
        record_date: date,
        record_type: type,
        product_id: r.product_id,
        product_name: r.product_name,
        quantity: r.quantity,
        unit: r.unit,
        branch_id: branchId === "pusat" ? null : branchId,
      }));
      const { error } = await supabase.from("stock_records").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Stok ${type} disimpan`);
      qc.invalidateQueries({ queryKey: ["stock_records"] });
      setOpen(false);
      setQtys({});
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal"),
  });

  const submit = (e: FormEvent) => { e.preventDefault(); m.mutate(); };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={type === "pembukaan" ? "outline" : "gold"}>
          <Plus className="size-4" /> Stok {type}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat Stok {type} — {date}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada produk di katalog.</p>
          ) : products.map((p) => (
            <div key={p.id} className="grid grid-cols-3 items-center gap-3">
              <Label className="col-span-2">{p.name}</Label>
              <Input
                type="number" min="0" placeholder="0"
                value={qtys[p.id] ?? ""}
                onChange={(e) => setQtys({ ...qtys, [p.id]: e.target.value })}
              />
            </div>
          ))}
          <DialogFooter>
            <Button type="submit" variant="gold" disabled={m.isPending || products.length === 0}>
              {m.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
