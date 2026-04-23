import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Package,
  Plus,
  Truck,
  Building2,
  Store,
  ArrowRight,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { RequireAuth, RoleGate } from "@/components/AuthGuards";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchBranches,
  fetchStock,
  fetchStockMovements,
  fetchSuppliers,
  mockTxHash,
  timeAgo,
} from "@/lib/queries";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/stok")({
  component: StokPage,
});

function StokPage() {
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
  const stockQ = useQuery({ queryKey: ["stock"], queryFn: fetchStock });
  const branchesQ = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });
  const suppliersQ = useQuery({ queryKey: ["suppliers"], queryFn: fetchSuppliers });
  const movementsQ = useQuery({ queryKey: ["movements"], queryFn: fetchStockMovements });

  const stock = stockQ.data ?? [];
  const branches = branchesQ.data ?? [];
  const suppliers = suppliersQ.data ?? [];
  const movements = movementsQ.data ?? [];

  const lowStock = stock.filter((s) => s.current_qty <= s.min_qty);

  const exportMovementsPDF = () => {
    exportToPDF({
      title: "Laporan Pergerakan Stok",
      subtitle: "Supply Chain Tracking — ENGGAL CHAIN",
      headers: ["Tanggal", "Item", "Qty", "Dari", "Ke", "Tx Hash"],
      rows: movements.map((m) => [
        new Date(m.created_at).toLocaleDateString("id-ID"),
        m.item_name,
        `${m.quantity} ${m.unit}`,
        m.from_location,
        m.to_location,
        m.tx_hash ?? "-",
      ]),
      filename: `supply-chain-${new Date().toISOString().slice(0, 10)}.pdf`,
    });
    toast.success("PDF berhasil diunduh");
  };

  const exportMovementsExcel = () => {
    exportToExcel({
      sheetName: "Supply Chain",
      headers: ["Tanggal", "Item", "Quantity", "Unit", "Dari", "Ke", "Tx Hash", "Notes"],
      rows: movements.map((m) => [
        new Date(m.created_at).toLocaleString("id-ID"),
        m.item_name,
        m.quantity,
        m.unit,
        m.from_location,
        m.to_location,
        m.tx_hash ?? "",
        m.notes ?? "",
      ]),
      filename: `supply-chain-${new Date().toISOString().slice(0, 10)}.xlsx`,
    });
    toast.success("Excel berhasil diunduh");
  };

  const branchLabel = (id: string | null) => {
    if (!id) return "Pusat";
    return branches.find((b) => b.id === id)?.name ?? "—";
  };

  const supplierLabel = (id: string | null) => {
    if (!id) return null;
    return suppliers.find((s) => s.id === id)?.name ?? "—";
  };

  const locLabel = (loc: string) => {
    if (loc === "pusat") return "🏢 Pusat";
    if (loc.startsWith("supplier:"))
      return `🚚 ${supplierLabel(loc.split(":")[1] ?? null) ?? "Supplier"}`;
    if (loc.startsWith("cabang:"))
      return `🏪 ${branchLabel(loc.split(":")[1] ?? null)}`;
    return loc;
  };

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Stok & Supply Chain
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manajemen stok bahan baku & pelacakan distribusi end-to-end.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <NewStockDialog branches={branches} />
          <NewMovementDialog branches={branches} suppliers={suppliers} />
          <NewSupplierDialog />
        </div>
      </div>

      {lowStock.length > 0 && (
        <Card className="mb-6 border-warning/40 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {lowStock.length} item stok menipis
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {lowStock.map((s) => (
                  <Badge key={s.id} variant="outline" className="border-warning/40 text-warning">
                    {s.item_name} ({s.current_qty}/{s.min_qty} {s.unit}) — {branchLabel(s.branch_id)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="stock" className="w-full">
        <TabsList>
          <TabsTrigger value="stock"><Package className="size-4 mr-1" /> Stok</TabsTrigger>
          <TabsTrigger value="movements"><Truck className="size-4 mr-1" /> Pergerakan</TabsTrigger>
          <TabsTrigger value="suppliers"><Building2 className="size-4 mr-1" /> Supplier</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4">
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead className="text-right">Max</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Belum ada data stok. Tambahkan item baru.</TableCell></TableRow>
                ) : stock.map((s) => {
                  const low = s.current_qty <= s.min_qty;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.item_name}</TableCell>
                      <TableCell>{branchLabel(s.branch_id)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {s.current_qty} {s.unit}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{s.min_qty}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{s.max_qty}</TableCell>
                      <TableCell>
                        {low ? (
                          <Badge variant="outline" className="border-warning/40 text-warning">Menipis</Badge>
                        ) : (
                          <Badge variant="outline" className="border-success/40 text-success">Aman</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <div className="mb-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={exportMovementsPDF} disabled={movements.length === 0}>
              <Download className="size-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportMovementsExcel} disabled={movements.length === 0}>
              <Download className="size-4" /> Excel
            </Button>
          </div>
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Alur</TableHead>
                  <TableHead>Tx Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Belum ada pergerakan.</TableCell></TableRow>
                ) : movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-muted-foreground">{timeAgo(m.created_at)}</TableCell>
                    <TableCell className="font-medium">{m.item_name}</TableCell>
                    <TableCell className="font-mono">{m.quantity} {m.unit}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span>{locLabel(m.from_location)}</span>
                        <ArrowRight className="size-3 text-gold" />
                        <span>{locLabel(m.to_location)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gold">{m.tx_hash}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="mt-4">
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Wallet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">Belum ada supplier.</TableCell></TableRow>
                ) : suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.contact ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.address ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-gold">{s.wallet_address ?? "—"}</TableCell>
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

function NewStockDialog({ branches }: { branches: { id: string; name: string }[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    item_name: "",
    current_qty: "0",
    min_qty: "10",
    max_qty: "100",
    unit: "kg",
    branch_id: "pusat",
  });
  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("stock_items").insert({
        item_name: form.item_name,
        current_qty: Number(form.current_qty),
        min_qty: Number(form.min_qty),
        max_qty: Number(form.max_qty),
        unit: form.unit,
        branch_id: form.branch_id === "pusat" ? null : form.branch_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item stok ditambahkan");
      qc.invalidateQueries({ queryKey: ["stock"] });
      setOpen(false);
      setForm({ item_name: "", current_qty: "0", min_qty: "10", max_qty: "100", unit: "kg", branch_id: "pusat" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal"),
  });
  const submit = (e: FormEvent) => { e.preventDefault(); m.mutate(); };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold" size="sm"><Plus className="size-4" /> Item Stok</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Tambah Item Stok</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Nama item</Label><Input required value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} placeholder="Tepung kanji" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Lokasi</Label>
              <Select value={form.branch_id} onValueChange={(v) => setForm({ ...form, branch_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pusat">🏢 Pusat</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>🏪 {b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Unit</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Stok awal</Label><Input type="number" value={form.current_qty} onChange={(e) => setForm({ ...form, current_qty: e.target.value })} /></div>
            <div><Label>Min</Label><Input type="number" value={form.min_qty} onChange={(e) => setForm({ ...form, min_qty: e.target.value })} /></div>
            <div><Label>Max</Label><Input type="number" value={form.max_qty} onChange={(e) => setForm({ ...form, max_qty: e.target.value })} /></div>
          </div>
          <DialogFooter><Button type="submit" variant="gold" disabled={m.isPending}>{m.isPending ? "Menyimpan..." : "Simpan"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewMovementDialog({ branches, suppliers }: { branches: { id: string; name: string }[]; suppliers: { id: string; name: string }[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    item_name: "",
    quantity: "0",
    unit: "kg",
    from: "pusat",
    to: "pusat",
    notes: "",
  });
  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("stock_movements").insert({
        item_name: form.item_name,
        quantity: Number(form.quantity),
        unit: form.unit,
        from_location: form.from,
        to_location: form.to,
        supplier_id: form.from.startsWith("supplier:") ? form.from.split(":")[1] : null,
        branch_id: form.to.startsWith("cabang:") ? form.to.split(":")[1] : null,
        tx_hash: mockTxHash(),
        notes: form.notes || null,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pergerakan stok dicatat", { description: "Tx hash blockchain telah dibuat." });
      qc.invalidateQueries({ queryKey: ["movements"] });
      setOpen(false);
      setForm({ item_name: "", quantity: "0", unit: "kg", from: "pusat", to: "pusat", notes: "" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal"),
  });
  const submit = (e: FormEvent) => { e.preventDefault(); m.mutate(); };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Truck className="size-4" /> Catat Distribusi</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Catat Pergerakan Stok</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Label>Item</Label><Input required value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} /></div>
            <div><Label>Qty</Label><Input type="number" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Dari</Label>
              <Select value={form.from} onValueChange={(v) => setForm({ ...form, from: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pusat">🏢 Pusat</SelectItem>
                  {suppliers.map((s) => <SelectItem key={s.id} value={`supplier:${s.id}`}>🚚 {s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Ke</Label>
              <Select value={form.to} onValueChange={(v) => setForm({ ...form, to: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pusat">🏢 Pusat</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={`cabang:${b.id}`}>🏪 {b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Catatan (opsional)</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <DialogFooter><Button type="submit" variant="gold" disabled={m.isPending}>{m.isPending ? "Menyimpan..." : "Simpan & Mint Tx"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewSupplierDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", address: "" });
  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("suppliers").insert({
        name: form.name,
        contact: form.contact || null,
        address: form.address || null,
        wallet_address: "0x" + Math.random().toString(16).slice(2, 42),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Supplier ditambahkan");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setOpen(false);
      setForm({ name: "", contact: "", address: "" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal"),
  });
  const submit = (e: FormEvent) => { e.preventDefault(); m.mutate(); };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Store className="size-4" /> Supplier</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Tambah Supplier</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Nama</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="CV Sumber Tepung" /></div>
          <div><Label>Kontak</Label><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="081234567890" /></div>
          <div><Label>Alamat</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <DialogFooter><Button type="submit" variant="gold" disabled={m.isPending}>{m.isPending ? "Menyimpan..." : "Simpan"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
