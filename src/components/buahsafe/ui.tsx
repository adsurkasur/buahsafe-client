import { ReactElement, ReactNode, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Penampang jambu kristal: kulit, daging, dan cincin biji. Dipakai sebagai logo. */
export function BrandMark({ className = "w-9 h-9" }: { className?: string }) {
  const seeds = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return [20 + Math.cos(a) * 7.5, 20 + Math.sin(a) * 7.5];
  });
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="var(--color-leaf)" />
      <circle cx="20" cy="20" r="14.5" fill="var(--color-jambu)" />
      <circle cx="20" cy="20" r="11" fill="#f7fbef" />
      {seeds.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.3" fill="var(--color-leaf)" opacity="0.75" />
      ))}
    </svg>
  );
}

/** Tooltip web (bukan tooltip bawaan peramban) untuk tombol dan elemen yang perlu penjelasan. */
export function Tip({ label, children, side = "bottom" }: { label: ReactNode; children: ReactElement; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="max-w-[260px] text-[13px] leading-snug bg-foreground text-background">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight leading-tight">{title}</h1>
        {description && <p className="mt-1 text-[15px] text-muted-foreground max-w-[65ch]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function KpiTile({ label, value, hint, tone = "plain", loading = false }: {
  label: string;
  value: string;
  hint?: string;
  tone?: "plain" | "pass" | "reject" | "hold";
  loading?: boolean;
}) {
  const bar = { plain: "bg-leaf", pass: "bg-pass", reject: "bg-reject", hold: "bg-hold" }[tone];
  return (
    <div className="relative rounded-2xl bg-card border border-border p-5 overflow-hidden">
      <span className={`absolute left-0 top-5 bottom-5 w-1 rounded-r ${bar}`} aria-hidden="true" />
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      {loading ? (
        <>
          <Skeleton className="mt-3 h-8 w-20" />
          <Skeleton className="mt-3 h-3.5 w-28" />
        </>
      ) : (
        <>
          <div className="mt-2 text-[34px] leading-none font-extrabold tabular tracking-tight">{value}</div>
          {hint && <div className="mt-2 text-[13px] text-muted-foreground">{hint}</div>}
        </>
      )}
    </div>
  );
}

export type Verdict = "NORMAL" | "ANOMALI" | "GAGAL";

/** Satu kosakata putusan untuk seluruh aplikasi: antrean, ringkasan, riwayat, analitik. */
export const VERDICT_TEXT: Record<Verdict, { label: string; action: string; explain: string }> = {
  NORMAL: {
    label: "Normal",
    action: "Masukkan ke keranjang normal",
    explain: "Model menilai buah normal (lolos mutu).",
  },
  ANOMALI: {
    label: "Anomali",
    action: "Masukkan ke keranjang anomali",
    explain: "Model menilai buah terindikasi rusak atau berhama di dalam.",
  },
  GAGAL: {
    label: "Gagal dinilai",
    action: "Sisihkan untuk diperiksa manual",
    explain: "Sensor atau model gagal menilai buah ini (mis. buah lewat saat alat sibuk). Sisihkan dan periksa manual.",
  },
};

export const VERDICT_CLASS: Record<Verdict, string> = {
  NORMAL: "bg-pass text-pass-ink",
  ANOMALI: "bg-reject text-reject-ink",
  GAGAL: "bg-hold text-hold-ink",
};

export function VerdictChip({ verdict, size = "md" }: { verdict: Verdict; size?: "sm" | "md" }) {
  return (
    <Tip label={VERDICT_TEXT[verdict].explain}>
      <span
        tabIndex={0}
        className={`inline-flex items-center rounded-lg font-semibold whitespace-nowrap cursor-help ${VERDICT_CLASS[verdict]} ${
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-[13px]"
        }`}
      >
        {VERDICT_TEXT[verdict].label}
      </span>
    </Tip>
  );
}

export function DeviceStatus({ connected, simulator, enabled = true }: { connected?: boolean; simulator?: boolean; enabled?: boolean }) {
  const text = !enabled ? "Alat diputus pemilik" : connected ? "Alat terhubung" : "Alat tidak terhubung";
  const help = !enabled
    ? "Pemilik memutus alat di Pengaturan > Perangkat. Buah tidak dinilai sampai alat disambungkan lagi."
    : connected
      ? "Alat mengirim detak ke server dalam 25 detik terakhir."
      : "Server belum menerima detak dari alat. Periksa listrik dan WiFi alat.";
  return (
    <Tip label={help}>
      <span
        tabIndex={0}
        role="status"
        className={`inline-flex items-center gap-2 h-10 px-3 rounded-full text-sm font-semibold border cursor-help ${
          !enabled ? "bg-hold/15 border-hold/40" : connected ? "bg-pass/10 border-pass/30 text-pass" : "bg-muted border-border text-muted-foreground"
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${!enabled ? "bg-hold" : connected ? "bg-pass pulse-dot" : "bg-muted-foreground/60"}`} />
        {text}
        {simulator && <span className="rounded-md bg-leaf text-primary-foreground px-1.5 text-[11px]">Simulator</span>}
      </span>
    </Tip>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
      <BrandMark className="w-10 h-10 mx-auto opacity-60" />
      <div className="mt-3 font-semibold">{title}</div>
      {children && <div className="mt-1 text-sm text-muted-foreground max-w-[50ch] mx-auto">{children}</div>}
    </div>
  );
}

/** Baris kerangka saat data dimuat: bentuknya mirip isi sebenarnya agar tidak "melompat". */
export function SkeletonRows({ rows = 6, className = "h-12" }: { rows?: number; className?: string }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Memuat data">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={`w-full rounded-xl ${className}`} />
      ))}
    </div>
  );
}

