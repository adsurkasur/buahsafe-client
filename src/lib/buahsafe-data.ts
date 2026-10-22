/**
 * BuahSafe Data Layer
 *
 * Mengelola data perangkat, riwayat pemindaian, dan inferensi spektral.
 * Sumber kebenaran adalah API server backend BuahSafe; localStorage hanya cache
 * salinan terakhir agar halaman tetap terbaca saat koneksi terputus.
 * Tidak ada data contoh/acak: angka di dasbor harus berasal dari pindaian nyata.
 */
import { apiFetch } from "./api";

export interface Device {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline" | "idle";
  lastSeen: string;
  totalScans: number;
  firmwareVersion: string;
  installDate: string;
}

export interface SpectralChannels {
  nm610: number;
  nm680: number;
  nm730: number;
  nm760: number;
  nm810: number;
  nm860: number;
}

export interface ScanRecord {
  id: string;
  fruitId: string;
  deviceId: string;
  deviceName: string;
  timestamp: string;
  result: "NORMAL" | "ANOMALI";
  confidence: number;
  batchId: string;
  operatorId?: string;
  spectral?: SpectralChannels;
}

// v2: kunci baru supaya cache data acak dari versi purwarupa (v1) tidak terbaca lagi
const DEVICES_KEY = "buahsafe.devices.v2";
const SCANS_KEY = "buahsafe.scans.v2";

function readCache<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function writeCache(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getDevices(): Device[] {
  return readCache<Device>(DEVICES_KEY);
}

export function getScans(): ScanRecord[] {
  return readCache<ScanRecord>(SCANS_KEY);
}

/**
 * Sinkronisasi data perangkat dari backend server.
 */
export async function syncDevices(): Promise<Device[]> {
  const res = await apiFetch<{ devices: any[] }>("api/devices", { timeoutMs: 3000 });
  if (res.ok && Array.isArray(res.data?.devices)) {
    const mapped: Device[] = res.data.devices.map((d: any) => ({
      id: d.id,
      name: d.name,
      location: d.location,
      status: d.status,
      lastSeen: d.last_seen,
      totalScans: d.total_scans || 0,
      firmwareVersion: d.firmware_version || "—",
      installDate: d.install_date || "",
    }));
    writeCache(DEVICES_KEY, mapped);
    return mapped;
  }
  return getDevices();
}

function toScanRecord(m: any, devices: Device[]): ScanRecord {
  const deviceId = m.device_id || "BSF-001";
  const timestamp: string = m.timestamp;
  return {
    id: String(m.id),
    fruitId: m.fruit_id,
    deviceId,
    deviceName: devices.find((d) => d.id === deviceId)?.name || deviceId,
    timestamp,
    result: m.prediction,
    confidence: Math.round(m.confidence ?? 0),
    // Batch = hari sortasi (server belum menyimpan kode batch tersendiri)
    batchId: `BATCH-${timestamp.slice(0, 10).replace(/-/g, "")}`,
    operatorId: m.operator_id || undefined,
    spectral: {
      nm610: m.nm610 ?? 0,
      nm680: m.nm680 ?? 0,
      nm730: m.nm730 ?? 0,
      nm760: m.nm760 ?? 0,
      nm810: m.nm810 ?? 0,
      nm860: m.nm860 ?? 0,
    },
  };
}

/**
 * Sinkronisasi riwayat sortasi dari server. Hanya baris yang punya putusan model
 * (NORMAL/ANOMALI) yang dihitung; baris akuisisi dataset riset tanpa prediksi diabaikan.
 */
export async function syncScans(): Promise<ScanRecord[]> {
  // ponytail: 2000 baris terakhir; ganti ke /api/analytics + paginasi jika riwayat jauh lebih besar
  const res = await apiFetch<{ measurements: any[] }>("api/measurements?limit=2000", {
    timeoutMs: 5000,
  });
  if (!res.ok || !Array.isArray(res.data?.measurements)) return getScans();
  const devices = getDevices();
  const scans = res.data.measurements
    .filter((m) => m.prediction === "NORMAL" || m.prediction === "ANOMALI")
    .map((m) => toScanRecord(m, devices))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  writeCache(SCANS_KEY, scans);
  return scans;
}

/**
 * Memicu pemindaian buah lewat POST /api/scan (sensor AS7265x + model SVM di server).
 * Gagal = lempar Error berisi pesan server. Tidak pernah membuat hasil pengganti:
 * arahan keranjang hanya boleh berasal dari spektrum yang benar-benar diukur.
 */
export async function triggerScan(opts: {
  operatorId?: string;
  deviceId: string;
  fruitId: string;
}): Promise<ScanRecord> {
  const res = await apiFetch<{
    measurement: any;
    prediction?: { result: "NORMAL" | "ANOMALI"; confidence: number };
  }>("api/scan", {
    method: "POST",
    body: JSON.stringify({
      fruit_id: opts.fruitId.trim().toUpperCase(),
      device_id: opts.deviceId,
      operator_id: opts.operatorId || "",
    }),
    // Firmware bisa retry hingga 3x di sisi server
    timeoutMs: 20000,
  });

  const m = res.data?.measurement;
  const p = res.data?.prediction;
  if (!res.ok || !m || !p) {
    throw new Error(res.error || "Server tidak mengembalikan hasil klasifikasi");
  }

  const scan = toScanRecord({ ...m, prediction: p.result, confidence: p.confidence }, getDevices());
  writeCache(SCANS_KEY, [...getScans(), scan]);
  return scan;
}

export const DEVICE_COLORS: Record<string, string> = {
  "BSF-001": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "BSF-002": "bg-blue-50 text-blue-700 border-blue-200",
  "BSF-003": "bg-violet-50 text-violet-700 border-violet-200",
};
