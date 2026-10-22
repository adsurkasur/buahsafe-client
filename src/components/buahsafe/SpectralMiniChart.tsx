import { Activity } from "lucide-react";
import type { ScanRecord } from "@/lib/buahsafe-data";

export function SpectralMiniChart({ spectral, result }: { spectral?: ScanRecord["spectral"]; result?: string }) {
  if (!spectral) return null;
  const isAnomali = result === "ANOMALI";
  const channels = [
    { wl: "610", val: spectral.nm610, isKey: false },
    { wl: "680", val: spectral.nm680, isKey: false },
    { wl: "730", val: spectral.nm730, isKey: true },
    { wl: "760", val: spectral.nm760, isKey: false },
    { wl: "810", val: spectral.nm810, isKey: true },
    { wl: "860", val: spectral.nm860, isKey: false },
  ];
  const maxVal = Math.max(...channels.map((c) => c.val), 6.5);

  return (
    <div className="mt-4 p-3 rounded-lg border border-border bg-background/50">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
        <span className="font-medium inline-flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-primary" />
          Spektrum Pantulan 6 Kanal (Visible-NIR)
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">Sensor AS7265x</span>
      </div>
      <div className="grid grid-cols-6 gap-1.5 items-end h-16 pt-2">
        {channels.map((c) => {
          const heightPct = Math.min(100, Math.max(12, (c.val / maxVal) * 100));
          const barColor = isAnomali && c.isKey ? "bg-rose-500 hover:bg-rose-600" : "bg-primary/80 hover:bg-primary";
          return (
            <div key={c.wl} className="flex flex-col items-center gap-1 h-full justify-end">
              <div
                className={`w-full rounded-t transition-all duration-500 ${barColor}`}
                style={{ height: `${heightPct}%` }}
                title={`${c.wl} nm: ${c.val} ${c.isKey ? "(Kanal Kunci NIR)" : ""}`}
              />
              <span className={`text-[9px] font-mono ${c.isKey ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                {c.wl}
              </span>
            </div>
          );
        })}
      </div>
      {isAnomali && (
        <div className="mt-2 text-[10px] text-rose-600 font-medium">
          * Batang merah = kanal kunci 730 & 810 nm. Bandingkan dengan pola buah normal sebelum mengambil keputusan manual.
        </div>
      )}
    </div>
  );
}
