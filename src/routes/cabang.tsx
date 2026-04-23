import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, MapPin, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { fetchBranches } from "@/lib/queries";

export const Route = createFileRoute("/cabang")({
  head: () => ({
    meta: [
      { title: "Manajemen Cabang — ENGGAL GROUP" },
      {
        name: "description",
        content: "Tambah, edit, dan kelola seluruh cabang franchise ENGGAL GROUP secara terpusat.",
      },
    ],
  }),
  component: BranchPage,
});

function randomWallet() {
  const chars = "0123456789abcdef";
  let s = "0x";
  for (let i = 0; i < 40; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}

function BranchPage() {
  const qc = useQueryClient();
  const branchesQ = useQuery({ queryKey: ["branches"], queryFn: fetchBranches });

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [manager, setManager] = useState("");

  const addBranch = useMutation({
    mutationFn: async () => {
      if (!name.trim() || !city.trim()) throw new Error("Nama dan kota wajib diisi");
      const { error } = await supabase.from("branches").insert({
        name: name.trim(),
        city: city.trim(),
        manager_name: manager.trim() || null,
        wallet_address: randomWallet(),
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cabang baru berhasil terdaftar di blockchain.");
      qc.invalidateQueries({ queryKey: ["branches"] });
      setName("");
      setCity("");
      setManager("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeBranch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("branches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cabang dihapus.");
      qc.invalidateQueries({ queryKey: ["branches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const branches = branchesQ.data ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
            <MapPin className="size-3" />
            Multi-Branch Management
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">
            Manajemen <span className="text-gradient-gold">Cabang</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tambah cabang baru — wallet & kontrak otomatis tergenerate
          </p>

          {/* Form add */}
          <div className="mt-8 glass-card rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold">Daftar Cabang Baru</h3>
            <form
              className="mt-4 grid gap-4 md:grid-cols-4"
              onSubmit={(e) => {
                e.preventDefault();
                addBranch.mutate();
              }}
            >
              <div>
                <Label>Nama Cabang</Label>
                <Input
                  className="mt-2"
                  placeholder="Cabang Malioboro Yogya"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label>Kota</Label>
                <Input
                  className="mt-2"
                  placeholder="Yogyakarta"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div>
                <Label>Manajer</Label>
                <Input
                  className="mt-2"
                  placeholder="Nama manajer"
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="gold" className="w-full" disabled={addBranch.isPending}>
                  {addBranch.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Tambah Cabang
                </Button>
              </div>
            </form>
          </div>

          {/* List */}
          <div className="mt-6 glass-card rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold">
              Total {branches.length} Cabang Terdaftar
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {branchesQ.isLoading && (
                <div className="text-sm text-muted-foreground">Memuat...</div>
              )}
              {branches.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-border/50 bg-background/30 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-display text-base font-semibold">{b.name}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {b.city}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium uppercase text-success">
                      ● {b.status}
                    </span>
                  </div>
                  <div className="mt-4 space-y-1 border-t border-border/40 pt-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Manajer</span>
                      <span className="font-medium">{b.manager_name ?? "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Wallet</span>
                      <span className="flex items-center gap-1 font-mono text-gold">
                        <Wallet className="size-3" />
                        {b.wallet_address?.slice(0, 6)}...{b.wallet_address?.slice(-4)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Hapus ${b.name}?`)) removeBranch.mutate(b.id);
                    }}
                  >
                    <Trash2 className="size-3" /> Hapus
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
