# Setup Projek: Bun + ElysiaJS + Drizzle + MySQL

## Ringkasan
Membuat projek backend baru dari nol di folder ini menggunakan Bun sebagai runtime, ElysiaJS sebagai web framework, Drizzle ORM untuk akses database, dan MySQL sebagai database.

## Tech Stack
- **Runtime & Package Manager:** Bun
- **Web Framework:** ElysiaJS
- **ORM:** Drizzle ORM
- **Database:** MySQL

---

## Langkah Implementasi

### 1. Inisialisasi Projek
- Jalankan `bun init` di root folder ini.
- Pastikan `tsconfig.json` sudah dikonfigurasi untuk environment Bun + Elysia.

### 2. Instalasi Dependensi
- Install package inti ElysiaJS.
- Install Drizzle ORM dan Drizzle Kit (sebagai dev dependency).
- Install driver MySQL yang diperlukan (misalnya `mysql2`).

### 3. Konfigurasi Database & ORM
- Buat file konfigurasi Drizzle (`drizzle.config.ts`).
- Buat file schema awal (misalnya tabel `users` sederhana untuk verifikasi setup) di folder schema.
- Buat file koneksi database yang membaca kredensial dari environment variable (`.env`).
- Tambahkan script di `package.json` untuk generate dan push migration.

### 4. Setup Server
- Buat entry point utama aplikasi (misalnya `src/index.ts`).
- Inisialisasi instance Elysia.
- Hubungkan koneksi database ke dalam aplikasi (bisa sebagai service terpisah atau melalui context Elysia).
- Buat minimal satu route health check (`GET /ping`) dan satu route yang mengakses database untuk memastikan koneksi berjalan.

---

## Kriteria Selesai
- Projek bisa dijalankan dengan `bun run dev` (hot-reload aktif).
- Aplikasi berhasil terkoneksi ke database MySQL.
- Migration bisa di-generate dan di-apply menggunakan Drizzle Kit.
- Endpoint API bisa diakses dan berfungsi dengan benar.
