import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Fragment, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Search, X, ArrowUpDown, Download } from "lucide-react";
import { PageLayout } from "@/components/buahsafe/Layout";
import { ResultBadge } from "@/components/buahsafe/StatusBadge";
import { SpectralMiniChart } from "@/components/buahsafe/SpectralMiniChart";
import {
  getScans,
  getDevices,
  syncScans,
  DEVICE_COLORS,
  ScanRecord,
} from "@/lib/buahsafe-data";
import { useAuth } from "@/lib/auth";

const searchSchema = z.object({
  device: fallback(z.string(), "all").default("all"),
  result: fallback(z.enum(["all", "NORMAL", "ANOMALI"]), "all").default("all"),
  q: fallback(z.string(), "").default(""),
  from: fallback(z.string(), "").default(""),
  to: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/history")({
  validateSearch: zodValidator(searchSchema),
  component: HistoryPage,
});

function HistoryPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/history" });
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [sortDesc, setSortDesc] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setScans(getScans());
    syncScans().then(setScans);
  }, []);

  const devices = getDevices();

  const filtered = useMemo(() => {
    let r = scans.slice();
    if (user?.role === "operator") r = r.filter((s) => s.operatorId === user.id);
    if (search.device !== "all") r = r.filter((s) => s.deviceId === search.device);
    if (search.result !== "all") r = r.filter((s) => s.result === search.result);
    if (search.q) {
      const qLower = search.q.toLowerCase();
      r = r.filter(
        (s) =>
          s.batchId.toLowerCase().includes(qLower) ||
          (s.fruitId && s.fruitId.toLowerCase().includes(qLower)),
      );
    }
    if (search.from) r = r.filter((s) => s.timestamp >= search.from);
    if (search.to) r = r.filter((s) => s.timestamp <= search.to + "T23:59:59");
    r.sort((a, b) =>
      sortDesc ? b.timestamp.localeCompare(a.timestamp) : a.timestamp.localeCompare(b.timestamp),
    );
    return r;
  }, [scans, search, sortDesc, user]);

  const passes = filtered.filter((s) => s.result === "NORMAL").length;
  const passRate = filtered.length ? Math.round((passes / filtered.length) * 100) : 0;
  const anomalies = filtered.length - passes;

  const setParam = (key: string, value: string) => {
    navigate({ search: (prev: any) => ({ ...prev, [key]: value }) as any });
  };

  const activeChips: { key: string; label: string }[] = [];
  if (search.device !== "all") activeChips.push({ key: "device", label: `Perangkat: ${search.device}` });
  if (search.result !== "all") activeChips.push({ key: "result", label: `Hasil: ${search.result}` });
  if (search.q) activeChips.push({ key: "q", label: `Cari: ${search.q}` });
  if (search.from) activeChips.push({ key: "from", label: `Mulai: ${search.from}` });
  if (search.to) activeChips.push({ key: "to", label: `Sampai: ${search.to}` });

  const clearChip = (key: string) =>
    setParam(key, key === "device" || key === "result" ? "all" : "");

  const downloadCSV = () => {
    const headers = [
      "Waktu_Pindai",
      "Perangkat",
      "ID_Buah",
      "Batch_ID",
      "Hasil_Mutu",
      "Keyakinan_Persen",
      "R610",
      "R680",
      "R730",
      "R760",
      "R810",
      "R860",
    ];
    const rows = filtered.map((s) => [
      `"${s.timestamp}"`,
      `"${s.deviceId}"`,
      `"${s.fruitId || ""}"`,
      `"${s.batchId}"`,
      `"${s.result}"`,
      s.confidence,
      s.spectral?.nm610 ?? "",
      s.spectral?.nm680 ?? "",
      s.spectral?.nm730 ?? "",
      s.spectral?.nm760 ?? "",
      s.spectral?.nm810 ?? "",
      s.spectral?.nm860 ?? "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `buahsafe_laporan_sortasi_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageLayout
      title="Riwayat Sortasi"
      subtitle={
        user?.role === "operator"
          ? "Riwayat pemindaian spektrum buah oleh Anda"
          : "Cari, filter, dan telusuri seluruh riwayat pemindaian mutu buah"
      }
    >
      {/* Baris Filter */}
      <div className="sticky top-[73px] z-20 -mx-6 lg:-mx-10 px-6 lg:px-10 py-3 bg-background/90 backdrop-blur border-b border-border">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={search.from}
            onChange={(e) => setParam("from", e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-card text-sm"
          />
          <span className="text-xs text-muted-foreground">s/d</span>
          <input
            type="date"
            value={search.to}
            onChange={(e) => setParam("to", e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-card text-sm"
          />
          <select
            value={search.device}
            onChange={(e) => setParam("device", e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-card text-sm"
          >
            <option value="all">Semua Perangkat</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id} — {d.name}
              </option>
            ))}
          </select>
          <select
            value={search.result}
            onChange={(e) => setParam("result", e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-card text-sm"
          >
            <option value="all">Semua Hasil</option>
            <option value="NORMAL">Normal</option>
            <option value="ANOMALI">Anomali</option>
          </select>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari ID buah atau batch..."
              value={search.q}
              onChange={(e) => setParam("q", e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        {activeChips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {activeChips.map((c) => (
              <button
                key={c.key}
                onClick={() => clearChip(c.key)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-xs hover:bg-accent"
              >
                {c.label} <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ringkasan Jumlah & Tombol Ekspor */}
      <div className="my-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <div>
          Menampilkan <span className="font-semibold text-foreground">{filtered.length}</span> data
          {" · "}
          <span className="text-emerald-600 font-medium">{passRate}% kelolosan</span>
          {" · "}
          <span className="text-rose-600 font-medium">{anomalies} anomali</span>
        </div>
        <button
          onClick={downloadCSV}
          disabled={filtered.length === 0}
          className="h-8 px-3 rounded-lg border border-border bg-card hover:bg-accent text-foreground text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          title="Unduh seluruh data hasil filter sebagai berkas CSV"
        >
          <Download className="w-3.5 h-3.5 text-primary" />
          Unduh Laporan CSV
        </button>
      </div>

      {/* Tabel Data */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => setSortDesc(!sortDesc)}
                    className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                  >
                    Waktu Pindai <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium">Perangkat</th>
                <th className="px-4 py-3 text-left font-medium">ID Buah / Batch</th>
                <th className="px-4 py-3 text-left font-medium">Hasil Klasifikasi</th>
                <th className="px-4 py-3 text-left font-medium">Tingkat Keyakinan</th>
                <th className="px-4 py-3 text-left font-medium">Reflektansi NIR 730 / 810 nm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.slice(0, 100).map((s) => (
                <Fragment key={s.id}>
                <tr
                  onClick={() => setOpenId(openId === s.id ? null : s.id)}
                  className="hover:bg-accent/40 transition-colors cursor-pointer"
                  title="Klik untuk melihat kurva spektral"
                >
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums font-mono text-xs">
                    {format(new Date(s.timestamp), "d MMM yyyy, HH:mm:ss")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${DEVICE_COLORS[s.deviceId] || "bg-muted text-muted-foreground"}`}>
                      {s.deviceId}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <div className="font-semibold text-foreground">{s.fruitId || "—"}</div>
                    <div className="text-[11px] text-muted-foreground">{s.batchId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <ResultBadge result={s.result} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 w-32">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full ${s.result === "NORMAL" ? "bg-emerald-500" : "bg-rose-500"}`}
                          style={{ width: `${s.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums font-mono">{s.confidence}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums font-mono text-xs">
                    {s.spectral ? `${s.spectral.nm730.toFixed(2)} / ${s.spectral.nm810.toFixed(2)}` : "—"}
                  </td>
                </tr>
                {openId === s.id && (
                  <tr>
                    <td colSpan={6} className="px-4 pb-4">
                      <SpectralMiniChart spectral={s.spectral} result={s.result} />
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Tidak ada data yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground text-center">
            Menampilkan 100 data teratas dari total {filtered.length} riwayat
          </div>
        )}
      </div>
    </PageLayout>
  );
}
