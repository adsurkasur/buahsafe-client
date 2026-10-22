import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { PageLayout } from "@/components/buahsafe/Layout";
import { ResultBadge } from "@/components/buahsafe/StatusBadge";
import { SpectralMiniChart } from "@/components/buahsafe/SpectralMiniChart";
import {
  getScans,
  syncDevices,
  syncScans,
  triggerScan,
  getDevices,
  DEVICE_COLORS,
  ScanRecord,
} from "@/lib/buahsafe-data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/scan")({ component: ScanPage });

function ScanPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [scanning, setScanning] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [fruitId, setFruitId] = useState<string>("");
  const [latestScan, setLatestScan] = useState<ScanRecord | null>(null);
  const [scanError, setScanError] = useState<string>("");
  const [devices, setDevices] = useState(getDevices().filter((d) => d.status !== "offline"));
  const fruitInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setScans(getScans());
    syncDevices().then((all) => {
      const active = all.filter((d) => d.status !== "offline");
      setDevices(active);
      if (active[0]) setDeviceId((cur) => cur || active[0].id);
    });
    syncScans().then(setScans);
  }, []);

  const today0 = new Date().setHours(0, 0, 0, 0);
  const myScans = scans
    .filter((s) => s.operatorId === user?.id && new Date(s.timestamp).getTime() >= today0)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Pemindai barcode mengetik lalu menekan Enter: isi kolom harus tersorot penuh
  // supaya kode berikutnya menimpa, bukan menyambung ke ID sebelumnya.
  const focusFruitInput = () => {
    fruitInput.current?.focus();
    fruitInput.current?.select();
  };

  const handleTrigger = async () => {
    if (!deviceId || !user) return;
    if (!fruitId.trim()) {
      setScanError("Isi ID buah atau pindai barcode-nya terlebih dahulu.");
      focusFruitInput();
      return;
    }
    setScanning(true);
    setScanError("");
    try {
      const s = await triggerScan({
        operatorId: user.id,
        deviceId,
        fruitId,
      });
      setLatestScan(s);
      setScans(getScans());
      // Siapkan ID buah berikutnya
      // Usulan ID berikutnya: naikkan angka di ujung, awalan tetap (JB-TEST-001 -> JB-TEST-002)
      setFruitId(s.fruitId.replace(/(\d+)$/, (n) => String(Number(n) + 1).padStart(n.length, "0")));

      if (s.result === "NORMAL") {
        toast.success(`Buah ${s.fruitId}: NORMAL`, {
          description: `Keyakinan model ${s.confidence}% · Lolos pemeriksaan`,
        });
      } else {
        toast.error(`Buah ${s.fruitId}: ANOMALI`, {
          description: `Keyakinan model ${s.confidence}% · Terindikasi busuk/larva internal`,
        });
      }
    } catch (err: any) {
      // Tidak ada hasil = tidak ada arahan keranjang. Jangan tampilkan hasil lama.
      setLatestScan(null);
      setScanError(err?.message || "Pemindaian gagal");
    } finally {
      setScanning(false);
      setTimeout(focusFruitInput, 0);
    }
  };

  return (
    <PageLayout
      title="Pemindaian Sortasi"
      subtitle="Pindai spektrum optik Visible-NIR buah untuk deteksi kualitas internal"
      roles={["operator"]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Kolom Kiri: Form Kontrol Pemindaian */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border border-border bg-card shadow-sm p-6">
            <h3 className="font-semibold text-base">Pindai Buah Baru</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Letakkan jambu kristal di atas sensor AS7265x (jarak 3 cm)
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTrigger();
              }}
              className="mt-5 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-medium text-muted-foreground">ID Buah / Barcode</label>
                <input
                  ref={fruitInput}
                  type="text"
                  value={fruitId}
                  onChange={(e) => setFruitId(e.target.value.toUpperCase())}
                  onFocus={(e) => e.target.select()}
                  placeholder="Pindai barcode atau ketik, cth. JB-0012, lalu Enter"
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground">Meja / Perangkat Pemindai</label>
                <select
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id} — {d.name} ({d.location})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={scanning || !deviceId}
                title={!deviceId ? "Belum ada perangkat pemindai aktif yang terdaftar di server" : undefined}
                className="mt-4 w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-sm hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanLine className="w-5 h-5" />}
                {scanning ? "Memindai Spektrum Sensor…" : "Mulai Pemindaian Buah (Enter)"}
              </button>
            </form>

            <div className="mt-6 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg border border-border p-3">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Pindaian Saya Hari Ini</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">{myScans.length}</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Anomali Terdeteksi</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums text-rose-600">
                  {myScans.filter((s) => s.result === "ANOMALI").length}
                </div>
              </div>
            </div>
          </div>

          {scanError && (
            <div role="alert" className="rounded-xl border border-amber-400 bg-amber-50 p-5 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
              <div className="flex items-center gap-2 text-lg font-bold">
                <XCircle className="w-6 h-6 text-amber-600" /> Pemindaian Gagal
              </div>
              <div className="mt-2 px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs font-semibold">
                👉 ARAHAN: Tahan buah di meja. Jangan masukkan ke keranjang mana pun sebelum hasil keluar.
              </div>
              <p className="mt-2 text-xs opacity-85">{scanError}</p>
            </div>
          )}

          {/* Banner Hasil Terakhir Layar Penuh (Feedback Meja Sortasi) */}
          {latestScan && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-xl border p-5 ${
                latestScan.result === "NORMAL"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider opacity-70">
                    Hasil Pindaian Terakhir ({latestScan.fruitId})
                  </span>
                  <div className="text-2xl font-bold tracking-tight mt-0.5 flex items-center gap-2">
                    {latestScan.result === "NORMAL" ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        <span>NORMAL (Lolos)</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                        <span>ANOMALI (Busuk/Larva)</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-75">Tingkat Keyakinan</div>
                  <div className="text-xl font-mono font-bold">{latestScan.confidence}%</div>
                </div>
              </div>

              {/* Arahan Fisik Nyata untuk Pekerja Gudang */}
              {latestScan.result === "NORMAL" ? (
                <div className="mt-3 px-3 py-2 rounded-lg bg-emerald-600/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <span>👉 ARAHAN: Masukkan ke Keranjang HIJAU (Lolos Mutu / Siap Kemas Grade A)</span>
                </div>
              ) : (
                <div className="mt-3 px-3 py-2 rounded-lg bg-rose-600/15 border border-rose-500/30 text-rose-900 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                  <span>👉 ARAHAN: Pisahkan ke Keranjang MERAH (Afkir / Daging Buah Rusak)</span>
                </div>
              )}

              <p className="mt-2.5 text-xs opacity-85">
                {latestScan.result === "NORMAL"
                  ? "Pola reflektansi spektral NIR sesuai profil buah normal pada model klasifikasi."
                  : "Reflektansi spektral NIR menyimpang dari profil buah normal (indikasi busuk atau hama di dalam daging buah)."}
              </p>

              <SpectralMiniChart spectral={latestScan.spectral} result={latestScan.result} />
            </motion.div>
          )}
        </div>

        {/* Kolom Kanan: Riwayat Pindaian Operator */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Riwayat Pemindaian Hari Ini</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Daftar buah yang Anda pindai hari ini</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{myScans.length} data</span>
          </div>

          <div className="divide-y divide-border flex-1 max-h-[580px] overflow-y-auto">
            <AnimatePresence initial={false}>
              {myScans.length === 0 && (
                <div className="px-5 py-16 text-center text-sm text-muted-foreground">
                  Belum ada pindaian hari ini. Pindai barcode buah atau tekan "Mulai Pemindaian Buah".
                </div>
              )}
              {myScans.map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-5 py-3.5 flex items-center gap-4 hover:bg-accent/40 transition-colors"
                >
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${DEVICE_COLORS[s.deviceId] || "bg-muted text-muted-foreground"}`}>
                    {s.deviceId}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold font-mono tracking-tight">{s.fruitId || s.batchId}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {format(new Date(s.timestamp), "d MMM yyyy, HH:mm:ss")}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums w-14 text-right font-mono">
                    {s.confidence}%
                  </div>
                  <ResultBadge result={s.result} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
