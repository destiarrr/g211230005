import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: "/auth" });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) return null;

  // role context available via useAuth() in children; pass through
  return <Outlet context={{ role }} />;
}

export function RoleGate({
  allow,
  children,
}: {
  allow: AppRole[];
  children: React.ReactNode;
}) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!role || !allow.includes(role)) {
    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="size-8 text-destructive" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">Akses Ditolak</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Halaman ini hanya bisa diakses oleh role:{" "}
          <span className="font-semibold text-gold">{allow.join(", ")}</span>. Role Anda saat ini:{" "}
          <span className="font-semibold capitalize text-foreground">{role ?? "tidak ada"}</span>.
        </p>
        <Button asChild variant="gold" className="mt-6">
          <Link to="/dashboard">Kembali ke Dashboard</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
