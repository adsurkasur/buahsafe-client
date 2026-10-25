import { ReactNode, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

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

export function KpiTile({ label, value, hint, tone = "plain" }: {
  label: string;
  value: string;
  hint?: string;
  tone?: "plain" | "pass" | "reject" | "hold";
}) {
  const bar = { plain: "bg-leaf", pass: "bg-pass", reject: "bg-reject", hold: "bg-hold" }[tone];
  return (
    <div className="relative rounded-2xl bg-card border border-border p-5 overflow-hidden">
      <span className={`absolute left-0 top-5 bottom-5 w-1 rounded-r ${bar}`} aria-hidden="true" />
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 text-[34px] leading-none font-extrabold tabular tracking-tight">{value}</div>
      {hint && <div className="mt-2 text-[13px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export type Verdict = "NORMAL" | "ANOMALI" | "GAGAL";

export const VERDICT_TEXT: Record<Verdict, { basket: string; long: string }> = {
  NORMAL: { basket: "Keranjang hijau", long: "Masukkan ke keranjang hijau" },
  ANOMALI: { basket: "Keranjang merah", long: "Pisahkan ke keranjang merah" },
  GAGAL: { basket: "Sisihkan", long: "Sisihkan untuk diperiksa manual" },
};

export const VERDICT_CLASS: Record<Verdict, string> = {
  NORMAL: "bg-pass text-pass-ink",
  ANOMALI: "bg-reject text-reject-ink",
  GAGAL: "bg-hold text-hold-ink",
};

export function VerdictChip({ verdict, compact = false }: { verdict: Verdict; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-lg font-semibold whitespace-nowrap ${VERDICT_CLASS[verdict]} ${compact ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-[13px]"}`}>
      {compact ? (verdict === "GAGAL" ? "Sisihkan" : verdict === "NORMAL" ? "Normal" : "Anomali") : VERDICT_TEXT[verdict].basket}
    </span>
  );
}

export function DeviceStatus({ connected, simulator }: { connected?: boolean; simulator?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 h-9 px-3 rounded-full text-sm font-semibold border ${
        connected ? "bg-pass/10 border-pass/30 text-pass" : "bg-muted border-border text-muted-foreground"
      }`}
      role="status"
    >
      <span className={`w-2 h-2 rounded-full ${connected ? "bg-pass pulse-dot" : "bg-muted-foreground/60"}`} />
      {connected ? "Alat terhubung" : "Alat tidak terhubung"}
      {simulator && <span className="rounded-md bg-leaf text-primary-foreground px-1.5 text-[11px]">Simulator</span>}
    </span>
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

const THEME_KEY = "buahsafe.theme";

/** Mode terang/gelap; bawaan mengikuti pengaturan perangkat. */
export function ThemeToggle({ className = "" }: { className?: string }) {
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
    <button
      onClick={toggle}
      className={`inline-flex items-center justify-center w-11 h-11 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground ${className}`}
      aria-label={dark ? "Gunakan mode terang" : "Gunakan mode gelap"}
      title={dark ? "Mode terang" : "Mode gelap"}
    >
      {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

/** Nilai warna token untuk pustaka grafik (atribut SVG tidak membaca var() CSS). */
export function useChartColors() {
  const read = () => {
    const css = getComputedStyle(document.documentElement);
    const v = (name: string) => css.getPropertyValue(name).trim();
    return { pass: v("--pass"), reject: v("--reject"), grid: v("--border"), text: v("--muted-foreground"), card: v("--card"), accent: v("--accent") };
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
