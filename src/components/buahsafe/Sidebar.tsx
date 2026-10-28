import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ClipboardList, ScanLine, BarChart3, Settings, LogOut } from "lucide-react";
import { useAuth, Role, ROLE_LABELS } from "@/lib/auth";
import { BrandMark, ThemeToggle, Tip } from "./ui";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/antrean", label: "Antrean", icon: ScanLine, roles: ["operator", "supervisor", "owner"] },
  { to: "/", label: "Ringkasan", icon: LayoutDashboard, roles: ["supervisor", "owner"] },
  { to: "/riwayat", label: "Riwayat & label", icon: ClipboardList, roles: ["supervisor", "owner"] },
  { to: "/analitik", label: "Analitik", icon: BarChart3, roles: ["supervisor", "owner"] },
  { to: "/pengaturan", label: "Pengaturan", icon: Settings, roles: ["owner"] },
];

function useNav() {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = user ? NAV_ITEMS.filter((i) => i.roles.includes(user.role)) : [];
  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
  return { items, isActive };
}

function initials(name: string) {
  return name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

export function AppSidebar() {
  const { items, isActive } = useNav();
  const { user, logout } = useAuth();
  return (
    // Kolom luar memberi latar penuh setinggi halaman; isi tetap menempel saat digulir
    <div className="hidden lg:block w-64 shrink-0 border-r border-sidebar-border bg-sidebar">
    <aside className="flex flex-col sticky top-0 h-dvh">
      <Link to={user?.role === "operator" ? "/antrean" : "/"} className="flex items-center gap-3 px-6 h-20">
        <BrandMark />
        <div>
          <div className="text-lg font-extrabold tracking-tight leading-none">BuahSafe</div>
          <div className="text-xs text-muted-foreground mt-1">Sortasi jambu kristal</div>
        </div>
      </Link>
      <nav className="flex-1 px-3 py-2 space-y-1" aria-label="Menu utama">
        {items.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 h-11 px-3 rounded-xl text-[15px] font-semibold transition-colors ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="m-3 rounded-2xl bg-secondary p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-leaf text-primary-foreground grid place-items-center text-sm font-bold">
              {initials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</div>
            </div>
            <ThemeToggle />
          </div>
          <Tip label="Keluar dari akun ini" side="top">
            <button
              onClick={logout}
              className="mt-3 w-full h-10 rounded-xl border border-border bg-card hover:bg-accent inline-flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" /> Keluar akun
            </button>
          </Tip>
        </div>
      )}
    </aside>
    </div>
  );
}

export function MobileTopBar() {
  const { user, logout } = useAuth();
  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 h-16 px-4 bg-background/90 backdrop-blur border-b border-border">
      <BrandMark className="w-8 h-8" />
      <div className="flex-1 min-w-0">
        <div className="font-extrabold leading-none">BuahSafe</div>
        {user && <div className="text-xs text-muted-foreground truncate mt-0.5">{user.name}, {ROLE_LABELS[user.role]}</div>}
      </div>
      <ThemeToggle />
      <Tip label="Keluar dari akun ini">
        <button onClick={logout} className="h-11 px-3 rounded-xl border border-border bg-card hover:bg-accent inline-flex items-center gap-2 text-sm font-semibold" aria-label="Keluar">
          <LogOut className="w-5 h-5" /> <span className="hidden sm:inline">Keluar</span>
        </button>
      </Tip>
    </header>
  );
}

export function MobileNav() {
  const { items, isActive } = useNav();
  if (items.length < 2) return null;
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border flex pb-[env(safe-area-inset-bottom)]" aria-label="Menu utama">
      {items.map((item) => {
        const active = isActive(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={`flex-1 min-h-14 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="truncate max-w-full px-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
