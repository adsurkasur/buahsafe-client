import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { FormEvent, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { KeyRound, UserMinus, UserPlus, Sprout, Trash2, Cpu, Unplug, PlugZap, Coins, Plus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageLayout } from "@/components/buahsafe/Layout";
import { DeviceStatus, EmptyState, SkeletonRows, Tip } from "@/components/buahsafe/ui";
import { apiFetch } from "@/lib/api";
import { ROLE_LABELS, Role, useAuth } from "@/lib/auth";
import {
  calculatePricingSummary,
  DEFAULT_GRADE_PRICING,
  Device,
  DeviceStatusInfo,
  fetchDeviceStatus,
  fetchGradePricing,
  GradePricingConfig,
  saveGradePricing,
  setDeviceEnabled,
  syncDevices,
} from "@/lib/buahsafe-data";

export type SettingsTab = "pengguna" | "petani" | "tarif" | "perangkat";

const TABS: ReadonlyArray<{ id: SettingsTab; label: string; icon: typeof UserPlus }> = [
  { id: "pengguna", label: "Pengguna", icon: UserPlus },
  { id: "petani", label: "Petani mitra", icon: Sprout },
  { id: "tarif", label: "Tarif & grade", icon: Coins },
  { id: "perangkat", label: "Perangkat", icon: Cpu },
];

export const Route = createFileRoute("/pengaturan")({
  validateSearch: zodValidator(
    z.object({
      tab: fallback(z.enum(["pengguna", "petani", "tarif", "perangkat"]), "pengguna").default("pengguna"),
    }),
  ),
  component: PengaturanPage,
});

const input = "w-full h-11 px-3 rounded-xl border border-input bg-background text-sm";
const primaryBtn = "h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50";
const ghostBtn = "h-10 px-3 rounded-xl border border-border hover:bg-accent text-sm font-semibold inline-flex items-center gap-2";

function PengaturanPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: "/pengaturan" });
  return (
    <PageLayout title="Pengaturan" subtitle="Kelola akun pengguna, data petani mitra, skema tarif & grade, dan alat pemindai." roles={["owner"]}>
      <div className="flex gap-1 p-1 mb-6 rounded-2xl bg-secondary w-full sm:w-fit overflow-x-auto" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => navigate({ search: { tab: t.id }, replace: true })}
            className={`flex-1 sm:flex-none h-11 px-3 sm:px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap ${
              tab === t.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4 hidden sm:block" /> {t.label}
          </button>
        ))}
      </div>
      {tab === "pengguna" && <UsersTab />}
      {tab === "petani" && <PetaniTab />}
      {tab === "tarif" && <TarifGradeTab />}
      {tab === "perangkat" && <DeviceTab />}
    </PageLayout>
  );
}

// ---------------- Pengguna ----------------

interface UserItem {
  id: string;
  username: string;
  name: string;
  role: Role;
  last_login?: string;
}

function UsersTab() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserItem[] | null>(null);
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "operator" as Role });
  const [saving, setSaving] = useState(false);
  const [resetFor, setResetFor] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deactivate, setDeactivate] = useState<UserItem | null>(null);

  const load = () => apiFetch<{ users: UserItem[] }>("api/users").then((r) => r.ok && setUsers(r.data?.users ?? []));
  useEffect(() => {
    load();
  }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Kata sandi minimal 6 karakter");
      return;
    }
    setSaving(true);
    const res = await apiFetch<{ user: UserItem }>("api/users", {
      method: "POST",
      body: JSON.stringify({ ...form, name: form.name.trim(), username: form.username.trim().toLowerCase() }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Akun belum dibuat", { description: res.error });
      return;
    }
    toast.success(`Akun ${res.data?.user.username} dibuat`);
    setForm({ name: "", username: "", password: "", role: "operator" });
    load();
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetFor) return;
    if (newPassword.length < 6) {
      toast.error("Kata sandi minimal 6 karakter");
      return;
    }
    const res = await apiFetch(`api/users/${resetFor.id}/password`, { method: "PUT", body: JSON.stringify({ password: newPassword }) });
    if (!res.ok) {
      toast.error("Kata sandi belum diubah", { description: res.error });
      return;
    }
    toast.success(`Kata sandi ${resetFor.username} diubah`);
    setResetFor(null);
    setNewPassword("");
  };

  const confirmDeactivate = async () => {
    if (!deactivate) return;
    const res = await apiFetch(`api/users/${deactivate.id}`, { method: "DELETE" });
    if (!res.ok) toast.error("Akun belum dinonaktifkan", { description: res.error });
    else toast.success(`Akun ${deactivate.username} dinonaktifkan`);
    setDeactivate(null);
    load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
      <section className="rounded-2xl bg-card border border-border">
        <h2 className="px-5 pt-5 pb-2 font-bold">Akun aktif</h2>
        {!users && <div className="px-5 pb-5"><SkeletonRows rows={3} className="h-16" /></div>}
        <ul>
          {users?.map((u) => {
            const self = u.id === me?.id;
            return (
              <li key={u.id} data-testid="user-row" className="flex flex-wrap items-center gap-3 px-5 py-4 border-t border-border">
                <div className="flex-1 min-w-[180px]">
                  <div className="font-semibold">
                    {u.name} {self && <span className="ml-1 text-xs font-semibold text-primary">(Anda)</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {ROLE_LABELS[u.role] ?? u.role}, nama pengguna <span className="font-semibold text-foreground">{u.username}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {u.last_login ? `Terakhir masuk ${formatDistanceToNow(new Date(u.last_login), { addSuffix: true })}` : "Belum pernah masuk"}
                  </div>
                </div>
                <button onClick={() => { setResetFor(u); setNewPassword(""); }} className={ghostBtn}>
                  <KeyRound className="w-4 h-4" /> Ubah sandi
                </button>
                {!self && (
                  <button onClick={() => setDeactivate(u)} className={`${ghostBtn} text-reject`} aria-label={`Nonaktifkan ${u.username}`}>
                    <UserMinus className="w-4 h-4" /> Nonaktifkan
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <form onSubmit={create} className="rounded-2xl bg-card border border-border p-5 space-y-3">
        <h2 className="font-bold">Tambah pengguna</h2>
        <label className="block text-sm font-medium">Nama lengkap
          <input required className={`${input} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block text-sm font-medium">Nama pengguna
          <input required className={`${input} mt-1`} autoCapitalize="none" spellCheck={false} autoComplete="off" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </label>
        <label className="block text-sm font-medium">Kata sandi awal
          <input required type="password" minLength={6} className={`${input} mt-1`} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <span className="text-xs text-muted-foreground">Minimal 6 karakter. Sampaikan langsung kepada pemilik akun.</span>
        </label>
        <label className="block text-sm font-medium">Peran
          <select className={`${input} mt-1`} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            <option value="operator">Operator sortasi (hanya antrean)</option>
            <option value="supervisor">Supervisor QC (ringkasan, riwayat, label)</option>
            <option value="owner">Pemilik (semua menu)</option>
          </select>
        </label>
        <button type="submit" disabled={saving} className={`${primaryBtn} w-full`}>
          <UserPlus className="w-5 h-5" /> Buat akun
        </button>
      </form>

      <Dialog open={!!resetFor} onOpenChange={(o) => !o && setResetFor(null)}>
        <DialogContent>
          <form onSubmit={savePassword}>
            <DialogHeader>
              <DialogTitle>Ubah kata sandi</DialogTitle>
              <DialogDescription>Akun {resetFor?.name} ({resetFor?.username}) akan keluar dari semua perangkat.</DialogDescription>
            </DialogHeader>
            <label className="block mt-4 text-sm font-medium">Kata sandi baru
              <input autoFocus type="password" minLength={6} className={`${input} mt-1`} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </label>
            <DialogFooter className="mt-5">
              <button type="button" onClick={() => setResetFor(null)} className={ghostBtn}>Batal</button>
              <button type="submit" className={primaryBtn}>Simpan kata sandi</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deactivate} onOpenChange={(o) => !o && setDeactivate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nonaktifkan {deactivate?.username}?</DialogTitle>
            <DialogDescription>Akun tidak bisa masuk lagi. Riwayat pindaian tetap tersimpan.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <button onClick={() => setDeactivate(null)} className={ghostBtn}>Batal</button>
            <button onClick={confirmDeactivate} className={`${primaryBtn} bg-reject text-reject-ink`}>Nonaktifkan</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------- Petani mitra ----------------

interface Petani {
  id: string;
  name: string;
  village: string;
  phone: string;
  joined: string;
}

function PetaniTab() {
  const [list, setList] = useState<Petani[] | null>(null);
  const [form, setForm] = useState({ name: "", village: "", phone: "" });
  const [remove, setRemove] = useState<Petani | null>(null);

  const load = () => apiFetch<{ petani: Petani[] }>("api/master-data/petani").then((r) => r.ok && setList(r.data?.petani ?? []));
  useEffect(() => {
    load();
  }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const res = await apiFetch("api/master-data/petani", { method: "POST", body: JSON.stringify(form) });
    if (!res.ok) {
      toast.error("Petani belum tersimpan", { description: res.error });
      return;
    }
    toast.success(`${form.name} ditambahkan`);
    setForm({ name: "", village: "", phone: "" });
    load();
  };

  const confirmRemove = async () => {
    if (!remove) return;
    const res = await apiFetch(`api/master-data/petani/${remove.id}`, { method: "DELETE" });
    if (!res.ok) toast.error("Petani belum dihapus", { description: res.error });
    setRemove(null);
    load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
      <section className="rounded-2xl bg-card border border-border">
        <h2 className="px-5 pt-5 pb-2 font-bold">Petani mitra</h2>
        {!list ? (
          <div className="px-5 pb-5"><SkeletonRows rows={3} className="h-16" /></div>
        ) : list.length ? (
          <ul>
            {list.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-4 border-t border-border">
                <div className="flex-1 min-w-[180px]">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{[p.village, p.phone].filter((v) => v && v !== "—").join(", ") || "Tanpa alamat/kontak"}</div>
                </div>
                {p.phone && p.phone !== "—" && (
                  <a className={ghostBtn} href={`https://wa.me/${p.phone.replace(/\D/g, "").replace(/^0/, "62")}`} target="_blank" rel="noreferrer">WhatsApp</a>
                )}
                <button onClick={() => setRemove(p)} className={`${ghostBtn} text-reject`} aria-label={`Hapus ${p.name}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-5 pt-0"><EmptyState title="Belum ada petani mitra">Tambahkan petani yang memasok buah ke rumah sortir.</EmptyState></div>
        )}
      </section>

      <form onSubmit={add} className="rounded-2xl bg-card border border-border p-5 space-y-3">
        <h2 className="font-bold">Tambah petani mitra</h2>
        <label className="block text-sm font-medium">Nama petani atau kelompok tani
          <input required className={`${input} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block text-sm font-medium">Desa / kecamatan
          <input className={`${input} mt-1`} value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} />
        </label>
        <label className="block text-sm font-medium">Nomor telepon / WhatsApp
          <input inputMode="tel" className={`${input} mt-1`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </label>
        <button type="submit" className={`${primaryBtn} w-full`}><Sprout className="w-5 h-5" /> Tambah petani</button>
      </form>

      <Dialog open={!!remove} onOpenChange={(o) => !o && setRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus {remove?.name}?</DialogTitle>
            <DialogDescription>Data petani ini dihapus dari daftar mitra.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <button onClick={() => setRemove(null)} className={ghostBtn}>Batal</button>
            <button onClick={confirmRemove} className={`${primaryBtn} bg-reject text-reject-ink`}>Hapus</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------- Tarif & grade ----------------

function TarifGradeTab() {
  const [config, setConfig] = useState<GradePricingConfig>(DEFAULT_GRADE_PRICING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchGradePricing().then((p) => {
      setConfig(p);
      setLoading(false);
    });
  }, []);

  const summary = calculatePricingSummary(config);

  const updateGrade = (index: number, patch: Partial<{ name: string; price: number }>) => {
    setSavedNotice(null);
    setConfig((prev) => ({
      ...prev,
      grades: prev.grades.map((g, i) => (i === index ? { ...g, ...patch } : g)),
    }));
  };

  const addGrade = () => {
    setSavedNotice(null);
    const nextLetter = String.fromCharCode(65 + config.grades.length);
    setConfig((prev) => ({
      ...prev,
      grades: [
        ...prev.grades,
        {
          id: `grade-${Date.now()}`,
          name: `Grade ${nextLetter}`,
          price: 10000,
        },
      ],
    }));
  };

  const removeGrade = (index: number) => {
    if (config.grades.length <= 1) return;
    setSavedNotice(null);
    setConfig((prev) => ({
      ...prev,
      grades: prev.grades.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const cleanedGrades = config.grades
      .map((g, idx) => ({
        id: g.id || `grade-${idx + 1}`,
        name: g.name.trim() || `Grade ${idx + 1}`,
        price: Math.max(0, Number(g.price) || 0),
      }))
      .filter((g) => g.name.length > 0);

    if (cleanedGrades.length === 0) {
      toast.error("Minimal harus ada 1 grade komersial");
      return;
    }

    const payload: GradePricingConfig = {
      unit: config.unit,
      avg_weight_g: Math.min(2000, Math.max(50, Number(config.avg_weight_g) || 300)),
      grades: cleanedGrades,
      afkir_price: Math.max(0, Number(config.afkir_price) || 0),
    };

    setSaving(true);
    const res = await saveGradePricing(payload);
    setSaving(false);

    if (!res.ok) {
      toast.error("Skema harga belum tersimpan", { description: res.error });
      return;
    }

    if (res.data?.pricing) {
      setConfig(res.data.pricing);
    } else {
      setConfig(payload);
    }
    setSavedNotice("Skema harga berhasil disimpan dan diterapkan ke perhitungan Analitik.");
    toast.success("Skema harga berhasil disimpan");
  };

  if (loading) {
    return <SkeletonRows rows={3} className="h-32" />;
  }

  return (
    <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
      <div className="space-y-6">
        {/* Bagian 1 — Basis Satuan Harga */}
        <section className="rounded-2xl bg-card border border-border p-5 space-y-4">
          <div>
            <h2 className="font-bold">1. Basis Satuan Harga</h2>
            <p className="text-sm text-muted-foreground">
              Pilih satuan harga jual yang berlaku di rumah sortir Anda.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Satuan harga acuan
              <select
                className={`${input} mt-1`}
                value={config.unit}
                onChange={(e) => {
                  setSavedNotice(null);
                  setConfig({ ...config, unit: e.target.value as "kg" | "butir" });
                }}
              >
                <option value="kg">Rp / kg (Per Kilogram)</option>
                <option value="butir">Rp / butir (Per Buah)</option>
              </select>
            </label>

            {config.unit === "kg" && (
              <label className="block text-sm font-medium">
                Bobot rata-rata per butir (gram)
                <input
                  type="number"
                  min={50}
                  max={2000}
                  step={10}
                  required
                  className={`${input} mt-1 tabular`}
                  value={config.avg_weight_g}
                  onChange={(e) => {
                    setSavedNotice(null);
                    setConfig({ ...config, avg_weight_g: Number(e.target.value) });
                  }}
                />
                <span className="block text-xs text-muted-foreground mt-1">
                  Konversi otomatis: {config.avg_weight_g || 300} g ={" "}
                  {summary.weightKgPerFruit.toLocaleString("id-ID")} kg/butir (rentang 50–2000 g).
                </span>
              </label>
            )}
          </div>
        </section>

        {/* Bagian 2 — Daftar Grade Komersial (Non-Afkir) Kustom */}
        <section className="rounded-2xl bg-card border border-border p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold">2. Daftar Grade Komersial (Non-Afkir)</h2>
              <p className="text-sm text-muted-foreground">
                Atur jumlah dan nama grade buah layak jual di gudang (mis. Grade Super, Grade A, Grade B, Grade C).
              </p>
            </div>
            <button type="button" onClick={addGrade} className={ghostBtn}>
              <Plus className="w-4 h-4" /> + Tambah grade
            </button>
          </div>

          <div className="space-y-3">
            {config.grades.map((g, idx) => (
              <div
                key={g.id || idx}
                data-testid="grade-row"
                className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto] items-end p-3 rounded-xl border border-border bg-secondary/30"
              >
                <label className="block text-xs font-semibold text-muted-foreground">
                  Nama Grade
                  <input
                    type="text"
                    required
                    placeholder="Mis. Grade A"
                    className={`${input} mt-1 text-foreground font-medium`}
                    value={g.name}
                    onChange={(e) => updateGrade(idx, { name: e.target.value })}
                  />
                </label>
                <label className="block text-xs font-semibold text-muted-foreground">
                  Harga Acuan (Rp / {config.unit})
                  <input
                    type="number"
                    min={0}
                    step={100}
                    required
                    className={`${input} mt-1 text-foreground font-semibold tabular`}
                    value={g.price}
                    onChange={(e) => updateGrade(idx, { price: Number(e.target.value) })}
                  />
                </label>
                <button
                  type="button"
                  disabled={config.grades.length <= 1}
                  onClick={() => removeGrade(idx)}
                  aria-label={`Hapus ${g.name || `Grade ${idx + 1}`}`}
                  className={`${ghostBtn} h-11 text-reject disabled:opacity-40 disabled:pointer-events-none justify-center`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Bagian 3 — Harga Afkir / Nilai Sisa */}
        <section className="rounded-2xl bg-card border border-border p-5 space-y-3">
          <div>
            <h2 className="font-bold">3. Harga Afkir / Nilai Sisa</h2>
            <p className="text-sm text-muted-foreground">
              Nilai jual sisa untuk buah anomali/afkir (mis. Rp 3.000 untuk pakan/olahan murah, atau Rp 0 jika dibuang).
            </p>
          </div>
          <label className="block text-sm font-medium max-w-xs">
            Harga Afkir / Nilai Sisa (Rp / {config.unit})
            <input
              type="number"
              min={0}
              step={100}
              required
              className={`${input} mt-1 tabular font-semibold`}
              value={config.afkir_price}
              onChange={(e) => {
                setSavedNotice(null);
                setConfig({ ...config, afkir_price: Number(e.target.value) });
              }}
            />
          </label>
        </section>
      </div>

      {/* Bagian 4 — Ringkasan Kalkulasi Otomatis */}
      <section className="rounded-2xl bg-card border border-border p-5 space-y-4 sticky top-6">
        <div>
          <h2 className="font-bold">4. Ringkasan Kalkulasi Otomatis</h2>
          <p className="text-sm text-muted-foreground">
            Digunakan untuk menghitung Estimasi Nilai Risiko Kerugian yang Dicegah di halaman Analitik.
          </p>
        </div>

        <dl className="space-y-3 text-sm border-t border-border pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Rata-rata Harga Grade Komersial</dt>
            <dd className="font-bold tabular text-right">
              Rp {summary.avgCommercialPrice.toLocaleString("id-ID")} / {config.unit}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Selisih Nilai Risiko Tertahan</dt>
            <dd className="font-bold tabular text-right">
              Rp {summary.deltaPerUnit.toLocaleString("id-ID")} / {config.unit}
            </dd>
          </div>
          <div className="rounded-xl bg-pass/15 border border-pass/30 p-3.5 mt-2">
            <dt className="text-xs font-semibold text-muted-foreground">
              Estimasi Kerugian Terselamatkan per 1 Buah Anomali Tertahan
            </dt>
            <dd className="text-xl font-extrabold tabular text-foreground mt-1">
              Rp {summary.savedPerAnomalyFruitRp.toLocaleString("id-ID")} / butir
            </dd>
          </div>
        </dl>

        {savedNotice && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl bg-pass/15 border border-pass/30 px-3 py-2.5 text-xs font-medium text-foreground"
          >
            <CheckCircle2 className="w-4 h-4 text-pass shrink-0 mt-0.5" />
            <span>{savedNotice}</span>
          </div>
        )}

        <button type="submit" disabled={saving} className={`${primaryBtn} w-full`}>
          <Coins className="w-4 h-4" />
          {saving ? "Menyimpan…" : "Simpan skema harga"}
        </button>
      </section>
    </form>
  );
}

// ---------------- Perangkat ----------------

function DeviceTab() {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [status, setStatus] = useState<DeviceStatusInfo | null>(null);
  const [confirm, setConfirm] = useState(false);
  const enabled = status?.enabled !== false;
  const refresh = () => fetchDeviceStatus().then(setStatus);
  useEffect(() => {
    syncDevices().then(setDevices);
    refresh();
    const i = setInterval(refresh, 5000);
    return () => clearInterval(i);
  }, []);

  const toggle = async () => {
    const res = await setDeviceEnabled(!enabled);
    setConfirm(false);
    if (!res.ok) return toast.error("Status alat belum berubah", { description: res.error });
    toast.success(enabled ? "Alat diputus" : "Alat disambungkan kembali", {
      description: enabled ? "Server menolak data dari alat sampai disambungkan lagi." : "Alat terhubung lagi pada detak berikutnya (paling lama 10 detik).",
    });
    refresh();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2 items-start">
      {!devices && <SkeletonRows rows={1} className="h-64" />}
      {devices?.map((d) => (
        <section key={d.id} className="rounded-2xl bg-card border border-border p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold">{d.name}</h2>
              <div className="text-sm text-muted-foreground">{d.id}, {d.location}</div>
            </div>
            <DeviceStatus connected={status?.connected} simulator={!!status?.firmware?.startsWith("sim")} enabled={enabled} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted-foreground">Firmware</dt><dd className="font-semibold">{status?.firmware ?? d.firmwareVersion}</dd></div>
            <div><dt className="text-muted-foreground">Total pindaian</dt><dd className="font-semibold tabular">{d.totalScans.toLocaleString("id-ID")}</dd></div>
            <div><dt className="text-muted-foreground">Sinyal WiFi</dt><dd className="font-semibold">{status?.rssi ? `${status.rssi} dBm` : "—"}</dd></div>
            <div><dt className="text-muted-foreground">Mode</dt><dd className="font-semibold">{status?.mode === "conveyor" ? "Conveyor (PIR)" : status?.mode ?? "—"}</dd></div>
          </dl>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Tip label={enabled ? "Server berhenti menerima data dari alat ini (asli maupun simulator). Bisa disambungkan lagi kapan saja." : "Izinkan alat mengirim data lagi"}>
              <button
                onClick={() => (enabled ? setConfirm(true) : toggle())}
                className={enabled ? `${ghostBtn} h-11 text-reject` : primaryBtn}
              >
                {enabled ? <Unplug className="w-4 h-4" /> : <PlugZap className="w-4 h-4" />}
                {enabled ? "Putuskan alat" : "Sambungkan alat"}
              </button>
            </Tip>
          </div>
        </section>
      ))}

      <section className="rounded-2xl bg-card border border-border p-5">
        <h2 className="font-bold">Cara memasang alat</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sistem ini melayani <strong className="text-foreground">satu alat</strong>. Alat tidak ditambahkan dari halaman ini:
          alat tersambung sendiri ke server begitu firmware dan WiFi-nya benar. Menambah alat kedua memerlukan
          pembaruan server oleh tim BuahSafe.
        </p>
        <ol className="mt-4 space-y-3 text-sm list-decimal pl-5">
          <li>Tim BuahSafe memasang firmware ke ESP32 dengan kunci perangkat yang sama dengan server.</li>
          <li>
            Nyalakan alat. Bila belum mengenal WiFi, alat membuat hotspot <strong>BuahSafe-Setup</strong>. Sambungkan HP
            ke hotspot itu, pilih WiFi rumah sortir, lalu masukkan kata sandinya. Kata sandi hotspot diberikan tim BuahSafe.
          </li>
          <li>Layar LCD alat menampilkan "BuahSafe siap" dan status di atas berubah menjadi <strong>Alat terhubung</strong> dalam 10 detik.</li>
          <li>Jalankan belt dan lewatkan satu buah: hasilnya muncul di halaman Antrean.</li>
        </ol>
        <p className="mt-4 text-xs text-muted-foreground">
          Bila status tetap "Alat tidak terhubung": periksa listrik alat, jangkauan WiFi, dan pastikan alat tidak sedang diputus di sini.
        </p>
      </section>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Putuskan alat?</DialogTitle>
            <DialogDescription>
              Selama diputus, buah yang lewat conveyor tidak dinilai dan layar Antrean tidak bertambah. Data lama tetap tersimpan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <button onClick={() => setConfirm(false)} className={ghostBtn}>Batal</button>
            <button onClick={toggle} className={`${primaryBtn} bg-reject text-reject-ink`}>Putuskan</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
