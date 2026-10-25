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

// 18 kanal AS7265x (nm). Nilai = intensitas cahaya transmisi terkalibrasi sensor.
export const WAVELENGTHS = [410, 435, 460, 485, 510, 535, 560, 585, 610, 645, 680, 705, 730, 760, 810, 860, 900, 940];
export type SpectralChannels = Record<string, number>;

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
  /** Kunci jawaban setelah buah dibelah: "", "normal", atau "anomali" */
  label?: string;
}

// v3: cache v1 berisi data acak purwarupa, v2 hanya 6 kanal
const DEVICES_KEY = "buahsafe.devices.v3";
const SCANS_KEY = "buahsafe.scans.v3";

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
    label: m.label || "",
    spectral: Object.fromEntries(WAVELENGTHS.map((w) => [`nm${w}`, m[`nm${w}`] ?? 0])),
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

/** Satu baris antrean conveyor: putusan model, atau GAGAL bila sensor/model gagal. */
export interface QueueItem {
  id: number;
  fruitId: string;
  seq: string;
  timestamp: string;
  verdict: "NORMAL" | "ANOMALI" | "GAGAL";
  confidence: number;
}

/**
 * Buah terakhir yang lewat conveyor, terbaru di depan. Server memberi ID
 * CV-YYYYMMDD-NNNN (SIM-... untuk simulator); NNNN = nomor di LCD alat.
 */
export async function fetchQueue(limit = 12): Promise<QueueItem[] | null> {
  const res = await apiFetch<{ measurements: any[] }>(`api/measurements?limit=${limit}`, { timeoutMs: 4000 });
  if (!res.ok || !Array.isArray(res.data?.measurements)) return null;
  return res.data.measurements
    .filter((m) => /^(CV|SIM)-\d{8}-\d{4}$/.test(m.fruit_id))
    .map((m) => ({
      id: m.id,
      fruitId: m.fruit_id,
      seq: String(Number(m.fruit_id.slice(-4))),
      timestamp: m.timestamp,
      verdict: m.prediction === "NORMAL" || m.prediction === "ANOMALI" ? m.prediction : "GAGAL",
      confidence: Math.round(m.confidence ?? 0),
    }));
}

export async function setScanLabel(id: string, label: "" | "normal" | "anomali") {
  return apiFetch(`api/measurements/${id}/label`, { method: "PATCH", body: JSON.stringify({ label }) });
}

export async function requestSimulation(count: number) {
  return apiFetch<{ count: number }>("api/device/simulate", { method: "POST", body: JSON.stringify({ count }) });
}

export async function fetchDeviceStatus(): Promise<{ connected: boolean; firmware?: string; mode?: string } | null> {
  const res = await apiFetch<{ device: any }>("api/status", { timeoutMs: 4000 });
  return res.ok ? res.data?.device ?? null : null;
}

export const DEVICE_COLORS: Record<string, string> = {
  "BSF-001": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "BSF-002": "bg-blue-50 text-blue-700 border-blue-200",
  "BSF-003": "bg-violet-50 text-violet-700 border-violet-200",
};