const THEME_KEY = "buahsafe.theme";

/** Saklar mode terang/gelap. Bawaan terang (meja sortasi di tempat terang). */
export function ThemeToggle({ className = "", withLabel = false }: { className?: string; withLabel?: boolean }) {
  const [dark, setDark] = useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
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
  return (
    <Tip label={dark ? "Ganti ke mode terang (cocok untuk ruangan terang)" : "Ganti ke mode gelap"}>
      <button
        onClick={toggle}
        aria-label={dark ? "Mode gelap aktif, ganti ke mode terang" : "Mode terang aktif, ganti ke mode gelap"}
        className={`inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-card hover:bg-accent text-sm font-semibold ${
          withLabel ? "px-3" : "w-11"
        } ${className}`}
      >
        {dark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        {withLabel && <span>{dark ? "Mode gelap" : "Mode terang"}</span>}
      </button>
    </Tip>
  );
}

/** Nilai warna token untuk pustaka grafik (atribut SVG tidak membaca var() CSS). */
export function useChartColors() {
  const read = () => {
    const css = getComputedStyle(document.documentElement);
    const v = (name: string) => css.getPropertyValue(name).trim();
    return { pass: v("--pass"), reject: v("--reject"), hold: v("--hold"), grid: v("--border"), text: v("--muted-foreground"), card: v("--card"), accent: v("--accent") };
  };
  const [colors, setColors] = useState(read);
  useEffect(() => {
    // Mode gelap/terang berganti lewat kelas pada <html>
    const obs = new MutationObserver(() => setColors(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return colors;
}

export interface ConfidenceTierInfo {
  level: "Tinggi" | "Sedang" | "Rendah";
  shortLabel: string;
  explanation: string;
  badgeClass: string;
}

/**
 * Mengubah persentase keyakinan model SVM-RBF menjadi kategori kualitatif
 * sesuai ambang keputusan model (threshold 0,35).
 */
export function getConfidenceTier(confidence: number): ConfidenceTierInfo {
  if (confidence >= 85) {
    return {
      level: "Tinggi",
      shortLabel: "Tinggi",
      explanation: "Pemisahan spektral sangat tegas",
      badgeClass: "bg-emerald-500/12 text-emerald-800 dark:text-emerald-300 border-emerald-500/25",
    };
  }
  if (confidence >= 65) {
    return {
      level: "Sedang",
      shortLabel: "Sedang",
      explanation: "Dalam batas margin normal model",
      badgeClass: "bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-500/25",
    };
  }
  return {
    level: "Rendah",
    shortLabel: "Rendah • Dekat ambang",
    explanation: "Dekat ambang keputusan 0,35 — periksa fisik buah bila ragu",
    badgeClass: "bg-red-500/12 text-red-800 dark:text-red-300 border-red-500/25",
  };
}

export function ConfidenceBadge({
  confidence,
  result,
  showExplanation = false,
}: {
  confidence: number;
  result?: "NORMAL" | "ANOMALI" | "GAGAL";
  showExplanation?: boolean;
}) {
  if (result === "GAGAL") {
    return <span className="text-xs text-muted-foreground">Sensor/model gagal menilai</span>;
  }
  const tier = getConfidenceTier(confidence);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5" title={tier.explanation}>
      <span className="font-mono font-semibold tabular-nums">{confidence}%</span>
      <span
        className={cn(
          "inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none",
          tier.badgeClass
        )}
      >
        {tier.shortLabel}
      </span>
      {showExplanation && (
        <span className="text-xs text-muted-foreground">({tier.explanation})</span>
      )}
    </span>
  );
}

