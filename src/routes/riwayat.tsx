import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Fragment, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Download,
  Search,
  ChevronDown,
  Database,
  Calendar,
  RotateCcw,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/buahsafe/Layout";
import {
  ConfidenceBadge,
  EmptyState,
  SkeletonRows,
  Tip,
  VerdictChip,
} from "@/components/buahsafe/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SpectralMiniChart } from "@/components/buahsafe/SpectralMiniChart";
import {
  downloadTrainingCsv,
  getScans,
  syncScans,
  setScanLabel,
  ScanRecord,
  WAVELENGTHS,
} from "@/lib/buahsafe-data";
import { useAuth } from "@/lib/auth";

const searchSchema = z.object({
  result: fallback(z.enum(["all", "NORMAL", "ANOMALI", "GAGAL"]), "all").default("all"),
  label: fallback(z.enum(["all", "labeled", "unlabeled"]), "all").default("all"),
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

function getSeqNumber(fruitId: string): string | null {
  const m = fruitId.match(/-(\d{1,6})$/);
  if (!m) return null;
  return String(Number(m[1]));
}

function RiwayatPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/riwayat" });
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>(getScans());
  const [openId, setOpenId] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState<boolean>(() => Boolean(search.from || search.to));

  // State untuk Dialog Sampling Belah Cepat (#NNNN)
  const [samplingOpen, setSamplingOpen] = useState(false);
  const [seqQuery, setSeqQuery] = useState("");
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [savingLabel, setSavingLabel] = useState(false);

  const canLabel = user?.role === "supervisor" || user?.role === "owner";

  useEffect(() => {
    syncScans().then((s) => {
      setScans(s);
      setSynced(true);
    });
  }, []);

  const set = (key: keyof typeof search, value: string) =>
    navigate({ search: (prev: any) => ({ ...prev, [key]: value }) as any, replace: true });

  const hasActiveFilter =
    Boolean(search.q.trim()) ||
    search.result !== "all" ||
    search.label !== "all" ||
    Boolean(search.from) ||
    Boolean(search.to);

  const resetFilters = () => {
    setShowDateFilter(false);
    navigate({
      search: { result: "all", label: "all", q: "", from: "", to: "" },
      replace: true,
    });
  };

  const sortedScans = useMemo(
    () => [...scans].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [scans],
  );

  const rows = useMemo(() => {
    const rawQ = search.q.trim().toLowerCase();
    const cleanNoHash = rawQ.replace(/^#/, "");
    const queryNum = /^\d+$/.test(cleanNoHash) ? String(Number(cleanNoHash)) : null;

    return sortedScans
      .filter((s) => search.result === "all" || s.result === search.result)
      .filter((s) =>
        search.label === "all"
          ? true
          : search.label === "labeled"
            ? Boolean(s.label)
            : !s.label,
      )
      .filter((s) => {
        if (!rawQ) return true;
        const seq = getSeqNumber(s.fruitId);
        return (
          s.fruitId.toLowerCase().includes(cleanNoHash) ||
          (s.batchId && s.batchId.toLowerCase().includes(rawQ)) ||
          (seq !== null && (seq === queryNum || `#${seq}` === rawQ))
        );
      })
      .filter((s) => !search.from || s.timestamp >= search.from)
      .filter((s) => !search.to || s.timestamp <= `${search.to}T23:59:59`);
  }, [sortedScans, search]);

  // Daftar 20 buah terakhir (atau hasil pencarian nomor urut #NNNN) pada Dialog Sampling QC
  const samplingCandidates = useMemo(() => {
    const raw = seqQuery.trim().toLowerCase();
    if (!raw) return sortedScans.slice(0, 20);
    const clean = raw.replace(/^#/, "");
    const targetNum = /^\d+$/.test(clean) ? String(Number(clean)) : null;

    const matches = sortedScans.filter((s) => {
      const seq = getSeqNumber(s.fruitId);
      if (targetNum !== null && seq === targetNum) return true;
      if (s.fruitId.toLowerCase().includes(clean)) return true;
      if (s.batchId && s.batchId.toLowerCase().includes(raw)) return true;
      return false;
    });

    return matches
      .sort((a, b) => {
        const aExact = targetNum !== null && getSeqNumber(a.fruitId) === targetNum ? 1 : 0;
        const bExact = targetNum !== null && getSeqNumber(b.fruitId) === targetNum ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
        return b.timestamp.localeCompare(a.timestamp);
      })
      .slice(0, 20);
  }, [sortedScans, seqQuery]);

  const selectedScan = useMemo(() => {
    if (selectedScanId) {
      const found = scans.find((s) => s.id === selectedScanId);
      if (found) return found;
    }
    return samplingCandidates[0] ?? null;
  }, [scans, selectedScanId, samplingCandidates]);

  const openSamplingDialog = () => {
    setSeqQuery("");
    setSelectedScanId(sortedScans[0]?.id ?? null);
    setSamplingOpen(true);
  };

  const unlabeled = rows.filter((s) => !s.label).length;
  const normal = rows.filter((s) => s.result === "NORMAL").length;
  const judged = rows.filter((s) => s.result !== "GAGAL").length;

  const downloadTraining = async () => {
    const err = await downloadTrainingCsv();
    if (err) toast.error("Data latih belum terunduh", { description: err });
    else
      toast.success("Data latih terunduh", {
        description: "Kirim berkas ini ke tim BuahSafe untuk pelatihan ulang model.",
      });
  };

  const saveLabel = async (id: string, label: Label) => {
    const target = scans.find((x) => x.id === id);
    setSavingLabel(true);
    const res = await setScanLabel(id, label);
    setSavingLabel(false);
    if (!res.ok) {
      toast.error("Label belum tersimpan", { description: res.error });
      return;
    }
    setScans((all) => all.map((x) => (x.id === id ? { ...x, label } : x)));
    toast.success(`Label ${target?.fruitId ?? id}: ${label || "dikosongkan"}`);
  };

  const downloadCSV = () => {
    const header = [
      "Waktu",
      "ID_Buah",
      "Kode_Batch",
      "Putusan_Model",
      "Keyakinan_Persen",
      ...WAVELENGTHS.map((w) => `I${w}`),
      "Label_Hasil_Belah",
    ];
    const lines = rows.map((s) =>
      [
        s.timestamp,
        s.fruitId,
        s.batchId || "",
        s.result,
        s.confidence,
        ...WAVELENGTHS.map((w) => s.spectral?.[`nm${w}`] ?? ""),
        s.label || "",
      ].join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
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
        onChange={(e) => saveLabel(s.id, e.target.value as Label)}
        onClick={(e) => e.stopPropagation()}
        className="h-10 px-2.5 rounded-lg border border-input bg-background text-sm font-medium"
        aria-label={`Label hasil belah ${s.fruitId}`}
      >
        <option value="">Belum dibelah</option>
        <option value="normal">Normal</option>
        <option value="anomali">Anomali</option>
      </select>
    ) : (
      <span className="text-sm text-muted-foreground">{s.label || "Belum dibelah"}</span>
    );

  const dateFilterVisible = showDateFilter || Boolean(search.from) || Boolean(search.to);

  return (
    <PageLayout
      title="Riwayat & label"
      subtitle="Telusuri hasil sortasi dan catat hasil belah buah sampel untuk melatih ulang model."
      roles={["supervisor", "owner"]}
      actions={
        <>
          {canLabel && (
            <Tip label="Cari buah berdasarkan nomor urut LCD #NNNN lalu catat hasil belah dengan cepat">
              <button
                type="button"
                onClick={openSamplingDialog}
                data-testid="quick-sampling-btn"
                className="h-11 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-95 text-sm font-semibold inline-flex items-center gap-2"
              >
                <Scissors className="w-4 h-4" /> Catat hasil belah (Sampling QC)
              </button>
            </Tip>
          )}
          {canLabel && (
            <Tip label="Semua buah berlabel hasil belah beserta 18 kanal spektrum, format yang dipakai tim untuk melatih ulang model">
              <button
                type="button"
                onClick={downloadTraining}
                className="h-11 px-4 rounded-xl border border-border bg-card hover:bg-accent text-sm font-semibold inline-flex items-center gap-2"
              >
                <Database className="w-4 h-4" /> Unduh data latih (CSV)
              </button>
            </Tip>
          )}
          <Tip label="Daftar buah sesuai filter di bawah, untuk laporan harian">
            <button
              type="button"
              onClick={downloadCSV}
              disabled={!rows.length}
              className="h-11 px-4 rounded-xl border border-border bg-card hover:bg-accent text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Unduh laporan (CSV)
            </button>
          </Tip>
        </>
      }
    >
      {/* Dialog Sampling Belah Cepat (#NNNN) */}
      <Dialog open={samplingOpen} onOpenChange={setSamplingOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Catat hasil belah (Sampling QC)</DialogTitle>
            <DialogDescription>
              Ketik nomor urut buah pada LCD alat (<span className="font-mono font-semibold">#NNNN</span>, mis.{" "}
              <span className="font-mono">18</span>) atau pilih dari 20 buah terakhir, lalu catat kondisi dalam buah
              setelah dibelah.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-1">
            <div>
              <label htmlFor="sampling-seq-input" className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Cari Nomor Urut LCD (#NNNN) atau ID Buah
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="sampling-seq-input"
                  type="text"
                  value={seqQuery}
                  onChange={(e) => {
                    setSeqQuery(e.target.value);
                    setSelectedScanId(null);
                  }}
                  placeholder="Ketik nomor #urut (mis. 18) atau kode CV-…"
                  className={`${field} w-full pl-9 font-mono`}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1.5">
                {seqQuery.trim()
                  ? `Hasil pencarian (${samplingCandidates.length} buah)`
                  : "20 buah terakhir hari ini (klik untuk memilih)"}
              </div>
              {samplingCandidates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground text-center">
                  Tidak ada buah yang cocok dengan &ldquo;{seqQuery}&rdquo;.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 rounded-xl border border-border bg-secondary/40">
                  {samplingCandidates.map((item) => {
                    const seq = getSeqNumber(item.fruitId);
                    const isSelected = selectedScan?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedScanId(item.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card hover:bg-accent border-border text-foreground"
                        }`}
                      >
                        <span className="font-mono font-bold">{seq ? `#${seq}` : item.fruitId}</span>
                        {item.label && (
                          <span className="text-[10px] px-1 rounded bg-background/20 uppercase">{item.label}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedScan ? (
              <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      {getSeqNumber(selectedScan.fruitId) && (
                        <span className="text-2xl font-extrabold font-mono tabular">
                          #{getSeqNumber(selectedScan.fruitId)}
                        </span>
                      )}
                      <span className="font-mono text-sm font-semibold text-muted-foreground">
                        {selectedScan.fruitId}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 tabular">
                      {format(new Date(selectedScan.timestamp), "d MMM yyyy, HH:mm:ss")}
                      {selectedScan.batchId && (
                        <span className="ml-2 font-mono text-[11px]">• {selectedScan.batchId}</span>
                      )}
                    </div>
                  </div>
                  <VerdictChip verdict={selectedScan.result} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/70 text-xs">
                  <span className="text-muted-foreground font-medium">Keyakinan model:</span>
                  <ConfidenceBadge confidence={selectedScan.confidence} result={selectedScan.result} />
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground font-medium">Label hasil belah saat ini:</span>
                  <span className="font-semibold">
                    {selectedScan.label === "normal"
                      ? "Normal (Bagus)"
                      : selectedScan.label === "anomali"
                        ? "Anomali (Busuk / Larva)"
                        : "Belum dibelah"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={savingLabel}
                    onClick={() => saveLabel(selectedScan.id, "normal")}
                    className={`h-12 px-4 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 border transition-all disabled:opacity-50 ${
                      selectedScan.label === "normal"
                        ? "bg-pass text-pass-ink border-pass ring-2 ring-pass/40"
                        : "bg-pass/15 hover:bg-pass/25 text-foreground border-pass/40"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Belah: Bagus (Normal)
                  </button>
                  <button
                    type="button"
                    disabled={savingLabel}
                    onClick={() => saveLabel(selectedScan.id, "anomali")}
                    className={`h-12 px-4 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 border transition-all disabled:opacity-50 ${
                      selectedScan.label === "anomali"
                        ? "bg-reject text-reject-ink border-reject ring-2 ring-reject/40"
                        : "bg-reject/15 hover:bg-reject/25 text-foreground border-reject/40"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Belah: Busuk / Larva (Anomali)
                  </button>
                </div>

                {selectedScan.label && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={savingLabel}
                      onClick={() => saveLabel(selectedScan.id, "")}
                      className="text-xs text-muted-foreground hover:text-foreground underline disabled:opacity-50"
                    >
                      Kosongkan label
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Baris Filter Utama yang Dirampingkan */}
      <div className="space-y-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex-1 min-w-[240px]">
            <span className="sr-only">Cari ID buah, nomor #urut, atau kode batch</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search.q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Cari ID buah, nomor #urut, atau kode batch…"
              className={`${field} w-full pl-9`}
            />
          </label>

          <select
            value={search.result}
            onChange={(e) => set("result", e.target.value)}
            className={field}
            aria-label="Putusan model"
          >
            <option value="all">Semua putusan</option>
            <option value="NORMAL">Normal</option>
            <option value="ANOMALI">Anomali</option>
            <option value="GAGAL">Gagal</option>
          </select>

          <select
            value={search.label}
            onChange={(e) => set("label", e.target.value)}
            className={field}
            aria-label="Status label"
          >
            <option value="all">Semua status label</option>
            <option value="labeled">Sudah dilabeli</option>
            <option value="unlabeled">Belum dilabeli</option>
          </select>

          <button
            type="button"
            onClick={() => setShowDateFilter((v) => !v)}
            aria-expanded={dateFilterVisible}
            className={`${field} inline-flex items-center gap-2 font-medium ${
              dateFilterVisible ? "border-primary bg-primary/10 text-foreground" : "hover:bg-accent"
            }`}
          >
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Filter tanggal</span>
            {(search.from || search.to) && (
              <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
            )}
          </button>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className={`${field} inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent font-medium`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset filter</span>
            </button>
          )}
        </div>

        {dateFilterVisible && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span>Dari tanggal</span>
              <input
                type="date"
                value={search.from}
                onChange={(e) => set("from", e.target.value)}
                className={field}
                aria-label="Dari tanggal"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span>Sampai tanggal</span>
              <input
                type="date"
                value={search.to}
                onChange={(e) => set("to", e.target.value)}
                className={field}
                aria-label="Sampai tanggal"
              />
            </label>
          </div>
        )}
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        {rows.length} buah, {judged ? Math.round((normal / judged) * 100) : 0}% normal menurut model, {unlabeled} belum
        dilabeli.
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
                  <th className="px-4 py-3 font-semibold">Keyakinan</th>
                  <th className="px-4 py-3 font-semibold">Label hasil belah</th>
                  <th className="px-4 py-3 font-semibold text-right">Kurva NIR</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((s) => {
                  const seq = getSeqNumber(s.fruitId);
                  const isOpen = openId === s.id;
                  return (
                    <Fragment key={s.id}>
                      <tr
                        onClick={() => setOpenId(isOpen ? null : s.id)}
                        onKeyDown={(e) =>
                          (e.key === "Enter" || e.key === " ") &&
                          (e.preventDefault(), setOpenId(isOpen ? null : s.id))
                        }
                        tabIndex={0}
                        aria-expanded={isOpen}
                        className="border-t border-border hover:bg-accent/50 cursor-pointer"
                      >
                        <td className="px-4 py-3 tabular whitespace-nowrap">
                          {format(new Date(s.timestamp), "d MMM, HH:mm:ss")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {seq && (
                              <span className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 font-mono text-xs font-bold">
                                #{seq}
                              </span>
                            )}
                            <span className="font-semibold font-mono">{s.fruitId}</span>
                          </div>
                          {s.batchId && (
                            <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{s.batchId}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <VerdictChip verdict={s.result} size="sm" />
                        </td>
                        <td className="px-4 py-3">
                          <ConfidenceBadge confidence={s.confidence} result={s.result} />
                        </td>
                        <td className="px-4 py-3">{labelControl(s)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenId(isOpen ? null : s.id);
                            }}
                            aria-expanded={isOpen}
                            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-accent text-xs font-semibold text-muted-foreground hover:text-foreground"
                          >
                            <Activity className="w-3.5 h-3.5 text-primary" />
                            <span>Spektrum</span>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                              aria-hidden="true"
                            />
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-secondary/50">
                          <td colSpan={6} className="px-4 pb-4">
                            <SpectralMiniChart spectral={s.spectral} result={s.result} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* HP: kartu */}
          <ul className="md:hidden space-y-2">
            {rows.slice(0, 100).map((s) => {
              const seq = getSeqNumber(s.fruitId);
              const isOpen = openId === s.id;
              return (
                <li key={s.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {seq && (
                          <span className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 font-mono text-xs font-bold">
                            #{seq}
                          </span>
                        )}
                        <span className="font-bold font-mono">{s.fruitId}</span>
                      </div>
                      {s.batchId && (
                        <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{s.batchId}</div>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground tabular">
                        {format(new Date(s.timestamp), "d MMM yyyy, HH:mm:ss")}
                      </div>
                    </div>
                    <VerdictChip verdict={s.result} size="sm" />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <ConfidenceBadge confidence={s.confidence} result={s.result} />
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : s.id)}
                      aria-expanded={isOpen}
                      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-accent text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      <Activity className="w-3.5 h-3.5 text-primary" />
                      <span>Spektrum</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  <div className="mt-3">{labelControl(s)}</div>
                  {isOpen && <SpectralMiniChart spectral={s.spectral} result={s.result} />}
                </li>
              );
            })}
          </ul>
          {rows.length > 200 && (
            <p className="mt-3 text-sm text-muted-foreground">
              Menampilkan 200 buah terbaru. Persempit rentang tanggal untuk melihat yang lain.
            </p>
          )}
        </>
      )}
    </PageLayout>
  );
}

