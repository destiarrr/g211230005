import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Download, Truck } from "lucide-react";
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fetchBranches, fetchProductionRecords, formatRupiahFull } from "@/lib/queries";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

export const Route = createFileRoute("/produksi")({
  head: () => ({
    meta: [
      { title: "Produksi & Belanja Bahan — ENGGAL CHAIN" },
      { name: "description", content: "Catat belanja bahan baku, supplier, dan tempat pembelian per cabang." },
    ],
  }),
  component: ProduksiGuarded,
});

function ProduksiGuarded() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container mx-auto max-w-7xl px-4 py-10 md:px-6">
          <RoleGate allow={["owner", "mitra"]}>
            <ProduksiInner />
          </RoleGate>
        </main>
        <SiteFooter />
      </div>
    </RequireAuth>
  );
}

function ProduksiInner() {
  const branchesQ = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });
  const prodQ = useQuery({ queryKey: ["production"], queryFn: fetchProductionRecords });
  const branches = branchesQ.data ?? [];
  const records = prodQ.data ?? [];

  const [filter, setFilter] = useState<"all" | "today" | "week" | "month">("month");

  const filtered = useMemo(() => {
    if (filter === "all") return records;
    const now = new Date();
    let cut = new Date(0);
    if (filter === "today") cut = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (filter === "week") cut = new Date(now.getTime() - 7 * 86400000);
    else if (filter === "month") cut = new Date(now.getFullYear(), now.getMonth(), 1);
    return records.filter((r) => new Date(r.purchase_date) >= cut);
  }, [records, filter]);

  const totalSpend = filtered.reduce((a, r) => a + Number(r.price), 0);
  const branchName = (id: string | null) => branches.find((b) => b.id === id)?.name ?? "Pusat";

  const exportPDF = () => {
    exportToPDF({
      title: "Laporan Belanja Bahan Baku",
      subtitle: `Periode: ${filter} • ENGGAL CHAIN`,
      headers: ["Tanggal", "Item", "Harga", "Supplier", "Tempat", "Cabang"],
      rows: filtered.map((r) => [
        r.purchase_date, r.item_name, formatRupiahFull(Number(r.price)),
        r.supplier ?? "-", r.place ?? "-", branchName(r.branch_id),
      ]),
      filename: `produksi-${filter}-${new Date().toISOString().slice(0, 10)}.pdf`,
    });
    toast.success("PDF diunduh");
  };

  const exportExcel = () => {
    exportToExcel({
      sheetName: "Produksi",
      headers: ["Tanggal", "Item", "Harga", "Supplier", "Tempat", "Cabang", "Catatan"],
      rows: filtered.map((r) => [
        r.purchase_date, r.item_name, Number(r.price),
        r.supplier ?? "", r.place ?? "", branchName(r.branch_id), r.notes ?? "",
      ]),
      filename: `produksi-${filter}-${new Date().toISOString().slice(0, 10)}.xlsx`,
    });
    toast.success("Excel diunduh");
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
            <Truck className="size-3" /> Produksi
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold">Belanja Bahan Baku</h1>
          <p className="mt-1 text-sm text-muted-foreground">Catatan belanja bahan baku, supplier, dan lokasi pembelian.</p>
        </div>
        <NewProductionDialog branches={branches} />
      </div>

      <Card className="mb-4 p-4 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground">Total belanja {filter}:</span>
          <span className="font-display text-lg font-bold text-gradient-gold">{formatRupiahFull(totalSpend)}</span>
          <span className="text-xs text-muted-foreground">({filtered.length} entri)</span>
          <div className="ml-auto flex flex-wrap gap-2">
            {(["today", "week", "month", "all"] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "gold" : "outline"} onClick={() => setFilter(f)}>
                {f === "today" ? "Hari ini" : f === "week" ? "7 Hari" : f === "month" ? "Bulan ini" : "Semua"}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={exportPDF} disabled={filtered.length === 0}>
              <Download className="size-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportExcel} disabled={filtered.length === 0}>
              <Download className="size-4" /> Excel
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Harga</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Tempat</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead>Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">Belum ada catatan belanja.</TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{r.purchase_date}</TableCell>
                <TableCell className="font-medium">{r.item_name}</TableCell>
                <TableCell className="text-right font-mono text-gold">{formatRupiahFull(Number(r.price))}</TableCell>
                <TableCell>{r.supplier ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.place ?? "—"}</TableCell>
                <TableCell className="text-xs">{branchName(r.branch_id)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.notes ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function NewProductionDialog({ branches }: { branches: { id: string; name: string }[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    item_name: "", price: "0", supplier: "", place: "",
    purchase_date: new Date().toISOString().slice(0, 10),
    branch_id: "pusat", notes: "",
  });

  const m = useMutation({
    mutationFn: async () => {
      if (!form.item_name) throw new Error("Nama item wajib");
      const { error } = await supabase.from("production_records").insert({
        item_name: form.item_name,
        price: Number(form.price) || 0,
        supplier: form.supplier || null,
        place: form.place || null,
        purchase_date: form.purchase_date,
        branch_id: form.branch_id === "pusat" ? null : form.branch_id,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Belanja dicatat");
      qc.invalidateQueries({ queryKey: ["production"] });
      setOpen(false);
      setForm({ item_name: "", price: "0", supplier: "", place: "", purchase_date: new Date().toISOString().slice(0, 10), branch_id: "pusat", notes: "" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal"),
  });

  const submit = (e: FormEvent) => { e.preventDefault(); m.mutate(); };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold"><Plus className="size-4" /> Catat Belanja</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Catat Belanja Bahan Baku</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nama item</Label><Input required value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} placeholder="Tepung kanji" /></div>
            <div><Label>Harga (Rp)</Label><Input type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Supplier</Label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
            <div><Label>Tempat beli</Label><Input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder="Pasar Mayestik" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tanggal</Label><Input type="date" required value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></div>
            <div><Label>Cabang</Label>
              <Select value={form.branch_id} onValueChange={(v) => setForm({ ...form, branch_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pusat">🏢 Pusat</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>🏪 {b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Catatan</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <DialogFooter><Button type="submit" variant="gold" disabled={m.isPending}>{m.isPending ? "Menyimpan..." : "Simpan"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
