import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { BrandMark } from "@/components/buahsafe/ui";

export const Route = createFileRoute("/login")({ component: LoginPage });

const REMEMBERED_USER_KEY = "buahsafe.remembered_user";

function LoginPage() {
  const { user, login, ready } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(() => {
    try {
      return localStorage.getItem(REMEMBERED_USER_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Operator langsung ke layar antrean; supervisor dan pemilik ke ringkasan
    if (ready && user) navigate({ to: user.role === "operator" ? "/antrean" : "/" });
  }, [ready, user, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Isi nama pengguna dan kata sandi.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (remember) localStorage.setItem(REMEMBERED_USER_KEY, username.trim());
      else localStorage.removeItem(REMEMBERED_USER_KEY);
    } catch {}
    const r = await login(username.trim(), password);
    setLoading(false);
    if (!r.ok) setError(r.error || "Nama pengguna atau kata sandi tidak cocok.");
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-[1.1fr_1fr] bg-background">
      <section className="hidden lg:flex relative overflow-hidden bg-leaf text-primary-foreground p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <BrandMark className="w-10 h-10" />
          <span className="text-xl font-extrabold tracking-tight">BuahSafe</span>
        </div>
        <BrandMark className="absolute -right-28 top-[8%] w-[460px] h-[460px] opacity-90" />
        <div className="relative max-w-md">
          <h1 className="text-[44px] font-extrabold leading-[1.05] tracking-tight">Sortasi jambu kristal tanpa membelah buah.</h1>
          <p className="mt-4 text-lg opacity-85">
            Cahaya Vis-NIR menembus buah di atas conveyor, model menilai isinya, dan operator mendapat arahan keranjang
            dalam hitungan detik.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <BrandMark className="w-11 h-11" />
            <div>
              <div className="text-2xl font-extrabold tracking-tight leading-none">BuahSafe</div>
              <div className="text-sm text-muted-foreground mt-1">Sortasi jambu kristal</div>
            </div>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">Masuk</h2>
          <p className="mt-1 text-muted-foreground">Gunakan akun yang diberikan Pemilik rumah sortir.</p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <label className="block text-sm font-semibold" htmlFor="login-username">Nama pengguna</label>
            <input
              id="login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus={!username}
              disabled={loading}
              className="w-full h-12 px-4 -mt-2 rounded-xl border border-input bg-card text-base"
            />
            <label className="block text-sm font-semibold" htmlFor="login-password">Kata sandi</label>
            <div className="relative -mt-2">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                autoFocus={!!username}
                disabled={loading}
                className="w-full h-12 pl-4 pr-12 rounded-xl border border-input bg-card text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <label className="flex items-center gap-3 text-sm text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-5 h-5 accent-[var(--color-primary)]" />
              Ingat nama pengguna di perangkat ini
            </label>

            {error && (
              <div role="alert" className="flex items-start gap-2.5 p-3 rounded-xl bg-reject/10 border border-reject/30 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 text-reject" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-base font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? "Memeriksa…" : "Masuk"}
            </button>
          </form>

          <p className="mt-8 text-xs text-muted-foreground leading-relaxed">
            Lupa kata sandi? Hubungi Pemilik untuk mengatur ulang lewat menu Pengaturan.
          </p>
        </div>
      </section>
    </div>
  );
}
