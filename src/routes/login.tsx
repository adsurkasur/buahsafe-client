import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf, Loader2, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

const REMEMBERED_USER_KEY = "buahsafe.remembered_user";

function LoginPage() {
  const { user, login, ready } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberUser, setRememberUser] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(REMEMBERED_USER_KEY);
      if (savedUser) {
        setUsername(savedUser);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (ready && user) {
      navigate({ to: user.role === "operator" ? "/scan" : "/" });
    }
  }, [ready, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanU = username.trim();
    if (!cleanU || !password.trim()) {
      setError("Nama pengguna dan kata sandi wajib diisi");
      return;
    }
    setLoading(true);
    setError("");

    if (rememberUser) {
      try {
        localStorage.setItem(REMEMBERED_USER_KEY, cleanU);
      } catch {}
    } else {
      try {
        localStorage.removeItem(REMEMBERED_USER_KEY);
      } catch {}
    }

    const r = await login(cleanU, password);
    setLoading(false);
    if (!r.ok) {
      setError(r.error || "Nama pengguna atau kata sandi tidak cocok");
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header Identitas Aplikasi */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center mb-3 shadow-xs">
            <Leaf className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="font-bold tracking-tight text-2xl text-foreground">BuahSafe</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Sistem Inspeksi Mutu Spektral Nir-Destruktif Jambu Kristal
          </p>
        </div>

        {/* Card Formulir Masuk */}
        <div className="rounded-xl border border-border bg-card shadow-sm p-7">
          <div className="mb-6">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Masuk ke Sistem</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Gunakan akun resmi stasiun kerja Anda untuk memulai operasional.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-xs font-medium text-foreground mb-1.5">
                Nama Pengguna
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan nama pengguna"
                className="w-full h-10 px-3.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
                autoComplete="username"
                autoFocus={!username}
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-medium text-foreground">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akun"
                  className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberUser}
                  onChange={(e) => setRememberUser(e.target.checked)}
                  className="rounded border-input text-emerald-600 focus:ring-emerald-500/20 h-4 w-4"
                />
                <span className="text-xs text-muted-foreground">Ingat nama pengguna di perangkat ini</span>
              </label>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Memverifikasi Kredensial…" : "Masuk ke Sistem"}
            </button>
          </form>

          {/* Informasi Keamanan & Bantuan Operasional */}
          <div className="mt-6 pt-5 border-t border-border flex items-start gap-2.5 text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              Kata sandi disimpan sebagai hash PBKDF2, tidak pernah dalam bentuk asli. Akun pengguna dan pengaturan hak akses dikelola oleh Pemilik (Owner) melalui menu Data Master.
            </div>
          </div>
        </div>

        {/* Footer info stasiun */}
        <div className="text-center mt-6 text-xs text-muted-foreground">
          BuahSafe v1.0 Production Edition • Hak Cipta Terpelihara
        </div>
      </div>
    </div>
  );
}
