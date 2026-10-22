import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch, getAuthToken, setAuthToken, SESSION_EXPIRED_EVENT } from "./api";

export type Role = "operator" | "supervisor" | "owner";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  last_login?: string;
}

const USER_STORAGE_KEY = "buahsafe.auth.v1";

interface Ctx {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
}

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      const rawUser = localStorage.getItem(USER_STORAGE_KEY);
      let cachedUser: AuthUser | null = null;

      if (rawUser) {
        try {
          cachedUser = JSON.parse(rawUser);
        } catch {
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      }

      if (storedToken) {
        setTokenState(storedToken);
        // Validasi ke backend
        const res = await apiFetch<{ ok: boolean; user: AuthUser }>("api/auth/me", {
          timeoutMs: 4000,
        });

        if (res.ok && res.data?.user) {
          const freshUser = res.data.user;
          setUser(freshUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshUser));
        } else if (res.status === 401 || res.status === 403) {
          // Token kedaluwarsa atau tidak valid di server
          setAuthToken(null);
          localStorage.removeItem(USER_STORAGE_KEY);
          setUser(null);
          setTokenState(null);
        } else if (cachedUser) {
          // Server offline / timeout: pertahankan sesi lokal dengan peringatan
          setUser(cachedUser);
        }
      }

      setReady(true);
    };

    initAuth();

    const onExpired = () => {
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      setTokenState(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login: Ctx["login"] = async (username, password) => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUser || !cleanPassword) {
      return { ok: false, error: "Nama pengguna dan kata sandi wajib diisi" };
    }

    const res = await apiFetch<{ ok: boolean; token: string; user: AuthUser }>("api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: cleanUser, password: cleanPassword }),
      timeoutMs: 5000,
    });

    if (res.ok && res.data?.token && res.data?.user) {
      const u = res.data.user;
      const t = res.data.token;
      setAuthToken(t);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
      setUser(u);
      setTokenState(t);
      return { ok: true };
    }

    return {
      ok: false,
      error: res.error || "Nama pengguna atau kata sandi tidak cocok",
    };
  };

  const logout = async () => {
    try {
      await apiFetch("api/auth/logout", {
        method: "POST",
        timeoutMs: 2000,
      });
    } catch {}
    setAuthToken(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    setTokenState(null);
  };

  const hasRole = (roles: Role[]) => !!user && roles.includes(user.role);

  return (
    <AuthCtx.Provider value={{ user, token, ready, login, logout, hasRole }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth harus berada di dalam AuthProvider");
  return v;
}

export const ROLE_LABELS: Record<Role, string> = {
  operator: "Operator Sortasi",
  supervisor: "Supervisor QC",
  owner: "Pemilik (Owner)",
};

export const ROLE_COLORS: Record<Role, string> = {
  operator: "bg-blue-50 text-blue-700 border-blue-200",
  supervisor: "bg-violet-50 text-violet-700 border-violet-200",
  owner: "bg-amber-50 text-amber-700 border-amber-200",
};
