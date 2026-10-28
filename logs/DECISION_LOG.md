# Decision Log (Architecture Decision Records)

### [DEC-005] Penyempurnaan Alur Multi-Peran, Indikator Keyakinan Kualitatif, Pelacakan Batch Petani, dan Kalkulator Finansial Multi-Grade
- **Date**: 2026-10-28
- **Status**: Accepted (memperbarui sebagian DEC-004 untuk akses Analitik Supervisor dan navigasi Operator)
- **Context**: Audit UI/UX menemukan beberapa gesekan operasional: (1) operator yang masuk ke `/` melihat layar akses ditolak, sementara header kios `/antrean` terlalu padat di layar HP dan menampilkan tombol simulasi; (2) angka persentase keyakinan mentah sulit ditafsirkan cepat tanpa kategori kualitatif; (3) supervisor QC membutuhkan akses ke `/analitik` dan input hasil belah cepat berdasarkan nomor urut `#NNNN`; (4) pemilik gudang membutuhkan metrik finansial **Estimasi Kerugian Dicegah (Rp)** dengan skema harga multi-grade yang fleksibel serta rekap mutu per petani mitra.
- **Decision**:
  1. Mengalihkan `operator` secara mulus ke `/antrean`, mengomentari layar blokir peran di `Layout.tsx`, dan membuka `/analitik` untuk `supervisor` serta `owner`.
  2. Menampilkan kategori keyakinan kualitatif (`Tinggi` $\ge 80\%$, `Sedang` $60\text{--}79\%$, `Rendah — Mendekati Ambang` $< 60\%$) mendampingi persentase model di seluruh halaman.
  3. Menyediakan pemilih **Batch / Petani Mitra Aktif** di kios `/antrean`, dialog **Sampling Belah Cepat (`#NNNN`)** di `/riwayat`, dan penanda 6 kanal model NIR (sorotan 730 & 810 nm) di `SpectralMiniChart`.
  4. Menyediakan **Dynamic Grade Builder** di `/pengaturan?tab=tarif` (`Rp / kg` atau `Rp / butir`, bobot rata-rata gram, daftar grade komersial dinamis, harga sisa afkir) sebagai dasar perhitungan **Estimasi Kerugian Dicegah (Rp)** dan tabel **Mutu Pasokan per Petani Mitra** di `/analitik`.
- **Alternatives**: Menetapkan rumus harga statis dua grade di kode frontend (ditolak: skema harga gudang bervariasi menurut musim, ukuran, dan jumlah grade).
- **Affected**: `src/lib/buahsafe-data.ts`, `src/components/buahsafe/{ui,Layout,Sidebar,SpectralMiniChart}.tsx`, `src/routes/{index,antrean,riwayat,pengaturan,analitik}.tsx`.

### [DEC-004] Struktur Menu Berbasis Peran dan Mode Kios Operator
- **Date**: 2026-10-26
- **Status**: Accepted
- **Context**: Operator berdiri di ujung belt memakai tablet/HP dan harus membaca arahan keranjang dari jarak 1-2 m; alat hanya satu sehingga halaman Perangkat dan panel notifikasi tidak bernilai; analitik lama memuat klaim yang tidak dapat dibuktikan.
- **Decision**: Lima halaman inti per peran (Antrean kios; Ringkasan; Riwayat & label; Analitik; Pengaturan bertab). Antrean tanpa navigasi dengan blok warna penuh. Analitik menampilkan kecocokan putusan model dengan hasil belah sebagai perkiraan akurasi lapangan. Rute lama dialihkan agar tautan tersimpan tetap berfungsi.
- **Alternatives**: Poles tampilan lama (ditolak pengguna: minta rombak total); halaman Perangkat terpisah untuk armada (ditunda sampai alat lebih dari satu).
- **Consequences**: Operator tidak melihat Riwayat; pelabelan menjadi tugas supervisor/pemilik. Selector uji Playwright berubah.

### [DEC-003] Server sebagai Satu-satunya Sumber Putusan dan Angka (menggantikan sebagian DEC-001)
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: Strategi fallback DEC-001 menghasilkan arahan keranjang dari spektrum acak bila sensor/server gagal, serta mengisi dasbor dengan 220 pindaian karangan. Di lantai sortasi, hal ini mengirim buah ke keranjang tanpa pernah diukur dan membuat KPI supervisor/owner fiktif.
- **Decision**: Putusan NORMAL/ANOMALI hanya ditampilkan bila `/api/scan` mengembalikan prediksi. Semua angka berasal dari `/api/measurements` dan `/api/devices`; localStorage hanya cache salinan terakhir untuk mode baca saat offline, ditandai spanduk.
- **Alternatives**: Mode demo terpisah dengan data contoh berlabel jelas. Tidak dibuat (belum ada kebutuhan); jika perlu, beri bendera build eksplisit, bukan fallback otomatis.
- **Affected**: `src/lib/buahsafe-data.ts`, semua route yang membaca pindaian/perangkat, `PageLayout`.

### [DEC-002] Elimination of Demo Account Selectors in Favor of Cryptographic Session Tokens and Owner-Governed User Management
- **Date**: 2026-10-22
- **Status**: Accepted
- **Context**: Klien web sebelumnya memiliki tombol instan "Pilihan Cepat Masuk - Mode Demo" yang membocorkan akun demo statis ke layar login publik.
- **Decision**: Menghapus tombol demo dan array `DEMO_USERS`. Login dialihkan ke endpoint server riil dengan token Bearer 24 jam. Manajemen akun sepenuhnya didelegasikan kepada Pemilik (Owner) via menu Data Master.
- **Consequences**: Antarmuka terlihat dan berfungsi sebagai aplikasi produksi enterprise/warehouse yang aman, kredibel, dan siap audit.

### [DEC-001] Client-Side Decoupling & Graceful Fallback Strategy
- **Date**: 2026-10-22
- **Status**: Accepted
- **Context**: Frontend BuahSafe dirancang untuk dideploy secara independen (misalnya pada Vercel), sementara backend ML berjalan secara on-premise atau lokal pada meja sortasi kebun.
- **Decision**: Frontend menggunakan REST client `api.ts` berbasis `fetch` standar yang membaca `VITE_API_URL`. Jika backend tidak terjangkau (misal saat demo atau koneksi terputus), sistem secara otomatis beralih ke simulasi cerdas berbasis data empiris Monev 3 tanpa crash.
- **Consequences**: Pengalaman pengguna tetap mulus di cloud hosting maupun lingkungan pabrik lokal.
