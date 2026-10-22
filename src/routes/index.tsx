import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine,
  ShieldCheck,
  AlertTriangle,
  Wifi,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, formatDistanceToNow, startOfDay, subDays } from "date-fns";
import { PageLayout } from "@/components/buahsafe/Layout";
import { ResultBadge, DeviceStatusPill } from "@/components/buahsafe/StatusBadge";
import {
  getDevices,
  getScans,
  syncDevices,
  syncScans,
  DEVICE_COLORS,
  ScanRecord,
  Device,
} from "@/lib/buahsafe-data";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function useCountUp(target: number, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function StatCard({
  index,
  title,
  value,
  displayValue,
  subtitle,
  suffix,
  icon: Icon,
  accent,
  trend,
}: {
  index: number;
  title: string;
  value: number;
  displayValue?: string;
  subtitle?: string;
  suffix?: string;
  icon: React.ElementType;
  accent: "emerald" | "rose" | "amber" | "slate";
  trend?: { dir: "up" | "down"; pct: number };
}) {
  const v = useCountUp(value);
  const accentMap = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
      className="rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accentMap[accent]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <div className="text-3xl font-semibold tracking-tight">
          {displayValue ?? `${v}${suffix ?? ""}`}
        </div>
        {trend && (
          <div
            className={`flex items-center text-xs font-medium ${
              trend.dir === "up" ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {trend.dir === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.pct.toFixed(1)}%
          </div>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{subtitle ?? "dibandingkan hari kemarin"}</div>
    </motion.div>
  );
}

function Dashboard() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    setScans(getScans());
    setDevices(getDevices());

    // Sinkronisasi berkala dari server backend
    const sync = async () => {
      await syncDevices();
      setScans(await syncScans());
      setDevices(getDevices());
    };
    sync();
    const interval = setInterval(sync, 10_000);
    return () => clearInterval(interval);
  }, []);

  // Metrik hari ini
  const today0 = startOfDay(new Date()).getTime();
  const yest0 = startOfDay(subDays(new Date(), 1)).getTime();

  const todayScans = scans.filter((s) => new Date(s.timestamp).getTime() >= today0);
  const yestScans = scans.filter((s) => {
    const t = new Date(s.timestamp).getTime();
    return t >= yest0 && t < today0;
  });

  const totalToday = todayScans.length;
  const normalToday = todayScans.filter((s) => s.result === "NORMAL").length;
  const passToday = totalToday ? (normalToday / totalToday) * 100 : 0;
  const anomToday = todayScans.length - normalToday;

  const normalYest = yestScans.filter((s) => s.result === "NORMAL").length;
  const passYest = yestScans.length ? (normalYest / yestScans.length) * 100 : 0;
  const anomYest = yestScans.length - normalYest;

  const passTrend = yestScans.length ? passToday - passYest : 0;
  const anomTrend = anomYest ? ((anomToday - anomYest) / anomYest) * 100 : 0;

  const activeDevices = devices.filter((d) => d.status !== "offline").length;

  // Tren 7 hari terakhir
  const trend7 = Array.from({ length: 7 }).map((_, i) => {
    const day = startOfDay(subDays(new Date(), 6 - i));
    const next = day.getTime() + 86400000;
    const dayScans = scans.filter((s) => {
      const t = new Date(s.timestamp).getTime();
      return t >= day.getTime() && t < next;
    });
    const n = dayScans.filter((s) => s.result === "NORMAL").length;
    const a = dayScans.length - n;
    return {
      day: format(day, "d MMM"),
      NORMAL: n,
      ANOMALI: a,
      passRate: dayScans.length ? Math.round((n / dayScans.length) * 100) : 0,
    };
  });

  const recent = [...scans].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8);

  const totalScansAll = scans.length;
  const normalScansAll = scans.filter((s) => s.result === "NORMAL").length;
  const cumulativePassRate = totalScansAll ? Math.round((normalScansAll / totalScansAll) * 100) : 0;

  return (
    <PageLayout
      title="Ringkasan Operasional"
      subtitle="Pantauan mutu spektroskopi dan performa sortasi waktu nyata"
      roles={["supervisor", "owner"]}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          index={0}
          title="Total Pindaian Hari Ini"
          value={totalToday}
          subtitle={totalToday > 0 ? "dibandingkan hari kemarin" : "Belum ada pindaian sesi hari ini"}
          icon={ScanLine}
          accent="slate"
        />
        <StatCard
          index={1}
          title="Tingkat Kelolosan Mutu"
          value={Math.round(passToday)}
          displayValue={totalToday > 0 ? `${Math.round(passToday)}%` : totalScansAll > 0 ? `${cumulativePassRate}%*` : "—"}
          subtitle={
            totalToday > 0
              ? "dibandingkan hari kemarin"
              : totalScansAll > 0
                ? "*Belum ada pindaian hari ini; angka = rata-rata seluruh riwayat"
                : "Belum ada data sortasi"
          }
          icon={ShieldCheck}
          accent="emerald"
          trend={totalToday > 0 && yestScans.length ? { dir: passTrend >= 0 ? "up" : "down", pct: Math.abs(passTrend) } : undefined}
        />
        <StatCard
          index={2}
          title="Anomali Terdeteksi"
          value={anomToday}
          subtitle={totalToday > 0 ? "dibandingkan hari kemarin" : "Belum ada temuan hari ini"}
          icon={AlertTriangle}
          accent="rose"
          trend={totalToday > 0 && anomYest ? { dir: anomTrend <= 0 ? "up" : "down", pct: Math.abs(anomTrend) } : undefined}
        />
        <StatCard
          index={3}
          title="Armada Aktif"
          value={activeDevices}
          suffix={` / ${devices.length}`}
          subtitle={`${devices.length - activeDevices} perangkat nonaktif`}
          icon={Wifi}
          accent={activeDevices === devices.length ? "emerald" : "amber"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-6">
        {/* Feed pindaian langsung */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
              </span>
              <h3 className="font-semibold text-sm">Aktivitas Pemindaian Terbaru</h3>
            </div>
            <Link to="/history" className="text-xs text-primary hover:underline font-medium">
              Lihat semua riwayat →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recent.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                Belum ada pindaian tercatat. Hasil dari meja sortasi akan muncul di sini.
              </div>
            )}
            <AnimatePresence initial={false}>
              {recent.map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-5 py-3 flex items-center gap-4 hover:bg-accent/40 transition-colors"
                >
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${DEVICE_COLORS[s.deviceId] || "bg-muted text-muted-foreground"}`}>
                    {s.deviceId}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate font-mono">{s.fruitId || s.batchId}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(s.timestamp), { addSuffix: true })} · {s.deviceName}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 w-32">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full ${s.result === "NORMAL" ? "bg-emerald-500" : "bg-rose-500"}`}
                        style={{ width: `${s.confidence}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums font-mono">{s.confidence}%</div>
                  </div>
                  <ResultBadge result={s.result} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Status Armada Meja Sortasi */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm">Status Armada Pemindai</h3>
          </div>
          <div className="p-3 space-y-2">
            {devices.map((d) => {
              const todayCount = todayScans.filter((s) => s.deviceId === d.id).length;
              return (
                <Link
                  key={d.id}
                  to="/devices"
                  className="block p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${DEVICE_COLORS[d.id] || "bg-muted text-muted-foreground"}`}>
                      {d.id}
                    </span>
                    <DeviceStatusPill status={d.status} />
                  </div>
                  <div className="mt-2 font-medium text-sm">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.location}</div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(d.lastSeen), { addSuffix: true })}
                    </span>
                    <span className="font-medium tabular-nums">{todayCount} pindaian hari ini</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grafik Tren 7 Hari */}
      <div className="mt-6 rounded-xl border border-border bg-card shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">Aktivitas Pemindaian — 7 Hari Terakhir</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Distribusi perbandingan buah NORMAL vs ANOMALI</p>
        </div>
        <div className="p-5 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend7} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gNorm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gAnom" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-border bg-card shadow-md p-3 text-xs">
                      <div className="font-medium mb-1">{label}</div>
                      <div className="text-emerald-600 font-semibold">Normal: {d.NORMAL}</div>
                      <div className="text-rose-600 font-semibold">Anomali: {d.ANOMALI}</div>
                      <div className="text-muted-foreground mt-1 pt-1 border-t border-border">
                        Tingkat Kelolosan: {d.passRate}%
                      </div>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="NORMAL" stroke="#10B981" strokeWidth={2} fill="url(#gNorm)" />
              <Area type="monotone" dataKey="ANOMALI" stroke="#F43F5E" strokeWidth={2} fill="url(#gAnom)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageLayout>
  );
}
