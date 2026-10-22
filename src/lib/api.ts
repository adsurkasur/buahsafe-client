/**
 * BuahSafe API Client
 *
 * Menghubungkan frontend BuahSafe ke backend server (Flask ML Core).
 * Mendukung konfigurasi via VITE_API_URL (misal saat dideploy di Vercel).
 * Menyertakan token otentikasi Bearer secara otomatis jika tersedia.
 */

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";

export const TOKEN_KEY = "buahsafe.auth.token";
export const SESSION_EXPIRED_EVENT = "buahsafe:session-expired";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiFetch<T = any>(
  path: string,
  options: FetchOptions = {},
): Promise<{ ok: boolean; data?: T; error?: string; status?: number }> {
  const { timeoutMs = 8000, ...fetchOpts } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const url = `${API_BASE_URL.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOpts.headers as Record<string, string> || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...fetchOpts,
      signal: controller.signal,
      headers,
    });

    clearTimeout(timeoutId);

    const json = await res.json().catch(() => null);

    if (res.status === 401 && token) {
      // Token dicabut/kedaluwarsa (mis. sandi direset Owner): akhiri sesi lokal juga
      setAuthToken(null);
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: json?.error || `Server merespons status ${res.status}`,
      };
    }

    return { ok: true, status: res.status, data: json };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isAbort = err?.name === "AbortError";
    return {
      ok: false,
      error: isAbort
        ? "Waktu tunggu koneksi ke server habis (timeout)"
        : "Tidak dapat terhubung ke server backend",
    };
  }
}
