import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Radio, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { PageLayout } from "@/components/buahsafe/Layout";
import { fetchDeviceStatus, fetchQueue, requestSimulation, QueueItem } from "@/lib/buahsafe-data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/scan")({ component: ConveyorPage });

// Buah lewat conveyor setiap beberapa detik: layar harus sesegar bunyi alat
const QUEUE_POLL_MS = 1000;
const STATUS_POLL_MS = 5000;

const VERDICT = {
  NORMAL: {
    label: "NORMAL",
    basket: "Keranjang HIJAU",
    instruction: "👉 ARAHAN: Masukkan ke Keranjang HIJAU (Lolos Mutu)",
    icon: CheckCircle2,
    card: "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100",
    chip: "bg-emerald-600 text-white",
  },
  ANOMALI: {
    label: "ANOMALI",
    basket: "Keranjang MERAH",
    instruction: "👉 ARAHAN: Pisahkan ke Keranjang MERAH (Afkir)",
    icon: AlertTriangle,
    card: "bg-rose-500/10 border-rose-500/40 text-rose-950 dark:text-rose-100",
    chip: "bg-rose-600 text-white",
  },
  GAGAL: {
    label: "GAGAL",
    basket: "Sisihkan",
    instruction: "👉 ARAHAN: Sisihkan buah untuk pemeriksaan manual (sensor/model gagal menilai)",
    icon: XCircle,
    card: "bg-amber-500/10 border-amber-500/50 text-amber-950 dark:text-amber-100",
    chip: "bg-amber-500 text-white",
  },
} as const;

function ConveyorPage() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [device, setDevice] = useState<{ connected: boolean; firmware?: string } | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    let alive = true;
    const loadQueue = () =>
      fetchQueue().then((q) => {
        if (alive && q) {
          setQueue(q);
          setLoaded(true);
        }
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
  const isSimulator = !!device?.firmware?.startsWith("sim");
  const canSimulate = isSimulator && device?.connected && user?.role !== "operator";

  const simulate = async () => {
    setRequesting(true);
    const res = await requestSimulation(10);
    setRequesting(false);
    if (res.ok) toast.success("Simulasi dimulai", { description: "10 buah akan lewat dalam ~1 menit." });
    else toast.error("Simulasi gagal dimulai", { description: res.error });
  };

  return (
    <PageLayout
      title="Antrean Conveyor"
      subtitle="Hasil tiap buah yang lewat sensor, berurutan sesuai belt"
      roles={["operator", "supervisor", "owner"]}
    >
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <span
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${
            device?.connected
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
              : "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
          }`}
        >
          <Radio className="w-4 h-4" />
          {device?.connected ? "Alat terhubung" : "Alat tidak terhubung"}
          {isSimulator && <span className="ml-1 px-1.5 rounded bg-violet-600 text-white text-[11px]">Simulator</span>}
        </span>
        {canSimulate && (
          <button
            onClick={simulate}
            disabled={requesting}
            className="h-9 px-3 rounded-lg bg-violet-600 text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-violet-700 disabled:opacity-50"
          >
            <PlayCircle className="w-4 h-4" /> Jalankan simulasi conveyor (10 buah)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {latest ? (
            <motion.div
              key={latest.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-xl border-2 p-6 ${VERDICT[latest.verdict].card}`}
              data-testid="latest-fruit"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider opacity-70">
                    Buah terbaru · {latest.fruitId} · {format(new Date(latest.timestamp), "HH:mm:ss")}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-4xl font-bold tracking-tight">
                    {(() => {
                      const Icon = VERDICT[latest.verdict].icon;
                      return <Icon className="w-9 h-9" />;
                    })()}
                    <span>#{latest.seq} {VERDICT[latest.verdict].label}</span>
                  </div>
                </div>
                {latest.verdict !== "GAGAL" && (
                  <div className="text-right">
                    <div className="text-xs opacity-75">Keyakinan model</div>
                    <div className="text-2xl font-mono font-bold">{latest.confidence}%</div>
                  </div>
                )}
              </div>
              <div className="mt-4 px-4 py-3 rounded-lg bg-background/60 border border-current/20 text-base font-semibold">
                {VERDICT[latest.verdict].instruction}
              </div>
            </motion.div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
              {loaded
                ? "Belum ada buah yang lewat. Jalankan belt; hasil muncul otomatis saat sensor mendeteksi buah."
                : "Memuat antrean…"}
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground leading-relaxed">
            <div className="font-semibold text-foreground mb-1">Cara membaca antrean</div>
            Urutan di layar sama dengan urutan buah di belt, dan nomor <strong>#</strong> sama dengan nomor di layar LCD
            alat. Ikuti juga bunyi alat: <strong>1 bip pendek</strong> = HIJAU, <strong>3 bip panjang</strong> = MERAH,{" "}
            <strong>2 bip berulang</strong> = sisihkan. Jika urutan terasa tidak cocok, sisihkan buah dan beri tahu
            Supervisor QC.
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm">Buah terakhir</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Terbaru di atas</p>
          </div>
          <div className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {queue.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-5 py-3 flex items-center gap-3"
                  data-testid="queue-row"
                >
                  <span className="font-mono font-bold text-lg w-14">#{item.seq}</span>
                  <span className="text-xs text-muted-foreground tabular-nums flex-1">
                    {format(new Date(item.timestamp), "HH:mm:ss")}
                  </span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${VERDICT[item.verdict].chip}`}>
                    {VERDICT[item.verdict].basket}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {loaded && queue.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">Antrean kosong.</div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
