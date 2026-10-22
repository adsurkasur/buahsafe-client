import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Users, Sprout, KeyRound, Shield, AlertCircle, CheckCircle2, X } from "lucide-react";
import { PageLayout } from "@/components/buahsafe/Layout";
import { ROLE_LABELS, ROLE_COLORS, Role, useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/master-data")({ component: MasterDataPage });

interface Petani {
  id: string;
  name: string;
  village: string;
  phone: string;
  joined: string;
}

interface UserItem {
  id: string;
  username: string;
  name: string;
  role: Role;
  is_active: number;
  last_login?: string;
  created_at?: string;
}

function MasterDataPage() {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<"petani" | "users">("petani");

  // State Petani
  const [petani, setPetani] = useState<Petani[]>([]);
  const [formPetani, setFormPetani] = useState({ name: "", village: "", phone: "" });
  const [petaniError, setPetaniError] = useState("");

  // State Pengguna Sistem
  const [users, setUsers] = useState<UserItem[]>([]);
  const [formUser, setFormUser] = useState({
    name: "",
    username: "",
    password: "",
    role: "operator" as Role,
  });
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");

  // Modal Reset Password
  const [resetModalUser, setResetModalUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState<{ type: "err" | "ok"; text: string } | null>(null);

  const loadPetani = async () => {
    const res = await apiFetch<{ petani: Petani[] }>("api/master-data/petani", { timeoutMs: 3000 });
    if (res.ok && Array.isArray(res.data?.petani)) {
      setPetani(res.data.petani);
      setPetaniError("");
    } else {
      setPetaniError(res.error || "Data petani mitra gagal dimuat dari server");
    }
  };

  const loadUsers = async () => {
    const res = await apiFetch<{ users: UserItem[] }>("api/users", { timeoutMs: 3000 });
    if (res.ok && Array.isArray(res.data?.users)) {
      setUsers(res.data.users);
    }
  };

  useEffect(() => {
    loadPetani();
    loadUsers();
  }, []);

  const addPetani = async () => {
    if (!formPetani.name.trim()) return;

    const res = await apiFetch<{ petani: Petani }>("api/master-data/petani", {
      method: "POST",
      body: JSON.stringify(formPetani),
      timeoutMs: 3000,
    });

    if (!res.ok || !res.data?.petani) {
      setPetaniError(res.error || "Petani mitra gagal disimpan. Data belum tercatat di server.");
      return;
    }
    setPetaniError("");
    setPetani([res.data.petani, ...petani]);
    setFormPetani({ name: "", village: "", phone: "" });
  };

  const delPetani = async (p: Petani) => {
    if (!confirm(`Hapus petani mitra "${p.name}" dari daftar?`)) return;
    const res = await apiFetch(`api/master-data/petani/${p.id}`, { method: "DELETE", timeoutMs: 3000 });
    if (!res.ok) {
      setPetaniError(res.error || "Petani mitra gagal dihapus");
      return;
    }
    setPetaniError("");
    setPetani(petani.filter((x) => x.id !== p.id));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");
    setUserSuccess("");

    if (!formUser.name.trim() || !formUser.username.trim() || !formUser.password.trim()) {
      setUserError("Seluruh kolom formulir pengguna wajib diisi");
      return;
    }
    if (formUser.password.length < 6) {
      setUserError("Kata sandi minimal 6 karakter");
      return;
    }

    const res = await apiFetch<{ ok: boolean; user: UserItem }>("api/users", {
      method: "POST",
      body: JSON.stringify({
        name: formUser.name.trim(),
        username: formUser.username.trim().toLowerCase(),
        password: formUser.password,
        role: formUser.role,
      }),
      timeoutMs: 4000,
    });

    if (res.ok && res.data?.user) {
      setUserSuccess(`Akun untuk "${res.data.user.name}" (${res.data.user.username}) berhasil dibuat.`);
      setFormUser({ name: "", username: "", password: "", role: "operator" });
      loadUsers();
    } else {
      setUserError(res.error || "Gagal membuat pengguna baru");
    }
  };

  const handleDeactivateUser = async (user: UserItem) => {
    if (user.id === currentUser?.id) {
      alert("Anda tidak dapat menonaktifkan akun yang sedang aktif digunakan.");
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan akun "${user.name}" (${user.username})?`)) {
      return;
    }

    const res = await apiFetch(`api/users/${user.id}`, {
      method: "DELETE",
      timeoutMs: 4000,
    });

    if (res.ok) {
      loadUsers();
    } else {
      alert(res.error || "Gagal menonaktifkan akun");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    setResetMsg(null);

    if (newPassword.length < 6) {
      setResetMsg({ type: "err", text: "Kata sandi baru minimal 6 karakter" });
      return;
    }

    const res = await apiFetch(`api/users/${resetModalUser.id}/password`, {
      method: "PUT",
      body: JSON.stringify({ password: newPassword }),
      timeoutMs: 4000,
    });

    if (res.ok) {
      setResetMsg({ type: "ok", text: "Kata sandi berhasil diperbarui." });
      setTimeout(() => {
        setResetModalUser(null);
        setNewPassword("");
        setResetMsg(null);
      }, 1200);
    } else {
      setResetMsg({ type: "err", text: res.error || "Gagal memperbarui kata sandi" });
    }
  };

  return (
    <PageLayout
      title="Data Master"
      subtitle="Kelola data petani mitra penyuplai buah dan akun pengguna sistem"
      roles={["owner"]}
    >
      <div className="flex gap-1 p-1 rounded-lg border border-border bg-card w-fit mb-5">
        <button
          onClick={() => setTab("petani")}
          className={`px-4 py-1.5 rounded-md text-sm inline-flex items-center gap-2 font-medium transition-colors ${
            tab === "petani" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sprout className="w-4 h-4" /> Petani Mitra
        </button>
        <button
          onClick={() => {
            setTab("users");
            loadUsers();
          }}
          className={`px-4 py-1.5 rounded-md text-sm inline-flex items-center gap-2 font-medium transition-colors ${
            tab === "users" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-4 h-4" /> Pengguna Sistem
        </button>
      </div>

      {tab === "petani" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-semibold text-sm mb-3">Tambah Petani Mitra</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                placeholder="Nama Petani / Kelompok Tani"
                value={formPetani.name}
                onChange={(e) => setFormPetani({ ...formPetani, name: e.target.value })}
                className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                placeholder="Desa / Kecamatan (cth. Bumiaji)"
                value={formPetani.village}
                onChange={(e) => setFormPetani({ ...formPetani, village: e.target.value })}
                className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                placeholder="Nomor Telepon / WhatsApp"
                value={formPetani.phone}
                onChange={(e) => setFormPetani({ ...formPetani, phone: e.target.value })}
                className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={addPetani}
                className="h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" /> Tambah Mitra
              </button>
            </div>
          </div>

          {petaniError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{petaniError}</span>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nama Petani</th>
                  <th className="px-4 py-3 text-left font-medium">Desa / Lokasi Kebun</th>
                  <th className="px-4 py-3 text-left font-medium">Kontak</th>
                  <th className="px-4 py-3 text-left font-medium">Bergabung Sejak</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {petani.map((p) => (
                  <tr key={p.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.village}</td>
                    <td className="px-4 py-3 tabular-nums font-mono text-xs">
                      {p.phone && p.phone !== "—" ? (
                        <a
                          href={`https://wa.me/${p.phone.replace(/\D/g, "").replace(/^0/, "62")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                          title="Hubungi via WhatsApp"
                        >
                          {p.phone}
                        </a>
                      ) : (
                        "Belum ada"
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground font-mono text-xs">{p.joined}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => delPetani(p)}
                        className="w-7 h-7 rounded-md hover:bg-rose-50 text-rose-600 inline-flex items-center justify-center transition-colors"
                        title="Hapus petani mitra"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-6">
          {/* Form Buat Pengguna Baru */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm">Tambah Pengguna Baru</h3>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Nama Lengkap</label>
                  <input
                    placeholder="Contoh: Pak Joko Sortasi"
                    value={formUser.name}
                    onChange={(e) => setFormUser({ ...formUser, name: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Nama Pengguna</label>
                  <input
                    placeholder="Contoh: joko_sortasi"
                    value={formUser.username}
                    onChange={(e) => setFormUser({ ...formUser, username: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Kata Sandi Awal</label>
                  <input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={formUser.password}
                    onChange={(e) => setFormUser({ ...formUser, password: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Peran Hak Akses</label>
                  <select
                    value={formUser.role}
                    onChange={(e) => setFormUser({ ...formUser, role: e.target.value as Role })}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="operator">Operator Sortasi</option>
                    <option value="supervisor">Supervisor QC</option>
                    <option value="owner">Pemilik (Owner)</option>
                  </select>
                </div>
              </div>

              {userError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{userError}</span>
                </div>
              )}
              {userSuccess && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{userSuccess}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="h-10 px-5 rounded-lg bg-emerald-600 text-white font-medium text-sm inline-flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Daftarkan Pengguna
                </button>
              </div>
            </form>
          </div>

          {/* Tabel Pengguna Aktif */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nama Lengkap</th>
                  <th className="px-4 py-3 text-left font-medium">Nama Pengguna</th>
                  <th className="px-4 py-3 text-left font-medium">Peran Akses</th>
                  <th className="px-4 py-3 text-left font-medium">Terakhir Masuk</th>
                  <th className="px-4 py-3 text-right font-medium">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          {u.name}
                          {isSelf && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-normal">
                              Sesi Anda
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.username}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-md border ${ROLE_COLORS[u.role] || "bg-muted text-foreground"}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground font-mono text-xs">
                        {u.last_login ? u.last_login.replace("T", " ").slice(0, 16) : "Belum pernah"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setResetModalUser(u);
                              setNewPassword("");
                              setResetMsg(null);
                            }}
                            className="px-2.5 py-1 rounded text-xs border border-border hover:bg-accent inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                            title="Reset Kata Sandi"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Ubah Sandi</span>
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => handleDeactivateUser(u)}
                              className="w-7 h-7 rounded hover:bg-rose-50 text-rose-600 inline-flex items-center justify-center transition-colors"
                              title="Nonaktifkan Pengguna"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
              Manajemen otentikasi aman berbasis PBKDF2. Hanya Pemilik (Owner) yang berhak menambah atau menonaktifkan pengguna.
            </div>
          </div>
        </div>
      )}

      {/* Modal Reset Sandi */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <h4 className="font-semibold text-sm">Ubah Kata Sandi</h4>
              </div>
              <button
                onClick={() => setResetModalUser(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Perbarui kata sandi untuk akun <span className="font-semibold text-foreground">{resetModalUser.name}</span> ({resetModalUser.username}).
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Kata Sandi Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  autoFocus
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {resetMsg && (
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-lg text-xs ${
                    resetMsg.type === "ok"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-rose-50 border border-rose-200 text-rose-700"
                  }`}
                >
                  {resetMsg.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{resetMsg.text}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3.5 py-2 rounded-lg border border-border text-xs font-medium hover:bg-accent transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  Simpan Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
