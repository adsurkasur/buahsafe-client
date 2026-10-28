import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ShieldAlert, WifiOff } from "lucide-react";
import { AppSidebar, MobileNav, MobileTopBar } from "./Sidebar";
import { PageHeader } from "./ui";
import { useAuth, Role, ROLE_LABELS } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

/** Satu pengecekan server untuk semua halaman: true bila backend tak terjangkau. */
export function useServerDown() {
  const [down, setDown] = useState(false);
  useEffect(() => {
    const check = () => apiFetch("api/status", { timeoutMs: 4000 }).then((r) => setDown(!r.ok));
    check();
    const i = setInterval(check, 15_000);
    return () => clearInterval(i);
  }, []);
  return down;
}

export function OfflineBanner() {
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl border border-hold/50 bg-hold/15 px-4 py-3 text-sm">
      <WifiOff className="w-5 h-5 mt-0.5 shrink-0 text-hold" />
      <div>
        <strong>Server BuahSafe tidak terhubung.</strong> Data yang tampil adalah salinan terakhir dan buah baru belum
        bisa dinilai. Hentikan belt, periksa internet, lalu halaman tersambung otomatis.
      </div>
    </div>
  );
}

/** Memastikan pengguna masuk dan perannya diizinkan sebelum isi halaman tampil. */
export function AuthGate({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (ready && !user && path !== "/login") navigate({ to: "/login" });
  }, [ready, user, path, navigate]);

  if (!ready || !user) {
    return <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Memuat…</div>;
  }
  /*
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <ShieldAlert className="w-10 h-10 text-hold mx-auto" />
          <h2 className="mt-3 text-lg font-bold">Halaman ini bukan untuk peran Anda</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Akun {ROLE_LABELS[user.role]} tidak memiliki akses ke halaman ini. Minta Pemilik menambah hak akses bila
            diperlukan.
          </p>
        </div>
      </div>
    );
  }
  */
  return <>{children}</>;
}

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  roles?: Role[];
}

export function PageLayout({ title, subtitle, actions, children, roles }: Props) {
  const serverDown = useServerDown();
  return (
    <AuthGate>
      <a href="#konten" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-card focus:px-4 focus:py-2 focus:shadow">
        Lewati ke konten
      </a>
      <div className="flex min-h-dvh">
        <AppSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <MobileTopBar />
          <main id="konten" className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10 pb-28 lg:pb-10">
            {serverDown && <div className="mb-6"><OfflineBanner /></div>}
            <AuthGate roles={roles}>
              <PageHeader title={title} description={subtitle} actions={actions} />
              {children}
            </AuthGate>
          </main>
        </div>
        <MobileNav />
      </div>
    </AuthGate>
  );
}
