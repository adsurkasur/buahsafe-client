import { Activity } from "lucide-react";
import { WAVELENGTHS, type ScanRecord } from "@/lib/buahsafe-data";

// Kanal 730 dan 810 nm: daerah NIR yang paling dipengaruhi jaringan busuk/rongga larva
const KEY_WAVELENGTHS = new Set([730, 810]);

export function SpectralMiniChart({ spectral, result }: { spectral?: ScanRecord["spectral"]; result?: string }) {
  if (!spectral) return null;
  const isAnomali = result === "ANOMALI";
  const channels = WAVELENGTHS.filter((w) => spectral[`nm${w}`] !== undefined).map((w) => ({
    wl: w,
    val: spectral[`nm${w}`],
    isKey: KEY_WAVELENGTHS.has(w),
  }));
  const maxVal = Math.max(...channels.map((c) => c.val), 1);

  return (
    <div className="mt-4 p-3 rounded-lg border border-border bg-background/50">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
        <span className="font-medium inline-flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-primary" />
          Spektrum Intensitas Transmisi {channels.length} Kanal (Visible-NIR)
        </span>
        <span className="text-[11px] text-muted-foreground">Sensor AS7265x</span>
      </div>
      <div
        className="grid gap-0.5 items-end h-20 pt-2"
        style={{ gridTemplateColumns: `repeat(${channels.length}, minmax(0, 1fr))` }}
      >
        {channels.map((c, i) => {
          const heightPct = Math.min(100, Math.max(8, (c.val / maxVal) * 100));
          const barColor = isAnomali && c.isKey ? "bg-reject" : "bg-leaf/80";
          // 18 label tidak muat di layar sempit: tampilkan kanal kunci dan tiap kanal ketiga
          const showLabel = c.isKey || i % 3 === 0;
          return (
            <div key={c.wl} className="flex flex-col items-center gap-1 h-full justify-end">
              <div
                className={`w-full rounded-t transition-all duration-500 ${barColor}`}
                style={{ height: `${heightPct}%` }}
                title={`${c.wl} nm: ${c.val.toFixed(3)}${c.isKey ? " (kanal kunci NIR)" : ""}`}
              />
              <span className={`text-[9px] tabular leading-none ${c.isKey ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                {showLabel ? c.wl : " "}
              </span>
            </div>
          );
        })}
      </div>
      {isAnomali && (
        <div className="mt-2 text-[10px] text-reject font-medium">
          * Batang merah = kanal kunci 730 & 810 nm. Bandingkan dengan pola buah normal sebelum mengambil keputusan manual.
        </div>
      )}
    </div>
  );
}
