import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, startOfDay, subDays } from "date-fns";
import { PageLayout } from "@/components/buahsafe/Layout";
import { EmptyState, KpiTile, useChartColors } from "@/components/buahsafe/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { getScans, syncScans, ScanRecord } from "@/lib/buahsafe-data";

export const Route = createFileRoute("/analitik")({ component: AnalitikPage });

const PERIODS = [7, 30, 90] as const;

function AnalitikPage() {
  const [scans, setScans] = useState<ScanRecord[]>(getScans());
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const [synced, setSynced] = useState(false);
  const c = useChartColors();

  useEffect(() => {
    syncScans().then((s) => {
      setScans(s);
      setSynced(true);
    });
  }, []);
  const loading = !synced && !scans.length;

  const since = startOfDay(subDays(new Date(), days - 1)).getTime();
  const inPeriod = scans.filter((s) => new Date(s.timestamp).getTime() >= since);
  const count = (list: ScanRecord[], r: ScanRecord["result"]) => list.filter((s) => s.result === r).length;
  const normal = count(inPeriod, "NORMAL");
  const judged = normal + count(inPeriod, "ANOMALI");
  const labeled = inPeriod.filter((s) => s.label);
  // Kecocokan putusan model dengan hasil belah: perkiraan akurasi di lapangan
  const cell = (label: string, result: string) => labeled.filter((s) => s.label === label && s.result === result).length;
  const agree = cell("normal", "NORMAL") + cell("anomali", "ANOMALI");
  const missedRotten = cell("anomali", "NORMAL");
  const rottenLabeled = labeled.filter((s) => s.label === "anomali").length;

  const daily = Array.from({ length: days }, (_, i) => {
    const day = startOfDay(subDays(new Date(), days - 1 - i));
    const next = day.getTime() + 86_400_000;
    const ds = inPeriod.filter((s) => {
      const t = new Date(s.timestamp).getTime();
      return t >= day.getTime() && t < next;
    });
    return { hari: format(day, days > 30 ? "d/M" : "d MMM"), Normal: count(ds, "NORMAL"), Anomali: count(ds, "ANOMALI"), "Gagal dinilai": count(ds, "GAGAL") };
  });

  return (
    <PageLayout
      title="Analitik"
      subtitle="Volume dan mutu hasil sortasi, serta seberapa sering putusan model sesuai dengan hasil belah buah sampel."
      roles={["owner"]}
      actions={
        <div className="inline-flex rounded-xl border border-border bg-card p-1" role="group" aria-label="Periode">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setDays(p)}
              aria-pressed={days === p}
              className={`h-9 px-3 rounded-lg text-sm font-semibold ${days === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {p} hari
            </button>
          ))}
        </div>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiTile loading={loading} label="Buah dipindai" value={inPeriod.length ? inPeriod.length.toLocaleString("id-ID") : "—"} hint={`${days} hari terakhir`} />
        <KpiTile loading={loading} label="Normal menurut model" value={judged ? `${Math.round((normal / judged) * 100)}%` : "—"} hint="putusan model, bukan hasil belah" tone="pass" />
        <KpiTile loading={loading} label="Buah sampel dibelah" value={labeled.length ? String(labeled.length) : "—"} hint="dilabel di Riwayat & label" />
        <KpiTile
          loading={loading}
          label="Model sesuai hasil belah"
          value={labeled.length ? `${Math.round((agree / labeled.length) * 100)}%` : "—"}
          hint={labeled.length ? `${agree} dari ${labeled.length} buah sampel` : "Belum ada buah berlabel"}
          tone="pass"
        />
      </div>

      <section className="mt-6 rounded-2xl bg-card border border-border p-5">
        <h2 className="font-bold">Volume harian</h2>
        <p className="text-sm text-muted-foreground">Buah normal, anomali, dan gagal dinilai per hari menurut model</p>
        {loading ? (
          <Skeleton className="h-72 mt-4 rounded-xl" />
        ) : inPeriod.length ? (
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={c.grid} />
                <XAxis dataKey="hari" tickLine={false} axisLine={false} fontSize={11} stroke={c.text} interval={Math.ceil(days / 8) - 1} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke={c.text} />
                <Tooltip cursor={{ fill: c.accent }} contentStyle={{ borderRadius: 12, border: `1px solid ${c.grid}`, background: c.card }} />
                <Bar dataKey="Normal" stackId="a" fill={c.pass} />
                <Bar dataKey="Anomali" stackId="a" fill={c.reject} />
                <Bar dataKey="Gagal dinilai" stackId="a" fill={c.hold} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4"><EmptyState title="Belum ada buah pada periode ini" /></div>
        )}
      </section>

      <section className="mt-6 rounded-2xl bg-card border border-border p-5">
        <h2 className="font-bold">Putusan model dibandingkan hasil belah</h2>
        <p className="text-sm text-muted-foreground max-w-[70ch]">
          Satu-satunya cara mengetahui ketepatan model di conveyor adalah membelah sebagian buah dan mencatat hasilnya.
          Baris = kondisi sebenarnya, kolom = putusan model.
        </p>
        {labeled.length ? (
          <>
            <table className="mt-4 text-sm tabular">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="p-2" />
                  <th className="p-2 font-semibold">Model: normal</th>
                  <th className="p-2 font-semibold">Model: anomali</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th className="p-2 text-left font-semibold">Belah: normal</th>
                  <td className="p-2"><span className="block rounded-lg bg-pass/15 px-4 py-3 text-center text-lg font-bold">{cell("normal", "NORMAL")}</span></td>
                  <td className="p-2"><span className="block rounded-lg bg-secondary px-4 py-3 text-center text-lg font-bold">{cell("normal", "ANOMALI")}</span></td>
                </tr>
                <tr>
                  <th className="p-2 text-left font-semibold">Belah: anomali</th>
                  <td className="p-2"><span className="block rounded-lg bg-reject/15 px-4 py-3 text-center text-lg font-bold">{missedRotten}</span></td>
                  <td className="p-2"><span className="block rounded-lg bg-pass/15 px-4 py-3 text-center text-lg font-bold">{cell("anomali", "ANOMALI")}</span></td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-sm text-muted-foreground">
              {rottenLabeled
                ? `${missedRotten} dari ${rottenLabeled} buah busuk sampel lolos sebagai normal.`
                : "Belum ada buah sampel yang terbukti busuk."}{" "}
              Sampel kecil memberi perkiraan yang kasar; tambah buah sampel agar angkanya lebih dapat dipercaya.
            </p>
          </>
        ) : (
          <div className="mt-4">
            <EmptyState title="Belum ada buah sampel berlabel">
              Ambil beberapa buah dari belt, simpan sampai kerusakan tampak atau belah, lalu catat hasilnya di Riwayat & label.
            </EmptyState>
          </div>
        )}
      </section>
    </PageLayout>
  );
}
