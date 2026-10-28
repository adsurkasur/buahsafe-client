import { Activity } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { WAVELENGTHS, type ScanRecord } from "@/lib/buahsafe-data";
import { useChartColors } from "@/components/buahsafe/ui";

// 6 kanal fitur yang digunakan oleh model SVM-RBF
export const SVM_FEATURE_WAVELENGTHS = [610, 680, 730, 760, 810, 860] as const;
const SVM_FEATURE_SET = new Set<number>(SVM_FEATURE_WAVELENGTHS);

// Kanal 730 dan 810 nm: daerah NIR yang paling dipengaruhi jaringan busuk/rongga larva
const KEY_WAVELENGTHS = new Set<number>([730, 810]);

interface SpectralPoint {
  wl: number;
  val: number;
  isSvmFeature: boolean;
  isKey: boolean;
}

export function SpectralMiniChart({
  spectral,
  result,
}: {
  spectral?: ScanRecord["spectral"];
  result?: string;
}) {
  const c = useChartColors();
  if (!spectral) return null;

  const isAnomali = result === "ANOMALI";
  const channels: SpectralPoint[] = WAVELENGTHS.filter((w) => spectral[`nm${w}`] !== undefined).map((w) => ({
    wl: w,
    val: Number(spectral[`nm${w}`] ?? 0),
    isSvmFeature: SVM_FEATURE_SET.has(w),
    isKey: KEY_WAVELENGTHS.has(w),
  }));

  const strokeColor = isAnomali ? c.reject : c.pass;

  return (
    <div className="mt-4 p-3.5 rounded-xl border border-border bg-background/60">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground mb-1.5">
        <span className="font-semibold text-foreground inline-flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-primary" />
          Spektrum Intensitas Transmisi {channels.length} Kanal (Visible–NIR)
        </span>
        <span className="text-[11px] text-muted-foreground">Sensor AS7265x (410–940 nm)</span>
      </div>

      <p className="text-[11px] text-muted-foreground mb-2">
        6 kanal fitur model SVM-RBF: 610, 680, 730, 760, 810, 860 nm • Sorotan garis vertikal pada 730 nm & 810 nm menunjukkan serapan jaringan dalam buah.
      </p>

      <div className="h-44 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={channels} margin={{ top: 16, right: 12, left: -20, bottom: 2 }}>
            <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="wl"
              tickLine={false}
              axisLine={false}
              fontSize={10}
              stroke={c.text}
              tickFormatter={(v) => `${v}`}
              interval={1}
            />
            <YAxis tickLine={false} axisLine={false} fontSize={10} stroke={c.text} width={42} />
            <Tooltip
              cursor={{ stroke: c.grid, strokeDasharray: "3 3" }}
              contentStyle={{
                borderRadius: 10,
                border: `1px solid ${c.grid}`,
                background: c.card,
                fontSize: 12,
              }}
              labelFormatter={(wl) => {
                const n = Number(wl);
                if (KEY_WAVELENGTHS.has(n)) return `${n} nm — Kanal Kunci NIR (Fitur SVM-RBF)`;
                if (SVM_FEATURE_SET.has(n)) return `${n} nm — Kanal Fitur SVM-RBF`;
                return `${n} nm — Kanal Spektral`;
              }}
              formatter={(value: number) => [Number(value).toFixed(3), "Intensitas"]}
            />

            {/* Garis referensi tipis pada 4 kanal fitur SVM-RBF lainnya */}
            {[610, 680, 760, 860].map((wl) => (
              <ReferenceLine
                key={wl}
                x={wl}
                stroke={c.text}
                strokeOpacity={0.35}
                strokeDasharray="2 3"
              />
            ))}

            {/* Garis referensi utama pada kanal kunci NIR 730 & 810 nm */}
            {[730, 810].map((wl) => (
              <ReferenceLine
                key={wl}
                x={wl}
                stroke={strokeColor}
                strokeWidth={1.75}
                strokeDasharray="4 3"
                label={{
                  value: `${wl} nm`,
                  position: "top",
                  fill: strokeColor,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
            ))}

            <Area
              type="monotone"
              dataKey="val"
              fill={strokeColor}
              fillOpacity={0.14}
              stroke="none"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="val"
              stroke={strokeColor}
              strokeWidth={2}
              isAnimationActive={false}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (cx === undefined || cy === undefined || !payload) return <g key={props.key} />;
                if (payload.isKey) {
                  return (
                    <g key={`dot-${payload.wl}`}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill={strokeColor}
                        fillOpacity={0.22}
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={strokeColor}
                        stroke={c.card}
                        strokeWidth={1.5}
                      />
                    </g>
                  );
                }
                if (payload.isSvmFeature) {
                  return (
                    <circle
                      key={`dot-${payload.wl}`}
                      cx={cx}
                      cy={cy}
                      r={3.5}
                      fill={c.card}
                      stroke={strokeColor}
                      strokeWidth={2}
                    />
                  );
                }
                return (
                  <circle
                    key={`dot-${payload.wl}`}
                    cx={cx}
                    cy={cy}
                    r={2}
                    fill={strokeColor}
                    fillOpacity={0.55}
                  />
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <div className="inline-flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-current" style={{ color: strokeColor }} />
            Kanal kunci NIR (730 & 810 nm)
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full border-2 bg-card"
              style={{ borderColor: strokeColor }}
            />
            Kanal fitur SVM-RBF (610, 680, 760, 860 nm)
          </span>
        </div>
        {isAnomali && (
          <span className="text-reject font-medium">
            * Perhatikan anomali transmisi pada 730 & 810 nm sebelum keputusan manual.
          </span>
        )}
      </div>
    </div>
  );
}

