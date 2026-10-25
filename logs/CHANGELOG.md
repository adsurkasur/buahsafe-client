# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased] - 2026-10-26 (rombak UI)
### Added
- Mode kios Antrean dengan bunyi/getar opsional dan layar penuh; mode gelap; halaman Analitik kecocokan model vs hasil belah; halaman Pengaturan bertab.

### Changed
- Seluruh tampilan dan struktur menu dirancang ulang; rute baru `/antrean`, `/riwayat`, `/analitik`, `/pengaturan` (rute lama dialihkan).

### Removed
- Halaman Perangkat terpisah dan panel notifikasi.

## [Unreleased] - 2026-10-25 (conveyor)
### Changed
- Halaman Pemindaian menjadi Antrean Conveyor untuk operator di ujung belt.

### Added
- Pelabelan hasil belah di Riwayat dan filter "Belum dilabel".

### Removed
- Input ID buah manual dan pemicu scan dari web.

## [Unreleased] - 2026-10-25
### Changed
- Grafik dan CSV memakai 18 kanal AS7265x sesuai model produksi (SVM-RBF 18 kanal).
- Istilah "Reflektansi" diganti "Intensitas transmisi".

### Removed
- Dependensi `@tanstack/react-start` dan `@tanstack/start` yang tidak dipakai (penyebab deploy Vercel diblokir).

## [Unreleased] - 2026-10-23
### Added
- Spanduk status server offline di semua halaman.
- Kurva spektral per baris di Riwayat Sortasi; CSV memuat 6 kanal reflektansi.

### Changed
- Riwayat, dasbor, analitik, dan perangkat membaca data nyata dari server (cache lokal `v2`).
- Kolom ID buah di meja scan tersorot otomatis untuk pemindai barcode.
- Bahasa: locale tanggal Indonesia, halaman 404/galat berbahasa Indonesia, metadata halaman tanpa istilah "ultrasonic".

### Removed
- Data pindaian dan petani contoh hasil acak.
- Hasil scan pengganti (acak) saat sensor atau server gagal.

### Fixed
- Sesi lokal berakhir saat server menolak token (mis. setelah sandi direset).
- Tren tingkat kelolosan tidak lagi 0,0% saat kemarin 0%.

## [1.2.0] - 2026-10-22
### Added
- Real production authentication in `src/lib/auth.tsx` with automatic Bearer token headers in `src/lib/api.ts`.
- Full-featured User Management view in `src/routes/master-data.tsx` (active users table, staff registration form, password reset modal).
- Password visibility toggle (Eye/EyeOff) and "Ingat nama pengguna" on the login screen.

### Changed
- Refactored `src/routes/login.tsx` into a production-grade authentication portal.
- Connected user session verification to `GET /api/auth/me`.

### Removed
- Removed "Pilihan Cepat Masuk - Mode Demo" selector buttons and hardcoded `DEMO_USERS` array.

## [1.1.0] - 2026-10-22
### Added
- Real-time API Client `src/lib/api.ts` connecting frontend to the Flask Machine Learning server.
- Interactive 6-channel Visible-NIR reflectance spectral visualization in `/scan`.
- `.env.example` documenting `VITE_API_URL` configuration for Vercel deployment.
- Modular logging protocol (`logs/` directory).

### Changed
- Corrected physics terminology: replaced "ultrasonic scan" with "spektroskopi optik Visible-NIR AS7265x".
- Fully localized interface to standard, user-friendly Indonesian for Operator, Supervisor, and Owner.
- Enhanced login with async backend authentication and graceful demo fallback.
- Removed intrusive client-side random scan simulation loop.

### Removed
- Dead boilerplate templates `src/lib/error-capture.ts` and `src/lib/error-page.ts`.
