import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, formatDistanceToNow, startOfDay, subDays } from "date-fns";
import { ScanLine } from "lucide-react";
import { PageLayout } from "@/components/buahsafe/Layout";
import { ConfidenceBadge, DeviceStatus, EmptyState, KpiTile, SkeletonRows, VerdictChip, useChartColors } from "@/components/buahsafe/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { DeviceStatusInfo, fetchDeviceStatus, fetchQueue, getDevices, getScans, QueueItem, ScanRecord, syncDevices, syncScans } from "@/lib/buahsafe-data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({ component: Ringkasan });

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");

function Ringkasan() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === "operator") {
      navigate({ to: "/antrean", replace: true });
    }
  }, [user?.role, navigate]);

  const [scans, setScans] = useState<ScanRecord[]>(getScans());
  const [recent, setRecent] = useState<QueueItem[] | null>(null);
  const [synced, setSynced] = useState(false);
  const [device, setDevice] = useState<DeviceStatusInfo | null>(null);
  const deviceName = getDevices()[0]?.name;
  const c = useChartColors();

  useEffect(() => {
    // Paralel: status alat tidak boleh menunggu riwayat yang lebih berat
    const sync = () => {
      fetchDeviceStatus().then(setDevice);
      fetchQueue(8).then((q) => q && setRecent(q));
      syncDevices()
        .then(syncScans)
        .then((s) => {
          setScans(s);
          setSynced(true);
        });
    };
    sync();
    const i = setInterval(sync, 10_000);
    return () => clearInterval(i);
  }, []);

  const today0 = startOfDay(new Date()).getTime();
  const isToday = (ts: string) => new Date(ts).getTime() >= today0;
  const todayScans = scans.filter((s) => isToday(s.timestamp));
  const count = (list: ScanRecord[], r: ScanRecord["result"]) => list.filter((s) => s.result === r).length;
  const normal = count(todayScans, "NORMAL");
  const anomali = count(todayScans, "ANOMALI");
  const gagal = count(todayScans, "GAGAL");
  const total = todayScans.length;
  const judged = normal + anomali;
  const loading = !synced && !scans.length;

  const week = Array.from({ length: 7 }, (_, i) => {
    const day = startOfDay(subDays(new Date(), 6 - i));
    const next = day.getTime() + 86_400_000;
    const ds = scans.filter((s) => {
      const t = new Date(s.timestamp).getTime();
      return t >= day.getTime() && t < next;
    });
    return { hari: format(day, "EEE d"), Normal: count(ds, "NORMAL"), Anomali: count(ds, "ANOMALI"), "Gagal dinilai": count(ds, "GAGAL") };
  });
  const weekHasData = week.some((d) => d.Normal + d.Anomali + d["Gagal dinilai"] > 0);

  return (
    <PageLayout
      title="Ringkasan hari ini"
      subtitle={format(new Date(), "EEEE, d MMMM yyyy")}
      roles={["supervisor", "owner"]}
      actions={
        <>
          <DeviceStatus connected={device?.connected} simulator={!!device?.firmware?.startsWith("sim")} enabled={device?.enabled !== false} />
          <Link to="/antrean" className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2">
            <ScanLine className="w-5 h-5" /> Buka antrean
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiTile loading={loading} label="Buah dipindai" value={total ? String(total) : "—"} hint={total ? "sejak pukul 00.00" : "Belum ada buah hari ini"} />
        <KpiTile loading={loading} label="Normal" value={pct(normal, judged)} hint={judged ? `${normal} dari ${judged} buah yang dinilai` : "Menunggu buah pertama"} tone="pass" />
        <KpiTile loading={loading} label="Anomali" value={total ? String(anomali) : "—"} hint="ke keranjang anomali" tone="reject" />
        <KpiTile loading={loading} label="Gagal dinilai" value={total ? String(gagal) : "—"} hint="disisihkan, periksa manual" tone="hold" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="font-bold">Buah terakhir</h2>
            <Link to="/riwayat" className="text-sm font-semibold text-primary hover:underline">Lihat riwayat</Link>
          </div>
          {recent === null ? (
            <div className="px-5 pb-5"><SkeletonRows rows={5} className="h-10" /></div>
          ) : recent.length ? (
            <ol className="px-3 pb-3">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-2 py-2.5 border-t border-border first:border-t-0">
                  <span className="w-14 text-lg font-extrabold tabular">#{r.seq}</span>
                  <span className="flex-1 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(r.timestamp), { addSuffix: true })}
                  </span>
                  <ConfidenceBadge confidence={r.confidence} result={r.verdict} />
                  <VerdictChip verdict={r.verdict} />
                </li>
              ))}
            </ol>
          ) : (
            <div className="p-5 pt-0"><EmptyState title="Belum ada buah">Hasil conveyor muncul di sini setelah belt berjalan.</EmptyState></div>
          )}
        </section>

        <section className="rounded-2xl bg-card border border-border p-5">
          <h2 className="font-bold">Kondisi alat</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ["Nama", deviceName ?? "BSF-001"],
              ["Status", device?.enabled === false ? "Diputus pemilik" : device?.connected ? "Terhubung" : "Tidak terhubung"],
              ["Detak terakhir", device?.seconds_since_seen != null ? `${Math.round(device.seconds_since_seen)} detik lalu` : "belum ada"],
              ["Firmware", device?.firmware ?? "—"],
              ["Sinyal PIR aktif", device?.last_trigger_ms != null ? `${device.last_trigger_ms} ms` : "—"],
              ["Lama pengukuran", device?.last_measure_ms != null ? `${device.last_measure_ms} ms` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-semibold tabular text-right">{device ? v : <Skeleton className="h-4 w-20" />}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
            Lama sinyal PIR dan lama pengukuran dipakai untuk mengatur jeda lampu agar pengukuran selesai sebelum buah
            keluar dari depan sensor.
          </p>
        </section>
      </div>

      <section className="mt-6 rounded-2xl bg-card border border-border p-5">
        <h2 className="font-bold">Tujuh hari terakhir</h2>
        <p className="text-sm text-muted-foreground">Jumlah buah per hari menurut putusan model</p>
        {loading ? (
          <Skeleton className="h-64 mt-4 rounded-xl" />
        ) : weekHasData ? (
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={week} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={c.grid} />
                <XAxis dataKey="hari" tickLine={false} axisLine={false} fontSize={12} stroke={c.text} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke={c.text} />
                <Tooltip cursor={{ fill: c.accent }} contentStyle={{ borderRadius: 12, border: `1px solid ${c.grid}`, background: c.card }} />
                <Bar dataKey="Normal" stackId="a" fill={c.pass} radius={[0, 0, 4, 4]} />
                <Bar dataKey="Anomali" stackId="a" fill={c.reject} />
                <Bar dataKey="Gagal dinilai" stackId="a" fill={c.hold} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4"><EmptyState title="Belum ada data minggu ini" /></div>
        )}
      </section>
    </PageLayout>
  );
}
