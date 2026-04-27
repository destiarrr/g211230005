import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Download, Wrench, AlertTriangle } from "lucide-react";
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
import { fetchBranches, fetchOperationalTools, formatRupiahFull } from "@/lib/queries";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

export const Route = createFileRoute("/operasional")({
  head: () => ({
    meta: [
      { title: "Operasional & Alat — ENGGAL CHAIN" },
      { name: "description", content: "Daftar alat masak dengan periode ganti otomatis." },
    ],
  }),
  component: OpsGuarded,
});

function OpsGuarded() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container mx-auto max-w-7xl px-4 py-10 md:px-6">
          <RoleGate allow={["owner", "mitra"]}>
            <OpsInner />
          </RoleGate>
        </main>
        <SiteFooter />
      </div>
    </RequireAuth>
  );
}

function statusOf(t: { purchase_date: string | null; replace_period_months: number }) {
  if (!t.purchase_date || !t.replace_period_months) return { label: "—", warn: false, days: null as number | null };
  const due = new Date(t.purchase_date);
  due.setMonth(due.getMonth() + t.replace_period_months);
  const days = Math.ceil((due.getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: `Telat ${-days} hari`, warn: true, days };
  if (days <= 30) return { label: `${days} hari lagi`, warn: true, days };
  return { label: `${days} hari lagi`, warn: false, days };
}

function OpsInner() {
  const branchesQ = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });
  const toolsQ = useQuery({ queryKey: ["tools"], queryFn: fetchOperationalTools });
  const branches = branchesQ.data ?? [];
  const tools = toolsQ.data ?? [];

  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () => tools.filter((t) => t.tool_name.toLowerCase().includes(search.toLowerCase())),
    [tools, search],
  );
  const warnings = filtered.filter((t) => statusOf(t).warn);
  const totalAsset = filtered.reduce((a, t) => a + Number(t.price), 0);
  const branchName = (id: string | null) => branches.find((b) => b.id === id)?.name ?? "Pusat";

  const exportPDF = () => {
    exportToPDF({
      title: "Daftar Alat Operasional",
      subtitle: "ENGGAL CHAIN",
      headers: ["Alat", "Merk", "Harga", "Periode (bln)", "Tgl Beli", "Status", "Cabang"],
      rows: filtered.map((t) => {
        const s = statusOf(t);
        return [t.tool_name, t.brand ?? "-", formatRupiahFull(Number(t.price)),
          String(t.replace_period_months), t.purchase_date ?? "-", s.label, branchName(t.branch_id)];
      }),
      filename: `operasional-${new Date().toISOString().slice(0, 10)}.pdf`,
    });
    toast.success("PDF diunduh");
  };

  const exportExcel = () => {
    exportToExcel({
      sheetName: "Operasional",
      headers: ["Alat", "Merk", "Harga", "Periode (bln)", "Tgl Beli", "Status", "Cabang", "Catatan"],
      rows: filtered.map((t) => {
        const s = statusOf(t);
        return [t.tool_name, t.brand ?? "", Number(t.price), t.replace_period_months,
          t.purchase_date ?? "", s.label, branchName(t.branch_id), t.notes ?? ""];
      }),
      filename: `operasional-${new Date().toISOString().slice(0, 10)}.xlsx`,
    });
    toast.success("Excel diunduh");
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
            <Wrench className="size-3" /> Operasional
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold">Alat Masak & Inventaris</h1>
          <p className="mt-1 text-sm text-muted-foreground">Lacak alat dengan peringatan periode ganti.</p>
        </div>
        <NewToolDialog branches={branches} />
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Alat</p>
          <p className="mt-1 font-display text-2xl font-bold">{filtered.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Nilai Aset</p>
          <p className="mt-1 font-display text-2xl font-bold text-gradient-gold">{formatRupiahFull(totalAsset)}</p>
        </Card>
        <Card className={`p-4 ${warnings.length ? "border-warning/40 bg-warning/5" : ""}`}>
          <p className="text-xs text-muted-foreground">Perlu Diganti / Segera</p>
          <p className={`mt-1 font-display text-2xl font-bold ${warnings.length ? "text-warning" : ""}`}>{warnings.length}</p>
        </Card>
      </div>

      {warnings.length > 0 && (
        <Card className="mb-4 border-warning/40 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
            <div className="flex-1">
              <p className="font-semibold">{warnings.length} alat perlu perhatian</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {warnings.map((t) => (
                  <Badge key={t.id} variant="outline" className="border-warning/40 text-warning">
                    {t.tool_name} — {statusOf(t).label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="mb-3 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Cari nama alat..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <div className="ml-auto flex gap-2">
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
              <TableHead>Alat</TableHead>
              <TableHead>Merk</TableHead>
              <TableHead className="text-right">Harga</TableHead>
              <TableHead>Tempat Beli</TableHead>
              <TableHead className="text-right">Periode</TableHead>
              <TableHead>Tgl Beli</TableHead>
              <TableHead>Status Ganti</TableHead>
              <TableHead>Cabang</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Belum ada alat tercatat.</TableCell></TableRow>
            ) : filtered.map((t) => {
              const s = statusOf(t);
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.tool_name}</TableCell>
                  <TableCell className="text-sm">{t.brand ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono text-gold">{formatRupiahFull(Number(t.price))}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.purchase_place ?? "—"}</TableCell>
                  <TableCell className="text-right text-xs">{t.replace_period_months || "—"} bln</TableCell>
                  <TableCell className="text-xs">{t.purchase_date ?? "—"}</TableCell>
                  <TableCell>
                    {s.warn ? (
                      <Badge variant="outline" className="border-warning/40 text-warning">⚠ {s.label}</Badge>
                    ) : s.label === "—" ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <Badge variant="outline" className="border-success/40 text-success">{s.label}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{branchName(t.branch_id)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function NewToolDialog({ branches }: { branches: { id: string; name: string }[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    tool_name: "", brand: "", price: "0", purchase_place: "",
    replace_period_months: "12",
    purchase_date: new Date().toISOString().slice(0, 10),
    branch_id: "pusat", notes: "",
  });

  const m = useMutation({
    mutationFn: async () => {
      if (!form.tool_name) throw new Error("Nama alat wajib");
      const { error } = await supabase.from("operational_tools").insert({
        tool_name: form.tool_name,
        brand: form.brand || null,
        price: Number(form.price) || 0,
        purchase_place: form.purchase_place || null,
        replace_period_months: Number(form.replace_period_months) || 0,
        purchase_date: form.purchase_date || null,
        branch_id: form.branch_id === "pusat" ? null : form.branch_id,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alat ditambahkan");
      qc.invalidateQueries({ queryKey: ["tools"] });
      setOpen(false);
      setForm({ tool_name: "", brand: "", price: "0", purchase_place: "", replace_period_months: "12", purchase_date: new Date().toISOString().slice(0, 10), branch_id: "pusat", notes: "" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal"),
  });

  const submit = (e: FormEvent) => { e.preventDefault(); m.mutate(); };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold"><Plus className="size-4" /> Tambah Alat</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Tambah Alat Operasional</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nama alat</Label><Input required value={form.tool_name} onChange={(e) => setForm({ ...form, tool_name: e.target.value })} placeholder="Wajan" /></div>
            <div><Label>Merk</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Maspion" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Harga (Rp)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div><Label>Tempat beli</Label><Input value={form.purchase_place} onChange={(e) => setForm({ ...form, purchase_place: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Periode ganti (bln)</Label><Input type="number" value={form.replace_period_months} onChange={(e) => setForm({ ...form, replace_period_months: e.target.value })} /></div>
            <div><Label>Tanggal beli</Label><Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></div>
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
