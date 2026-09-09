# Perencanaan Implementasi Sistem Pembanding Mandiri (SPM) dan Fitur Registrasi

Dokumen ini berisi panduan tingkat tinggi (high-level) untuk diimplementasikan oleh junior programmer atau model AI pendamping. Dokumen ini mencakup pembaruan struktur pengguna (users) serta deskripsi arsitektur inti dari Sistem Pembanding Mandiri (SPM).

---

## 1. DESKRIPSI SISTEM
Sistem Pembanding Mandiri (SPM) adalah platform web internal yang dirancang untuk mengawal integritas perolehan suara Partai Kongres pada Pemilu. Sistem bekerja dengan membandingkan secara otomatis data Form C1 fisik hasil input saksi di TPS dengan data digital hasil scraping/API real count KPU.

## 2. STRUKTUR ARSITEKTUR REKAYASA PERANGKAT LUNAK
*   **Client App (Saksi):** Progressive Web Apps (PWA) / HTML5 responsive (Mobile-first)
*   **Admin/Legal Panel:** Dashboard Monitoring Anomali (Desktop optimized)
*   **Backend Engine:** Node.js / Python FastAPI (Stateful comparison mechanism)
*   **Database:** MySQL (Relational integrity for vote pooling)
*   **Scraping Worker:** Async Background Job Manager (Celery / BullMQ) dengan proxy rotasi

---

## 3. STRUKTUR FOLDER DAN FILE
Untuk menjaga kerapian kode, terapkan struktur folder berikut di dalam backend (ElysiaJS):

*   **`src/routes/`**: Berisi routing untuk endpoint API (ElysiaJS).
    *   *Format penamaan file:* `[nama]-route.ts` (contoh: `users-route.ts`)
*   **`src/services/`**: Berisi logika bisnis (business logic) aplikasi.
    *   *Format penamaan file:* `[nama]-services.ts` (contoh: `users-services.ts`)

---

## 4. SKEMA DATABASE INTI (MySQL)

### A. Modifikasi Tabel `users`
Implementasikan (atau perbarui) skema tabel `users` menggunakan Drizzle ORM dengan spesifikasi berikut:

*   `id`: INTEGER, PRIMARY KEY, AUTO INCREMENT
*   `name`: VARCHAR(255), NOT NULL
*   `email`: VARCHAR(255), NOT NULL, UNIQUE
*   `password`: VARCHAR(255), NOT NULL *(Catatan: Password harus di-hash menggunakan bcrypt sebelum disimpan)*
*   `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP

### B. Tabel `t_rekap_komparasi` (Referensi SPM)
```sql
CREATE TABLE t_rekap_komparasi (
    id_tps VARCHAR(20) PRIMARY KEY,
    provinsi VARCHAR(100) NOT NULL,
    kab_kota VARCHAR(100) NOT NULL,
    kecamatan VARCHAR(100) NOT NULL,
    kelurahan VARCHAR(100) NOT NULL,
    no_tps INT NOT NULL,
    
    -- Data Saksi Internal
    suara_partai_saksi INT DEFAULT 0,
    suara_caleg_total_saksi INT DEFAULT 0,
    total_suara_internal INT GENERATED ALWAYS AS (suara_partai_saksi + suara_caleg_total_saksi) STORED,
    file_c1_plano_url VARCHAR(255),
    input_saksi_timestamp TIMESTAMP,
    
    -- Data Hasil Scraping KPU
    suara_partai_kpu INT DEFAULT 0,
    suara_caleg_total_kpu INT DEFAULT 0,
    total_suara_kpu INT DEFAULT 0,
    last_scrape_timestamp TIMESTAMP,
    
    -- Logika Komparasi & Validasi Hukum
    selisih_suara INT GENERATED ALWAYS AS ((suara_partai_saksi + suara_caleg_total_saksi) - total_suara_kpu) STORED,
    status_anomali VARCHAR(30) DEFAULT 'BELUM_TERVERIFIKASI', -- MATCH, MISMATCH_KPU_OVER, MISMATCH_KPU_UNDER
    catatan_hukum TEXT
);

CREATE INDEX idx_status_anomali ON t_rekap_komparasi(status_anomali);
CREATE INDEX idx_wilayah ON t_rekap_komparasi(provinsi, kab_kota, kecamatan);
```

---

## 5. ENDPOINT API

### A. Registrasi User Baru
Buat API untuk mendaftarkan pengguna baru dengan spesifikasi:

*   **Endpoint:** `POST /api/users`
*   **Logika:** 
    1. Validasi input request body.
    2. Cek apakah email sudah terdaftar. Jika ya, kembalikan error.
    3. Hash password menggunakan `bcrypt`.
    4. Simpan data user ke database.

**Request Body:**
```json
{
    "nama": "Rahmat",
    "email": "rahmat@localhost",
    "password": "rahasia"
}
```

**Response Body (Success 200/201):**
```json
{
    "data": "OK"
}
```

**Response Body (Error 400/409):**
```json
{
    "error": "Email sudah terdaftar"
}
```

---

## 6. TAHAPAN IMPLEMENTASI
1.  **Setup Database (Drizzle ORM):** Perbarui tabel `users` dan tambahkan `t_rekap_komparasi`.
2.  **Pembuatan Struktur Folder:** Buat folder `src/routes` dan `src/services`.
3.  **Implementasi Service:** Buat `src/services/users-services.ts` dengan hashing bcrypt.
4.  **Implementasi Route:** Buat `src/routes/users-route.ts` dengan endpoint `POST /api/users`.
5.  **Registrasi Route:** Daftarkan `usersRoute` ke `src/index.ts`.

---

## 7. STATUS IMPLEMENTASI (TERBARU)

### ✅ Selesai (Backend)
- [x] Setup Bun + ElysiaJS + Drizzle ORM + MySQL
- [x] 11 tabel database + relasi + seed data wilayah
- [x] Autentikasi JWT + role-based access control
- [x] Registrasi user (batasan role)
- [x] Login + profil user
- [x] Upload C1 saksi (suara + foto + GPS, async I/O)
- [x] Rekap data saksi (list + detail dengan pagination)
- [x] Background worker scraping KPU
- [x] Deteksi anomali otomatis (overcounted/undercounted)
- [x] Push notification SSE ke Tim Hukum
- [x] CRUD notifikasi + mark read (dengan pagination)
- [x] Export bukti sengketa JSON
- [x] Generate PDF bukti sengketa
- [x] Update catatan hukum
- [x] CRUD kepengurusan DPD/DPC/PAC/Anak Ranting
- [x] Query wilayah administratif
- [x] CORS configuration
- [x] Input validation (Elysia schema)
- [x] **Rate limiting (in-memory per IP)**
- [x] **Password change (user sendiri)**
- [x] **Password reset (admin only)**
- [x] **Notification cleanup/TTL (otomatis hapus > 30 hari)**

### ❌ Belum Diimplementasi (Frontend)
- [ ] Client App Saksi (PWA / Mobile-first)
- [ ] Admin/Legal Panel Dashboard
- [ ] Monitoring Anomali Real-time (WebSocket/SSE di frontend)
- [ ] Form Keberatan Saksi (digital)

### ❌ Belum Diimplementasi (Backend Lanjutan)
- [ ] Job queue (BullMQ) untuk scraping
- [ ] Proxy rotation untuk scraper
- [ ] Account lockout setelah N kali gagal login
- [ ] Logging & monitoring (Sentry, etc.)
