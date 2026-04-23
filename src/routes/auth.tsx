import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Crown, Store, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect already-logged-in users to dashboard
  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: "/dashboard" });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 py-12">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Beranda
        </Link>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
            <span className="font-display text-xl font-bold text-gold-foreground">E</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">ENGGAL GROUP</h1>
          <p className="mt-1 text-sm text-muted-foreground">Web3 Franchise Platform</p>
        </div>

        <Card className="w-full max-w-md p-6">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <SignInForm onSignIn={signIn} onSuccess={() => navigate({ to: "/dashboard" })} />
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <SignUpForm onSignUp={signUp} onSuccess={() => navigate({ to: "/dashboard" })} />
            </TabsContent>
          </Tabs>
        </Card>

        <div className="mt-6 grid w-full max-w-md grid-cols-3 gap-3 text-center text-xs">
          <RoleHint icon={<Crown className="size-4" />} label="Owner" desc="Akses penuh" />
          <RoleHint icon={<Store className="size-4" />} label="Mitra" desc="Input penjualan" />
          <RoleHint icon={<TrendingUp className="size-4" />} label="Investor" desc="Read-only" />
        </div>
      </div>
    </div>
  );
}

function RoleHint({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/30 p-3">
      <div className="mx-auto mb-1 flex size-7 items-center justify-center rounded-md bg-gold/10 text-gold">
        {icon}
      </div>
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground">{desc}</p>
    </div>
  );
}

function SignInForm({
  onSignIn,
  onSuccess,
}: {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSignIn(email, password);
      toast.success("Berhasil masuk");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal masuk");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="anda@email.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" variant="gold" className="w-full" disabled={busy}>
        {busy ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}

function SignUpForm({
  onSignUp,
  onSuccess,
}: {
  onSignUp: (email: string, password: string, role: AppRole, displayName: string) => Promise<void>;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<AppRole>("investor");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setBusy(true);
    try {
      await onSignUp(email, password, role, displayName);
      toast.success(`Akun ${role} berhasil dibuat`);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mendaftar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Nama Lengkap</Label>
        <Input
          id="signup-name"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Budi Santoso"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="anda@email.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 6 karakter"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-role">Daftar sebagai</Label>
        <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
          <SelectTrigger id="signup-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="owner">👑 Owner — kelola seluruh sistem</SelectItem>
            <SelectItem value="mitra">🏪 Mitra — input penjualan cabang</SelectItem>
            <SelectItem value="investor">📈 Investor — pantau performa</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" variant="gold" className="w-full" disabled={busy}>
        {busy ? "Memproses..." : "Buat Akun"}
      </Button>
    </form>
  );
}
