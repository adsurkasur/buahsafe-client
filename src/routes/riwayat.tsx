import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Fragment, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Download, Search, ChevronDown, Database } from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/buahsafe/Layout";
import { EmptyState, SkeletonRows, Tip, VerdictChip } from "@/components/buahsafe/ui";
import { SpectralMiniChart } from "@/components/buahsafe/SpectralMiniChart";
import { downloadTrainingCsv, getScans, syncScans, setScanLabel, ScanRecord, WAVELENGTHS } from "@/lib/buahsafe-data";
import { useAuth } from "@/lib/auth";

const searchSchema = z.object({
  result: fallback(z.enum(["all", "NORMAL", "ANOMALI", "GAGAL"]), "all").default("all"),
  label: fallback(z.enum(["all", "unlabeled"]), "all").default("all"),
  q: fallback(z.string(), "").default(""),
  from: fallback(z.string(), "").default(""),
  to: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/riwayat")({
  validateSearch: zodValidator(searchSchema),
  component: RiwayatPage,
});

type Label = "" | "normal" | "anomali";
const field = "h-11 px-3 rounded-xl border border-input bg-card text-sm";

function RiwayatPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/riwayat" });
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>(getScans());
  const [openId, setOpenId] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);
  const canLabel = user?.role === "supervisor" || user?.role === "owner";

  useEffect(() => {
    syncScans().then((s) => {
      setScans(s);
      setSynced(true);
    });
  }, []);

  const set = (key: keyof typeof search, value: string) =>
    navigate({ search: (prev: any) => ({ ...prev, [key]: value }) as any, replace: true });

  const rows = useMemo(() => {
    const q = search.q.toLowerCase();
    return scans
      .filter((s) => search.result === "all" || s.result === search.result)
      .filter((s) => search.label === "all" || !s.label)
      .filter((s) => !q || s.fruitId.toLowerCase().includes(q))
      .filter((s) => !search.from || s.timestamp >= search.from)
      .filter((s) => !search.to || s.timestamp <= `${search.to}T23:59:59`)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [scans, search]);

  const unlabeled = rows.filter((s) => !s.label).length;
  const normal = rows.filter((s) => s.result === "NORMAL").length;
  const judged = rows.filter((s) => s.result !== "GAGAL").length;
  const conf = (s: ScanRecord) => (s.result === "GAGAL" ? "—" : `${s.confidence}%`);

  const downloadTraining = async () => {
    const err = await downloadTrainingCsv();
    if (err) toast.error("Data latih belum terunduh", { description: err });
    else toast.success("Data latih terunduh", { description: "Kirim berkas ini ke tim BuahSafe untuk pelatihan ulang model." });
  };

  const changeLabel = async (scan: ScanRecord, label: Label) => {
    const res = await setScanLabel(scan.id, label);
    if (!res.ok) {
      toast.error("Label belum tersimpan", { description: res.error });
      return;
    }
    setScans((all) => all.map((x) => (x.id === scan.id ? { ...x, label } : x)));
    toast.success(`Label ${scan.fruitId}: ${label || "dikosongkan"}`);
  };

  const downloadCSV = () => {
    const header = ["Waktu", "ID_Buah", "Putusan_Model", "Keyakinan_Persen", ...WAVELENGTHS.map((w) => `I${w}`), "Label_Hasil_Belah"];
    const lines = rows.map((s) =>
      [s.timestamp, s.fruitId, s.result, s.confidence, ...WAVELENGTHS.map((w) => s.spectral?.[`nm${w}`] ?? ""), s.label || ""].join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `buahsafe_riwayat_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const labelControl = (s: ScanRecord) =>
    canLabel ? (
      <select
        value={s.label || ""}
        onChange={(e) => changeLabel(s, e.target.value as Label)}
        onClick={(e) => e.stopPropagation()}
        className="h-10 px-2 rounded-lg border border-input bg-background text-sm"
        aria-label={`Label hasil belah ${s.fruitId}`}
      >
        <option value="">Belum dibelah</option>
        <option value="normal">Normal</option>
        <option value="anomali">Anomali</option>
      </select>
    ) : (
      <span className="text-sm text-muted-foreground">{s.label || "Belum dibelah"}</span>
    );

  return (
    <PageLayout
      title="Riwayat & label"
      subtitle="Telusuri hasil sortasi dan catat hasil belah buah sampel untuk melatih ulang model."
      roles={["supervisor", "owner"]}
      actions={
        <>
          <Tip label="Daftar buah sesuai filter di bawah, untuk laporan harian">
            <button onClick={downloadCSV} disabled={!rows.length} className="h-11 px-4 rounded-xl border border-border bg-card hover:bg-accent text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50">
              <Download className="w-5 h-5" /> Unduh laporan (CSV)
            </button>
          </Tip>
          {canLabel && (
            <Tip label="Semua buah berlabel hasil belah beserta 18 kanal spektrum, format yang dipakai tim untuk melatih ulang model">
              <button onClick={downloadTraining} className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2">
                <Database className="w-5 h-5" /> Unduh data latih (CSV)
              </button>
            </Tip>
          )}
        </>
      }
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <label className="relative flex-1 min-w-[220px]">
          <span className="sr-only">Cari ID buah</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input value={search.q} onChange={(e) => set("q", e.target.value)} placeholder="Cari ID buah, mis. CV-20261025-0057…" className={`${field} w-full pl-10`} />
        </label>
        <select value={search.result} onChange={(e) => set("result", e.target.value)} className={field} aria-label="Putusan model">
          <option value="all">Semua putusan</option>
          <option value="NORMAL">Normal</option>
          <option value="ANOMALI">Anomali</option>
          <option value="GAGAL">Gagal dinilai</option>
        </select>
        <select value={search.label} onChange={(e) => set("label", e.target.value)} className={field} aria-label="Status label">
          <option value="all">Semua label</option>
          <option value="unlabeled">Belum dilabel</option>
        </select>
        <input type="date" value={search.from} onChange={(e) => set("from", e.target.value)} className={field} aria-label="Dari tanggal" />
        <input type="date" value={search.to} onChange={(e) => set("to", e.target.value)} className={field} aria-label="Sampai tanggal" />
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        {rows.length} buah, {judged ? Math.round((normal / judged) * 100) : 0}% normal menurut model, {unlabeled} belum dilabel.
      </p>

      {!synced && !scans.length ? (
        <SkeletonRows rows={8} />
      ) : rows.length === 0 ? (
        <EmptyState title="Tidak ada buah yang cocok">Ubah kata kunci atau rentang tanggal.</EmptyState>
      ) : (
        <>
          {/* Desktop: tabel */}
          <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Waktu</th>
                  <th className="px-4 py-3 font-semibold">ID buah</th>
                  <th className="px-4 py-3 font-semibold">Putusan model</th>
                  <th className="px-4 py-3 font-semibold text-right">Keyakinan</th>
                  <th className="px-4 py-3 font-semibold">Label hasil belah</th>
                  <th className="px-2 py-3"><span className="sr-only">Detail</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((s) => (
                  <Fragment key={s.id}>
                    <tr
                      onClick={() => setOpenId(openId === s.id ? null : s.id)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpenId(openId === s.id ? null : s.id))}
                      tabIndex={0}
                      aria-expanded={openId === s.id}
                      className="border-t border-border hover:bg-accent/50 cursor-pointer"
                    >
                      <td className="px-4 py-3 tabular whitespace-nowrap">{format(new Date(s.timestamp), "d MMM, HH:mm:ss")}</td>
                      <td className="px-4 py-3 font-semibold">{s.fruitId}</td>
                      <td className="px-4 py-3"><VerdictChip verdict={s.result} size="sm" /></td>
                      <td className="px-4 py-3 text-right tabular">{conf(s)}</td>
                      <td className="px-4 py-3">{labelControl(s)}</td>
                      <td className="px-2 py-3">
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openId === s.id ? "rotate-180" : ""}`} aria-hidden="true" />
                      </td>
                    </tr>
                    {openId === s.id && (
                      <tr className="bg-secondary/50">
                        <td colSpan={6} className="px-4 pb-4"><SpectralMiniChart spectral={s.spectral} result={s.result} /></td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* HP: kartu */}
          <ul className="md:hidden space-y-2">
            {rows.slice(0, 100).map((s) => (
              <li key={s.id} className="rounded-2xl border border-border bg-card p-4">
                <button className="w-full text-left" onClick={() => setOpenId(openId === s.id ? null : s.id)} aria-expanded={openId === s.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold">{s.fruitId}</span>
                    <VerdictChip verdict={s.result} size="sm" />
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground tabular">
                    {format(new Date(s.timestamp), "d MMM yyyy, HH:mm:ss")}, keyakinan {conf(s)}
                  </div>
                </button>
                <div className="mt-3">{labelControl(s)}</div>
                {openId === s.id && <SpectralMiniChart spectral={s.spectral} result={s.result} />}
              </li>
            ))}
          </ul>
          {rows.length > 200 && <p className="mt-3 text-sm text-muted-foreground">Menampilkan 200 buah terbaru. Persempit rentang tanggal untuk melihat yang lain.</p>}
        </>
      )}
    </PageLayout>
  );
}
