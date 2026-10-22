import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AppSidebar, MobileNav } from "./Sidebar";
import { format } from "date-fns";
import { NotificationPanel } from "./NotificationPanel";
import { useAuth, Role, ROLE_LABELS } from "@/lib/auth";
import { ShieldAlert, WifiOff } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  roles?: Role[];
}

export function PageLayout({ title, subtitle, children, roles }: Props) {
  const [now, setNow] = useState<Date | null>(null);
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setNow(new Date());
    const i = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(i);
  }, []);

  // Satu pengecekan server untuk semua halaman: spanduk jika backend tak terjangkau
  const [serverDown, setServerDown] = useState(false);
  useEffect(() => {
    const check = () =>
      apiFetch("api/status", { timeoutMs: 4000 }).then((r) => setServerDown(!r.ok));
    check();
    const i = setInterval(check, 15_000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (ready && !user && path !== "/login") {
      navigate({ to: "/login" });
    }
  }, [ready, user, path, navigate]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Memuat…</div>
      </div>
    );
  }

  const allowed = !roles || roles.includes(user.role);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
          <div className="px-6 lg:px-10 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-xs text-muted-foreground tabular-nums" suppressHydrationWarning>
                {now ? `Diperbarui ${format(now, "HH:mm:ss")}` : ""}
              </div>
              <NotificationPanel />
            </div>
          </div>
        </header>
        {serverDown && (
          <div role="status" className="mx-6 lg:mx-10 mt-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            <WifiOff className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <strong>Server BuahSafe tidak terhubung.</strong> Data yang tampil adalah salinan terakhir dan
              pemindaian baru belum bisa dilakukan. Periksa kabel jaringan atau minta teknisi menyalakan
              server, lalu halaman akan tersambung otomatis.
            </div>
          </div>
        )}
        <div className="px-6 lg:px-10 py-6 lg:py-8">
          {allowed ? (
            children
          ) : (
            <div className="rounded-xl border border-border bg-card p-10 text-center max-w-lg mx-auto mt-10 shadow-sm">
              <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
              <h2 className="mt-4 text-lg font-semibold">Akses Terbatas</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Peran Anda saat ini (<strong>{ROLE_LABELS[user.role]}</strong>) tidak memiliki akses ke halaman ini.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Silakan hubungi Supervisor QC atau Pemilik untuk izin akses tambahan.
              </p>
            </div>
          )}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
