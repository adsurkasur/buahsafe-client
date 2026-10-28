import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  LogOut,
  LayoutDashboard,
  PlayCircle,
  SlidersHorizontal,
  Sprout,
  Sun,
  Moon,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AuthGate, OfflineBanner, useServerDown } from "@/components/buahsafe/Layout";
import {
  BrandMark,
  DeviceStatus,
  SkeletonRows,
  Tip,
  VERDICT_CLASS,
  VERDICT_TEXT,
  Verdict,
  getConfidenceTier,
} from "@/components/buahsafe/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ActiveBatchInfo,
  DeviceStatusInfo,
  PetaniMitra,
  QueueItem,
  fetchActiveBatch,
  fetchDeviceStatus,
  fetchQueue,
  requestSimulation,
  updateActiveBatch,
} from "@/lib/buahsafe-data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/antrean")({ component: AntreanPage });

// Buah lewat conveyor setiap beberapa detik: layar harus sesegar bunyi alat
const QUEUE_POLL_MS = 1000;
const STATUS_POLL_MS = 5000;
const BATCH_POLL_MS = 15000;
const SOUND_KEY = "buahsafe.antrean.suara";
const THEME_KEY = "buahsafe.theme";
const btn =
  "h-11 px-3 rounded-xl border border-border bg-card hover:bg-accent text-sm font-semibold inline-flex items-center justify-center gap-2";

/** Layar penuh yang bisa dimasuki dan ditinggalkan dari tombol yang sama. */
function useFullscreen() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggle = () => {
    const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
    p?.catch(() => {});
  };
  return { on, toggle };
}

/** Saklar mode terang/gelap untuk menu utilitas kiosk. */
function useThemeMode() {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {}
  };
  return { dark, toggle };
}

/** Bunyi + getar untuk hasil yang perlu tindakan (MERAH/sisihkan). Bawaan mati: alat sudah berbunyi. */
function useAlert() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(SOUND_KEY) === "1";
    } catch {
      return false;
    }
  });
  const ctx = useRef<AudioContext | null>(null);

  const toggle = () => {
    const next = !enabled;
    // Peramban hanya mengizinkan audio setelah ketukan pengguna: buat AudioContext di sini
    if (next && !ctx.current) ctx.current = new AudioContext();
    setEnabled(next);
    try {
      localStorage.setItem(SOUND_KEY, next ? "1" : "0");
    } catch {}
  };

  const play = (verdict: Verdict) => {
    if (!enabled || verdict === "NORMAL") return;
    navigator.vibrate?.(verdict === "ANOMALI" ? [400, 150, 400, 150, 400] : [120, 80, 120]);
    const audio = ctx.current ?? (ctx.current = new AudioContext());
    const tones = verdict === "ANOMALI" ? [0, 0.45, 0.9] : [0, 0.2];
    for (const start of tones) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.frequency.value = verdict === "ANOMALI" ? 620 : 900;
      gain.gain.setValueAtTime(0.25, audio.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + start + (verdict === "ANOMALI" ? 0.35 : 0.12));
      osc.connect(gain).connect(audio.destination);
      osc.start(audio.currentTime + start);
      osc.stop(audio.currentTime + start + 0.4);
    }
  };
  return { enabled, toggle, play };
}

function AntreanPage() {
  return (
    <AuthGate roles={["operator", "supervisor", "owner"]}>
      <Kiosk />
    </AuthGate>
  );
}

