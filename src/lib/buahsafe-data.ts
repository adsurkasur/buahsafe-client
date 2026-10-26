/**
 * BuahSafe Data Layer
 *
 * Mengelola data perangkat, riwayat pemindaian, dan inferensi spektral.
 * Sumber kebenaran adalah API server backend BuahSafe; localStorage hanya cache
 * salinan terakhir agar halaman tetap terbaca saat koneksi terputus.
 * Tidak ada data contoh/acak: angka di dasbor harus berasal dari pindaian nyata.
 */
import { apiFetch, API_BASE_URL, getAuthToken } from "./api";

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
  /** GAGAL = sensor atau model gagal menilai buah conveyor; buah disisihkan untuk diperiksa manual */
  result: "NORMAL" | "ANOMALI" | "GAGAL";
  confidence: number;
  batchId: string;
  operatorId?: string;
  spectral?: SpectralChannels;
  /** Kunci jawaban setelah buah dibelah: "", "normal", atau "anomali" */
  label?: string;
}

// v4: v1 data acak purwarupa, v2 hanya 6 kanal, v3 belum memuat buah gagal dinilai
const DEVICES_KEY = "buahsafe.devices.v4";
const SCANS_KEY = "buahsafe.scans.v4";

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
    result: m.prediction === "NORMAL" || m.prediction === "ANOMALI" ? m.prediction : "GAGAL",
    confidence: Math.round(m.confidence ?? 0),
    // Batch = hari sortasi (server belum menyimpan kode batch tersendiri)
    batchId: `BATCH-${timestamp.slice(0, 10).replace(/-/g, "")}`,
    operatorId: m.operator_id || undefined,
    label: m.label || "",
    spectral: Object.fromEntries(WAVELENGTHS.map((w) => [`nm${w}`, m[`nm${w}`] ?? 0])),
  };
}

const CONVEYOR_ID = /^(CV|SIM)-\d{8}-\d{4}$/;

/** Baris yang mewakili satu buah sortasi: punya putusan model, atau buah conveyor yang gagal dinilai. */
function isSortingRow(m: any) {
  return m.prediction === "NORMAL" || m.prediction === "ANOMALI" || (CONVEYOR_ID.test(m.fruit_id) && (m.prediction === "" || m.prediction === "GAGAL"));
}

/**
 * Sinkronisasi riwayat sortasi dari server. Baris akuisisi dataset riset (tanpa
 * prediksi, bukan ID conveyor) diabaikan.
 */
export async function syncScans(): Promise<ScanRecord[]> {
  // ponytail: 2000 baris terakhir; ganti ke /api/analytics + paginasi jika riwayat jauh lebih besar
  const res = await apiFetch<{ measurements: any[] }>("api/measurements?limit=2000", {
    timeoutMs: 5000,
  });
  if (!res.ok || !Array.isArray(res.data?.measurements)) return getScans();
  const devices = getDevices();
  const scans = res.data.measurements
    .filter(isSortingRow)
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
    .filter((m) => CONVEYOR_ID.test(m.fruit_id))
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

export interface DeviceStatusInfo {
  connected: boolean;
  enabled?: boolean;
  firmware?: string;
  mode?: string;
  seconds_since_seen?: number | null;
  last_trigger_ms?: number | null;
  last_measure_ms?: number | null;
  rssi?: string | null;
}

export async function setDeviceEnabled(enabled: boolean) {
  return apiFetch<{ enabled: boolean }>("api/device/enabled", { method: "POST", body: JSON.stringify({ enabled }) });
}

/**
 * Data latih untuk tim BuahSafe: ekspor server (18 kanal + label hasil belah), format
 * yang dibaca `ml/evaluate_models.py --data`. Baris GAGAL tidak ikut.
 */
export async function downloadTrainingCsv(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL.replace(/\/+$/, "")}/export.csv`, {
      headers: { Authorization: `Bearer ${getAuthToken() ?? ""}` },
    });
    if (!res.ok) return `Server merespons status ${res.status}`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(await res.blob());
    link.download = `buahsafe_data_latih_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    return null;
  } catch {
    return "Tidak dapat terhubung ke server";
  }
}

export async function fetchDeviceStatus(): Promise<DeviceStatusInfo | null> {
  const res = await apiFetch<{ device: any }>("api/status", { timeoutMs: 4000 });
  return res.ok ? res.data?.device ?? null : null;
}

export const DEVICE_COLORS: Record<string, string> = {
  "BSF-001": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "BSF-002": "bg-blue-50 text-blue-700 border-blue-200",
  "BSF-003": "bg-violet-50 text-violet-700 border-violet-200",
};
