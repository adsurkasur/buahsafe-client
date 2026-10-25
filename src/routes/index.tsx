import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, formatDistanceToNow, startOfDay, subDays } from "date-fns";
import { ScanLine } from "lucide-react";
import { PageLayout } from "@/components/buahsafe/Layout";
import { DeviceStatus, EmptyState, KpiTile, VerdictChip, useChartColors } from "@/components/buahsafe/ui";
import { fetchDeviceStatus, fetchQueue, getDevices, getScans, QueueItem, ScanRecord, syncDevices, syncScans } from "@/lib/buahsafe-data";

export const Route = createFileRoute("/")({ component: Ringkasan });

type DeviceInfo = {
  connected: boolean;
  firmware?: string;
  seconds_since_seen?: number | null;
  last_trigger_ms?: number | null;
  last_measure_ms?: number | null;
  rssi?: string | null;
};

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");

function Ringkasan() {
  const [scans, setScans] = useState<ScanRecord[]>(getScans());
  const [recent, setRecent] = useState<QueueItem[]>([]);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const deviceName = getDevices()[0]?.name;
  const c = useChartColors();

  useEffect(() => {
    // Paralel: status alat tidak boleh menunggu riwayat yang lebih berat
    const sync = () => {
      fetchDeviceStatus().then((d) => setDevice(d as DeviceInfo | null));
      fetchQueue(200).then((q) => q && setRecent(q));
      syncDevices().then(syncScans).then(setScans);
    };
    sync();
    const i = setInterval(sync, 10_000);
    return () => clearInterval(i);
  }, []);

  const today0 = startOfDay(new Date()).getTime();
  const isToday = (ts: string) => new Date(ts).getTime() >= today0;
  const todayScans = scans.filter((s) => isToday(s.timestamp));
  const normal = todayScans.filter((s) => s.result === "NORMAL").length;
  const anomali = todayScans.length - normal;
  const gagal = recent.filter((r) => r.verdict === "GAGAL" && isToday(r.timestamp)).length;
  const total = todayScans.length + gagal;

  const week = Array.from({ length: 7 }, (_, i) => {
    const day = startOfDay(subDays(new Date(), 6 - i));
    const next = day.getTime() + 86_400_000;
    const ds = scans.filter((s) => {
      const t = new Date(s.timestamp).getTime();
      return t >= day.getTime() && t < next;
    });
    const n = ds.filter((s) => s.result === "NORMAL").length;
    return { hari: format(day, "EEE d"), Normal: n, Anomali: ds.length - n };
  });
  const weekHasData = week.some((d) => d.Normal + d.Anomali > 0);

  return (
    <PageLayout
      title="Ringkasan hari ini"
      subtitle={format(new Date(), "EEEE, d MMMM yyyy")}
      roles={["supervisor", "owner"]}
      actions={
        <>
          <DeviceStatus connected={device?.connected} simulator={!!device?.firmware?.startsWith("sim")} />
          <Link to="/antrean" className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2">
            <ScanLine className="w-5 h-5" /> Buka antrean
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiTile label="Buah dipindai" value={total ? String(total) : "—"} hint={total ? "sejak pukul 00.00" : "Belum ada buah hari ini"} />
        <KpiTile label="Lolos mutu" value={pct(normal, todayScans.length)} hint={todayScans.length ? `${normal} dari ${todayScans.length} buah dinilai` : "Menunggu buah pertama"} tone="pass" />
        <KpiTile label="Anomali" value={todayScans.length ? String(anomali) : "—"} hint="ke keranjang merah" tone="reject" />
        <KpiTile label="Disisihkan" value={total ? String(gagal) : "—"} hint="sensor atau model gagal" tone="hold" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="font-bold">Buah terakhir</h2>
            <Link to="/riwayat" className="text-sm font-semibold text-primary hover:underline">Lihat riwayat</Link>
          </div>
          {recent.length ? (
            <ol className="px-3 pb-3">
              {recent.slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-2 py-2.5 border-t border-border first:border-t-0">
                  <span className="w-14 text-lg font-extrabold tabular">#{r.seq}</span>
                  <span className="flex-1 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(r.timestamp), { addSuffix: true })}
                  </span>
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
              ["Detak terakhir", device?.seconds_since_seen != null ? `${Math.round(device.seconds_since_seen)} detik lalu` : "belum ada"],
              ["Firmware", device?.firmware ?? "—"],
              ["Sinyal PIR aktif", device?.last_trigger_ms != null ? `${device.last_trigger_ms} ms` : "—"],
              ["Lama pengukuran", device?.last_measure_ms != null ? `${device.last_measure_ms} ms` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-semibold tabular text-right">{v}</dd>
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
        {weekHasData ? (
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={week} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={c.grid} />
                <XAxis dataKey="hari" tickLine={false} axisLine={false} fontSize={12} stroke={c.text} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke={c.text} />
                <Tooltip cursor={{ fill: c.accent }} contentStyle={{ borderRadius: 12, border: `1px solid ${c.grid}`, background: c.card }} />
                <Bar dataKey="Normal" stackId="a" fill={c.pass} radius={[0, 0, 4, 4]} />
                <Bar dataKey="Anomali" stackId="a" fill={c.reject} radius={[4, 4, 0, 0]} />
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
