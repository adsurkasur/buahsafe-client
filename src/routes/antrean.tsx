import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Maximize, LogOut, LayoutDashboard, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AuthGate, OfflineBanner, useServerDown } from "@/components/buahsafe/Layout";
import { BrandMark, DeviceStatus, VERDICT_CLASS, VERDICT_TEXT, Verdict } from "@/components/buahsafe/ui";
import { fetchDeviceStatus, fetchQueue, requestSimulation, QueueItem } from "@/lib/buahsafe-data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/antrean")({ component: AntreanPage });

// Buah lewat conveyor setiap beberapa detik: layar harus sesegar bunyi alat
const QUEUE_POLL_MS = 1000;
const STATUS_POLL_MS = 5000;
const SOUND_KEY = "buahsafe.antrean.suara";

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
  const [device, setDevice] = useState<{ connected: boolean; firmware?: string } | null>(null);
  const serverDown = useServerDown();
  const alert = useAlert();
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
    loadQueue();
    loadStatus();
    const q = setInterval(loadQueue, QUEUE_POLL_MS);
    const s = setInterval(loadStatus, STATUS_POLL_MS);
    return () => {
      alive = false;
      clearInterval(q);
      clearInterval(s);
    };
  }, []);

  const latest = queue[0];
  useEffect(() => {
    if (!latest) return;
    // Jangan berbunyi untuk buah yang sudah ada saat halaman dibuka
    if (lastId.current !== null && latest.id !== lastId.current) alert.play(latest.verdict);
    lastId.current = latest.id;
  }, [latest?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSimulator = !!device?.firmware?.startsWith("sim");
  const canManage = user?.role !== "operator";

  const simulate = async () => {
    const res = await requestSimulation(10);
    if (res.ok) toast.success("Simulasi dimulai", { description: "10 buah lewat dalam sekitar satu menit." });
    else toast.error("Simulasi belum bisa dimulai", { description: res.error });
  };
  const fullscreen = () => document.documentElement.requestFullscreen?.().catch(() => {});

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 border-b border-border bg-card">
        <BrandMark className="w-9 h-9" />
        <div className="mr-auto">
          <h1 className="text-lg font-extrabold leading-none">Antrean conveyor</h1>
          <div className="text-xs text-muted-foreground mt-1">Urutan layar sama dengan urutan buah di belt</div>
        </div>
        <DeviceStatus connected={device?.connected} simulator={isSimulator} />
        {canManage && isSimulator && device?.connected && (
          <button onClick={simulate} className="h-11 px-3 rounded-xl bg-leaf text-primary-foreground text-sm font-semibold inline-flex items-center gap-2">
            <PlayCircle className="w-5 h-5" /> Jalankan simulasi 10 buah
          </button>
        )}
        <button
          onClick={alert.toggle}
          aria-pressed={alert.enabled}
          className={`h-11 px-3 rounded-xl border text-sm font-semibold inline-flex items-center gap-2 ${
            alert.enabled ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
          }`}
        >
          {alert.enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          <span className="hidden sm:inline">{alert.enabled ? "Suara aktif" : "Aktifkan suara"}</span>
        </button>
        <button onClick={fullscreen} className="h-11 w-11 rounded-xl border border-border hover:bg-accent hidden sm:grid place-items-center" aria-label="Layar penuh">
          <Maximize className="w-5 h-5" />
        </button>
        {canManage && (
          <Link to="/" className="h-11 w-11 rounded-xl border border-border hover:bg-accent grid place-items-center" aria-label="Ke ringkasan">
            <LayoutDashboard className="w-5 h-5" />
          </Link>
        )}
        <button onClick={logout} className="h-11 w-11 rounded-xl border border-border hover:bg-accent grid place-items-center" aria-label="Keluar">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {serverDown && <div className="px-4 sm:px-6 pt-4"><OfflineBanner /></div>}

      <main className="flex-1 grid gap-4 p-4 sm:p-6 md:grid-cols-[minmax(0,1fr)_340px] min-h-0">
        {latest ? (
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
              <div className="font-extrabold tabular leading-[0.85] tracking-tight text-[clamp(96px,24vw,260px)]">
                #{latest.seq}
              </div>
              <div className="mt-4 font-extrabold tracking-tight text-[clamp(30px,6vw,68px)] leading-none">
                {VERDICT_TEXT[latest.verdict].basket}
              </div>
            </div>
            <div className="text-base sm:text-lg font-medium opacity-90">
              {latest.verdict === "GAGAL"
                ? "Sensor atau model tidak dapat menilai buah ini. Periksa secara manual."
                : `Keyakinan model ${latest.confidence}%`}
            </div>
          </section>
        ) : (
          <section className="rounded-[28px] border-2 border-dashed border-border bg-card grid place-items-center min-h-[52dvh] md:min-h-0 p-8 text-center">
            <div>
              <BrandMark className="w-16 h-16 mx-auto" />
              <div className="mt-4 text-2xl font-extrabold">{loaded ? "Menunggu buah pertama" : "Memuat antrean…"}</div>
              {loaded && (
                <p className="mt-2 text-muted-foreground max-w-[42ch] mx-auto">
                  Jalankan belt. Hasil tiap buah muncul di sini otomatis saat sensor mendeteksinya.
                </p>
              )}
            </div>
          </section>
        )}

        <aside className="rounded-[28px] bg-card border border-border flex flex-col min-h-0">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-bold">Buah sebelumnya</h2>
            <p className="text-sm text-muted-foreground">1 bip hijau, 3 bip panjang merah, 2 bip berulang sisihkan</p>
          </div>
          <ol className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5" aria-label="Buah sebelumnya">
            {queue.slice(1, 10).map((item) => (
              <li key={item.id} data-testid="queue-row" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-accent/60">
                <span className="w-16 text-2xl font-extrabold tabular">#{item.seq}</span>
                <span className="flex-1 text-sm text-muted-foreground tabular">{format(new Date(item.timestamp), "HH:mm:ss")}</span>
                <span className={`rounded-xl px-3 py-1.5 text-sm font-bold ${VERDICT_CLASS[item.verdict]}`}>
                  {VERDICT_TEXT[item.verdict].basket}
                </span>
              </li>
            ))}
            {loaded && queue.length < 2 && <li className="px-3 py-6 text-sm text-muted-foreground">Belum ada buah sebelumnya.</li>}
          </ol>
        </aside>
      </main>
    </div>
  );
}
