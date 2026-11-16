import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, AlertTriangle, WifiOff, PackagePlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getDevices, getScans } from "@/lib/buahsafe-data";

interface NotifItem {
  id: string;
  kind: "anomali" | "offline" | "batch";
  title: string;
  desc: string;
  ts: string;
  href?: string;
  search?: Record<string, string>;
}

function buildNotifications(): NotifItem[] {
  const scans = getScans();
  const devices = getDevices();
  const now = Date.now();
  const items: NotifItem[] = [];

  // Anomalies - last 1h
  const anomCutoff = now - 3600_000;
  scans
    .filter((s) => s.result === "ANOMALI" && new Date(s.timestamp).getTime() >= anomCutoff)
    .slice(-10)
    .reverse()
    .forEach((s) =>
      items.push({
        id: `a-${s.id}`,
        kind: "anomali",
        title: `Anomali detected on ${s.deviceId}`,
        desc: `${s.deviceName} · ${s.confidence}% confidence`,
        ts: s.timestamp,
        href: "/history",
        search: { result: "ANOMALI", device: s.deviceId },
      }),
    );

  // Offline devices
  devices
    .filter((d) => d.status === "offline")
    .forEach((d) =>
      items.push({
        id: `o-${d.id}`,
        kind: "offline",
        title: `${d.id} is offline`,
        desc: `${d.name} · last seen ${formatDistanceToNow(new Date(d.lastSeen), { addSuffix: true })}`,
        ts: d.lastSeen,
        href: "/devices",
      }),
    );

  // New batches - first scan in last 24h
  const dayCut = now - 86400_000;
  const seen = new Map<string, string>();
  scans.forEach((s) => {
    if (!seen.has(s.batchId)) seen.set(s.batchId, s.timestamp);
  });
  Array.from(seen.entries())
    .filter(([, ts]) => new Date(ts).getTime() >= dayCut)
    .slice(-5)
    .reverse()
    .forEach(([batch, ts]) =>
      items.push({
        id: `b-${batch}`,
        kind: "batch",
        title: `New batch started`,
        desc: batch,
        ts,
        href: "/history",
        search: { q: batch },
      }),
    );

  return items.sort((a, b) => b.ts.localeCompare(a.ts));
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const update = () => setItems(buildNotifications());
    update();
    const i = setInterval(update, 5000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (open) setSeenIds(new Set(items.map((i) => i.id)));
  }, [open, items]);

  const unread = mounted ? items.filter((i) => !seenIds.has(i.id)).length : 0;

  const iconFor = (k: NotifItem["kind"]) =>
    k === "anomali" ? AlertTriangle : k === "offline" ? WifiOff : PackagePlus;
  const colorFor = (k: NotifItem["kind"]) =>
    k === "anomali"
      ? "bg-rose-50 text-rose-600"
      : k === "offline"
      ? "bg-slate-100 text-slate-600"
      : "bg-emerald-50 text-emerald-600";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-accent"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-medium flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="font-semibold text-sm">Notifications</div>
            <span className="text-xs text-muted-foreground">{items.length} active</span>
          </div>
          <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
            {items.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                You're all caught up 🎉
              </div>
            )}
            {items.map((n) => {
              const Icon = iconFor(n.kind);
              const inner = (
                <div className="flex gap-3 px-4 py-3 hover:bg-accent transition-colors">
                  <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${colorFor(n.kind)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{n.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{n.desc}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(n.ts), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              );
              return n.href ? (
                <Link
                  key={n.id}
                  to={n.href}
                  search={n.search as any}
                  onClick={() => setOpen(false)}
                  className="block"
                >
                  {inner}
                </Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
