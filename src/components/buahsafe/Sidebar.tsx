import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Cpu,
  ClipboardList,
  Leaf,
  Activity,
  ScanLine,
  BarChart3,
  Database,
  LogOut,
} from "lucide-react";
import { getDevices } from "@/lib/buahsafe-data";
import { useEffect, useState } from "react";
import { useAuth, Role, ROLE_LABELS, ROLE_COLORS } from "@/lib/auth";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

const ALL_ITEMS: NavItem[] = [
  { to: "/", label: "Ringkasan", icon: LayoutDashboard, roles: ["supervisor", "owner"] },
  { to: "/scan", label: "Pemindaian", icon: ScanLine, roles: ["operator"] },
  { to: "/devices", label: "Perangkat", icon: Cpu, roles: ["supervisor", "owner"] },
  { to: "/history", label: "Riwayat Sortasi", icon: ClipboardList, roles: ["operator", "supervisor", "owner"] },
  { to: "/analytics", label: "Analitik", icon: BarChart3, roles: ["supervisor", "owner"] },
  { to: "/master-data", label: "Data Master", icon: Database, roles: ["owner"] },
];

function useVisibleItems() {
  const { user } = useAuth();
  if (!user) return [];
  return ALL_ITEMS.filter((i) => i.roles.includes(user.role));
}

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [counts, setCounts] = useState({ online: 0, total: 0 });
  const { user, logout } = useAuth();
  const items = useVisibleItems();

  useEffect(() => {
    const update = () => {
      const d = getDevices();
      setCounts({
        online: d.filter((x) => x.status === "online" || x.status === "idle").length,
        total: d.length,
      });
    };
    update();
    const i = setInterval(update, 5000);
    return () => clearInterval(i);
  }, []);

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar h-screen sticky top-0">
      <div className="px-6 py-5 flex items-center gap-2 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Leaf className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="font-semibold text-[15px] tracking-tight">BuahSafe</div>
          <div className="text-[11px] text-muted-foreground -mt-0.5">Sistem Inspeksi Mutu</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground/70 hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="flex-1">{item.label}</span>
              {item.to === "/devices" && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {counts.online}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        <div className="rounded-lg border border-border p-3 bg-card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="w-3.5 h-3.5 text-primary" />
            Status Armada
          </div>
          <div className="mt-1.5 text-sm font-semibold">
            {counts.online} / {counts.total} perangkat aktif
          </div>
          <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(counts.online / Math.max(counts.total, 1)) * 100}%` }}
            />
          </div>
        </div>

        {user && (
          <div className="rounded-lg border border-border p-3 bg-card">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                {user.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user.name}</div>
                <span className={`inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded border ${ROLE_COLORS[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-2.5 w-full h-8 rounded-md border border-border hover:bg-accent flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar / Ganti Akun</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export function MobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { logout } = useAuth();
  const items = useVisibleItems().slice(0, 4);
  if (items.length === 0) return null;
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border flex items-center">
      {items.map((item) => {
        const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-[11px] ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
      <button
        onClick={logout}
        className="flex-1 flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground hover:text-foreground"
        title="Keluar"
      >
        <LogOut className="w-4 h-4" />
        <span>Keluar</span>
      </button>
    </nav>
  );
}