function Kiosk() {
  const { user, logout } = useAuth();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [device, setDevice] = useState<DeviceStatusInfo | null>(null);
  const [activeBatch, setActiveBatch] = useState<ActiveBatchInfo | null>(null);
  const [petaniList, setPetaniList] = useState<PetaniMitra[]>([]);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [selectedPetaniId, setSelectedPetaniId] = useState("");
  const [customBatchCode, setCustomBatchCode] = useState("");
  const [savingBatch, setSavingBatch] = useState(false);

  const serverDown = useServerDown();
  const alert = useAlert();
  const fs = useFullscreen();
  const theme = useThemeMode();
  const lastId = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    const loadQueue = () =>
      fetchQueue(12).then((q) => {
        if (!alive || !q) return;
        setQueue(q);
        setLoaded(true);
      });
    const loadStatus = () => fetchDeviceStatus().then((d) => alive && setDevice(d));
    const loadBatch = () =>
      fetchActiveBatch().then((res) => {
        if (!alive || !res) return;
        setActiveBatch(res.batch);
        setPetaniList(res.petani);
      });
    loadQueue();
    loadStatus();
    loadBatch();
    const q = setInterval(loadQueue, QUEUE_POLL_MS);
    const s = setInterval(loadStatus, STATUS_POLL_MS);
    const b = setInterval(loadBatch, BATCH_POLL_MS);
    return () => {
      alive = false;
      clearInterval(q);
      clearInterval(s);
      clearInterval(b);
    };
  }, []);

  const latest = queue[0];
  useEffect(() => {
    if (!latest) return;
    // Jangan berbunyi untuk buah yang sudah ada saat halaman dibuka
    if (lastId.current !== null && latest.id !== lastId.current) alert.play(latest.verdict);
    lastId.current = latest.id;
  }, [latest?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSim = !!device?.firmware?.startsWith("sim");
  const canManage = user?.role !== "operator";

  const simulate = async () => {
    const res = await requestSimulation(10);
    if (res.ok) toast.success("Simulasi dimulai", { description: "10 buah lewat dalam sekitar satu menit." });
    else toast.error("Simulasi belum bisa dimulai", { description: res.error });
  };

  const openBatchDialog = () => {
    setSelectedPetaniId(activeBatch?.petani_id ?? "");
    setCustomBatchCode(activeBatch?.batch_id ?? "");
    setBatchDialogOpen(true);
  };

  const handleSaveBatch = async (e: FormEvent) => {
    e.preventDefault();
    setSavingBatch(true);
    const res = await updateActiveBatch(selectedPetaniId, customBatchCode.trim());
    setSavingBatch(false);
    if (res.ok && res.data?.batch) {
      setActiveBatch(res.data.batch);
      setBatchDialogOpen(false);
      toast.success("Batch sortasi aktif diperbarui", {
        description: `${res.data.batch.petani_name || "Umum (Tanpa Petani)"} • ${res.data.batch.batch_id}`,
      });
    } else {
      toast.error("Gagal memperbarui batch aktif", { description: res.error });
    }
  };

  const batchLabel = activeBatch?.petani_name
    ? `Batch: ${activeBatch.petani_name} • ${activeBatch.batch_id}`
    : `Batch: Umum • ${activeBatch?.batch_id || "Pilih Petani"}`;

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 border-b border-border bg-card">
        <BrandMark className="w-9 h-9" />
        <div className="mr-auto">
          <h1 className="text-lg font-extrabold leading-none">Antrean Sortasi</h1>
          <div className="text-xs text-muted-foreground mt-1">Urutan layar sama dengan urutan buah di belt</div>
        </div>

        <Tip label="Pilih petani mitra atau kode batch yang sedang disortir di meja conveyor">
          <button
            type="button"
            onClick={openBatchDialog}
            data-testid="active-batch-btn"
            className="h-10 px-3.5 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/15 text-foreground text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
          >
            <Sprout className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate max-w-[240px] sm:max-w-[320px]">{batchLabel}</span>
          </button>
        </Tip>

        <DeviceStatus connected={device?.connected} simulator={isSim} enabled={device?.enabled !== false} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={btn} aria-label="Menu & tampilan">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Menu & tampilan</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={alert.toggle}>
              {alert.enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{alert.enabled ? "Suara aktif" : "Suara nonaktif"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={theme.toggle}>
              {theme.dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{theme.dark ? "Mode terang" : "Mode gelap"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={fs.toggle}>
              {fs.on ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              <span>{fs.on ? "Keluar layar penuh" : "Layar penuh"}</span>
            </DropdownMenuItem>

            {canManage && device?.mode === "conveyor" && device.connected && isSim && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={simulate}>
                  <PlayCircle className="w-4 h-4" />
                  <span>Simulasi 10 buah</span>
                </DropdownMenuItem>
              </>
            )}

            {canManage && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Buka Ringkasan</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atur Batch & Petani Mitra Aktif</DialogTitle>
            <DialogDescription>
              Pilih petani mitra pemasok jambu kristal untuk sesi sortasi saat ini. Setiap buah yang lewat di conveyor
              otomatis tercatat pada batch ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveBatch} className="space-y-4 mt-2">
            <div>
              <label htmlFor="select-petani" className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Petani Mitra Pemasok
              </label>
              <select
                id="select-petani"
                value={selectedPetaniId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setSelectedPetaniId(nextId);
                  const suffix = nextId ? `-${nextId.toUpperCase()}` : "";
                  setCustomBatchCode(`BATCH-${format(new Date(), "yyyyMMdd")}${suffix}`);
                }}
                className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm font-medium"
              >
                <option value="">Umum — Tanpa Petani Mitra</option>
                {petaniList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.village})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="input-batch-code" className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Kode Batch Sortasi
              </label>
              <input
                id="input-batch-code"
                type="text"
                value={customBatchCode}
                onChange={(e) => setCustomBatchCode(e.target.value)}
                placeholder={`BATCH-${format(new Date(), "yyyyMMdd")}${selectedPetaniId ? `-${selectedPetaniId.toUpperCase()}` : ""}`}
                className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm font-mono"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Kosongkan bila ingin kode batch dibuat otomatis oleh server.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBatchDialogOpen(false)}
                className="h-10 px-4 rounded-xl border border-border hover:bg-accent text-sm font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingBatch}
                className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {savingBatch ? "Menyimpan…" : "Simpan Batch"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {serverDown && (
        <div className="px-4 sm:px-6 pt-4">
          <OfflineBanner />
        </div>
      )}

      <main className="flex-1 grid gap-4 p-4 sm:p-6 md:grid-cols-2 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] min-h-0">
        {!loaded ? (
          <Skeleton className="rounded-[28px] min-h-[52dvh] md:min-h-0" />
        ) : latest ? (
          <section
            key={latest.id}
            data-testid="latest-fruit"
            aria-live="assertive"
            className={`krat-masuk rounded-[28px] p-6 sm:p-10 flex flex-col justify-between min-h-[52dvh] md:min-h-0 ${VERDICT_CLASS[latest.verdict]}`}
          >
            <div className="flex items-center justify-between gap-3 text-base sm:text-lg font-semibold opacity-90">
              <span>Buah terbaru</span>
              <span className="tabular">{format(new Date(latest.timestamp), "HH:mm:ss")}</span>
            </div>
            <div>
              <div className="font-extrabold tabular leading-[0.85] tracking-tight text-[clamp(96px,18vw,240px)]">
                #{latest.seq}
              </div>
              <div className="mt-4 font-extrabold tracking-tight text-[clamp(36px,6vw,72px)] leading-none">
                {VERDICT_TEXT[latest.verdict].label}
              </div>
              <div className="mt-2 text-[clamp(18px,2.4vw,26px)] font-bold opacity-95">
                {VERDICT_TEXT[latest.verdict].action}
              </div>
            </div>
            <div className="space-y-1.5 text-base sm:text-lg font-medium opacity-95">
              {latest.verdict === "GAGAL" ? (
                <p>Sensor atau model tidak dapat menilai buah ini. Periksa secara manual.</p>
              ) : (
                <p className="mt-2 text-sm sm:text-base">
                  Keyakinan model{" "}
                  <span className="font-mono font-semibold">
                    {latest.confidence}% ({getConfidenceTier(latest.confidence).level})
                  </span>
                  {" — "}
                  {getConfidenceTier(latest.confidence).explanation}
                  {latest.verdict === "ANOMALI" && " — pisahkan dari jalur kemas."}
                </p>
              )}
              {(latest.batchId || activeBatch?.batch_id) && (
                <p className="text-xs sm:text-sm opacity-85">
                  Batch aktif: <span className="font-semibold">{activeBatch?.petani_name || "Umum"}</span> •{" "}
                  <span className="font-mono">{latest.batchId || activeBatch?.batch_id}</span>
                </p>
              )}
            </div>
          </section>
        ) : (
          <section className="rounded-[28px] border-2 border-dashed border-border bg-card grid place-items-center min-h-[52dvh] md:min-h-0 p-8 text-center">
            <div>
              <BrandMark className="w-16 h-16 mx-auto" />
              <div className="mt-4 text-2xl font-extrabold">Menunggu buah pertama</div>
              <p className="mt-2 text-muted-foreground max-w-[42ch] mx-auto">
                Jalankan belt. Hasil tiap buah muncul di sini otomatis saat sensor mendeteksinya.
              </p>
            </div>
          </section>
        )}

        <aside className="rounded-[28px] bg-card border border-border flex flex-col min-h-0">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-bold">Daftar buah</h2>
            <p className="text-sm text-muted-foreground">
              Terbaru di atas. Buzzer alat: 1 bip normal, 3 bip panjang anomali, 2 bip berulang gagal dinilai.
            </p>
          </div>
          <ol className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5" aria-label="Daftar buah">
            {!loaded && (
              <li>
                <SkeletonRows rows={6} />
              </li>
            )}
            {queue.slice(0, 12).map((item, i) => (
              <li
                key={item.id}
                data-testid="queue-row"
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${i === 0 ? "bg-accent" : "hover:bg-accent/60"}`}
              >
                <span className="w-16 text-2xl font-extrabold tabular">#{item.seq}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-muted-foreground tabular">
                    {format(new Date(item.timestamp), "HH:mm:ss")}
                    {i === 0 && <span className="ml-2 font-semibold text-foreground">Terbaru</span>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {item.verdict === "GAGAL"
                      ? "Gagal dinilai — sisihkan manual"
                      : `Keyakinan ${item.confidence}% (${getConfidenceTier(item.confidence).level})`}
                  </div>
                </div>
                <span className={`rounded-xl px-3 py-1.5 text-sm font-bold ${VERDICT_CLASS[item.verdict]}`}>
                  {VERDICT_TEXT[item.verdict].label}
                </span>
              </li>
            ))}
            {loaded && queue.length === 0 && (
              <li className="px-3 py-6 text-sm text-muted-foreground">Belum ada buah hari ini.</li>
            )}
          </ol>
        </aside>
      </main>
    </div>
  );
}
