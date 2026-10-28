import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, startOfDay, subDays } from "date-fns";
import { ShieldCheck, Sprout } from "lucide-react";
import { PageLayout } from "@/components/buahsafe/Layout";
import { EmptyState, KpiTile, useChartColors } from "@/components/buahsafe/ui";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calculatePricingSummary,
  DEFAULT_GRADE_PRICING,
  fetchActiveBatch,
  fetchGradePricing,
  getScans,
  GradePricingConfig,
  PetaniMitra,
  ScanRecord,
  syncScans,
} from "@/lib/buahsafe-data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/analitik")({ component: AnalitikPage });

type PeriodValue = 7 | 30 | 90 | "all";
const PERIODS: ReadonlyArray<{ value: PeriodValue; label: string }> = [
  { value: 7, label: "7 hari" },
  { value: 30, label: "30 hari" },
  { value: 90, label: "90 hari" },
  { value: "all", label: "Semua" },
];

function AnalitikPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>(getScans());
  const [days, setDays] = useState<PeriodValue>(30);
  const [synced, setSynced] = useState(false);
  const [pricing, setPricing] = useState<GradePricingConfig>(DEFAULT_GRADE_PRICING);
  const [petaniList, setPetaniList] = useState<PetaniMitra[]>([]);
  const c = useChartColors();

  useEffect(() => {
    syncScans().then((s) => {
      setScans(s);
      setSynced(true);
    });
    fetchGradePricing().then(setPricing);
    fetchActiveBatch().then((res) => {
      if (res?.petani) setPetaniList(res.petani);
    });
  }, []);
  const loading = !synced && !scans.length;

  const filtered = useMemo(() => {
    if (days === "all") return scans;
    const since = startOfDay(subDays(new Date(), days - 1)).getTime();
    return scans.filter((s) => new Date(s.timestamp).getTime() >= since);
  }, [scans, days]);

  const count = (list: ScanRecord[], r: ScanRecord["result"]) => list.filter((s) => s.result === r).length;
  const stats = useMemo(() => {
    const normal = count(filtered, "NORMAL");
    const anomali = count(filtered, "ANOMALI");
    const gagal = count(filtered, "GAGAL");
    return {
      total: filtered.length,
      normal,
      anomali,
      gagal,
      judged: normal + anomali,
    };
  }, [filtered]);

  const pricingSummary = useMemo(() => calculatePricingSummary(pricing), [pricing]);
  const estimatedSavedRp = stats.anomali * pricingSummary.savedPerAnomalyFruitRp;

  const labeled = filtered.filter((s) => s.label);
  // Kecocokan putusan model dengan hasil belah: perkiraan akurasi di lapangan
  const cell = (label: string, result: string) => labeled.filter((s) => s.label === label && s.result === result).length;
  const agree = cell("normal", "NORMAL") + cell("anomali", "ANOMALI");
  const missedRotten = cell("anomali", "NORMAL");
  const rottenLabeled = labeled.filter((s) => s.label === "anomali").length;

  const chartDays = days === "all" ? 30 : days;
  const daily = Array.from({ length: chartDays }, (_, i) => {
    const day = startOfDay(subDays(new Date(), chartDays - 1 - i));
    const next = day.getTime() + 86_400_000;
    const ds = filtered.filter((s) => {
      const t = new Date(s.timestamp).getTime();
      return t >= day.getTime() && t < next;
    });
    return {
      hari: format(day, chartDays > 30 ? "d/M" : "d MMM"),
      Normal: count(ds, "NORMAL"),
      Anomali: count(ds, "ANOMALI"),
      "Gagal dinilai": count(ds, "GAGAL"),
    };
  });

  const petaniRows = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        village: string;
        total: number;
        normal: number;
        anomali: number;
        judged: number;
      }
    >();

    for (const p of petaniList) {
      map.set(p.id, {
        id: p.id,
        name: p.name,
        village: p.village || "—",
        total: 0,
        normal: 0,
        anomali: 0,
        judged: 0,
      });
    }

    for (const s of filtered) {
      const key = s.petaniId?.trim() || "";
      const matched = key ? petaniList.find((p) => p.id === key) : undefined;
      const existing = map.get(key) ?? {
        id: key || "__unlinked__",
        name: matched ? matched.name : key ? key : "Batch Umum / Belum Ditautkan",
        village: matched?.village || "—",
        total: 0,
        normal: 0,
        anomali: 0,
        judged: 0,
      };
      existing.total += 1;
      if (s.result === "NORMAL") {
        existing.normal += 1;
        existing.judged += 1;
      } else if (s.result === "ANOMALI") {
        existing.anomali += 1;
        existing.judged += 1;
      }
      map.set(key, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }, [filtered, petaniList]);

  const periodLabel = PERIODS.find((p) => p.value === days)?.label ?? `${days} hari`;

  return (
    <PageLayout
      title="Analitik"
      subtitle="Volume dan mutu hasil sortasi, nilai risiko kerugian yang dicegah, serta mutu pasokan per petani mitra."
      roles={["supervisor", "owner"]}
      actions={
        <div className="inline-flex rounded-xl border border-border bg-card p-1" role="group" aria-label="Periode">
          {PERIODS.map((p) => (
            <button
              key={String(p.value)}
              onClick={() => setDays(p.value)}
              aria-pressed={days === p.value}
              className={`h-9 px-3 rounded-lg text-sm font-semibold ${days === p.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      }
    >
      {/* Kartu Sorotan Bisnis: Estimasi Nilai Risiko Kerugian yang Dicegah */}
      <section
        data-testid="prevented-loss-card"
        className="mb-6 rounded-2xl border border-pass/40 bg-pass/10 p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pass">
            <ShieldCheck className="w-4 h-4" />
            <span>Estimasi Nilai Risiko Kerugian yang Dicegah ({periodLabel})</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tabular text-foreground">
            Rp {estimatedSavedRp.toLocaleString("id-ID")}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {stats.anomali} buah anomali tertahan × Rp {pricingSummary.savedPerAnomalyFruitRp.toLocaleString("id-ID")}/butir (Rata-rata{" "}
            {pricing.grades.length} grade komersial Rp {pricingSummary.avgCommercialPrice.toLocaleString("id-ID")}/{pricing.unit} dikurangi
            nilai sisa afkir Rp {pricing.afkir_price.toLocaleString("id-ID")}/{pricing.unit})
          </p>
        </div>

        {user?.role === "owner" && (
          <div className="shrink-0">
            <Link
              to="/pengaturan"
              search={{ tab: "tarif" }}
              className="h-10 px-4 rounded-xl border border-border bg-card hover:bg-accent text-sm font-semibold inline-flex items-center gap-2"
            >
              Atur tarif & grade →
            </Link>
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiTile loading={loading} label="Buah dipindai" value={stats.total ? stats.total.toLocaleString("id-ID") : "—"} hint={days === "all" ? "seluruh riwayat" : `${days} hari terakhir`} />
        <KpiTile loading={loading} label="Normal menurut model" value={stats.judged ? `${Math.round((stats.normal / stats.judged) * 100)}%` : "—"} hint="putusan model, bukan hasil belah" tone="pass" />
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
        ) : filtered.length ? (
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={c.grid} />
                <XAxis dataKey="hari" tickLine={false} axisLine={false} fontSize={11} stroke={c.text} interval={Math.ceil(chartDays / 8) - 1} />
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

      {/* Bagian Mutu Pasokan per Petani Mitra */}
      <section className="mt-6 rounded-2xl bg-card border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-bold inline-flex items-center gap-2">
              <Sprout className="w-4 h-4 text-primary" />
              <span>Mutu Pasokan per Petani Mitra</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Rekap kualitas panen dan risiko kerugian yang berhasil ditahan berdasarkan pemasok pada periode {periodLabel}.
            </p>
          </div>
        </div>

        {petaniRows.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="Belum ada data pasokan petani pada periode ini" />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm tabular">
              <thead className="bg-secondary text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Petani Mitra</th>
                  <th className="px-4 py-3 font-semibold">Desa</th>
                  <th className="px-4 py-3 font-semibold text-right">Jumlah Buah Diuji</th>
                  <th className="px-4 py-3 font-semibold text-right">Tingkat Lolos Normal (%)</th>
                  <th className="px-4 py-3 font-semibold text-right">Anomali Tertahan</th>
                  <th className="px-4 py-3 font-semibold text-right">Estimasi Risiko Dicegah (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {petaniRows.map((row) => {
                  const passRate = row.judged > 0 ? `${Math.round((row.normal / row.judged) * 100)}%` : "—";
                  const savedRp = row.anomali * pricingSummary.savedPerAnomalyFruitRp;
                  return (
                    <tr key={row.id} className="border-t border-border hover:bg-accent/40">
                      <td className="px-4 py-3 font-semibold text-foreground">{row.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.village}</td>
                      <td className="px-4 py-3 text-right font-semibold">{row.total.toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3 text-right font-semibold text-pass">{passRate}</td>
                      <td className="px-4 py-3 text-right font-semibold text-reject">{row.anomali.toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        Rp {savedRp.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
