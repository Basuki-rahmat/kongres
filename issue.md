# Sistem Pembanding Mandiri (SPM) — Dokumentasi Proyek

Dokumen ini mendokumentasikan arsitektur, fitur, dan status implementasi Sistem Pembanding Mandiri (SPM) untuk pengawalan integritas perolehan suara Partai Kongres pada Pemilu.

**Terakhir diperbarui:** 10 September 2026

---

## 1. DESKRIPSI SISTEM

Sistem Pembanding Mandiri (SPM) adalah platform web internal yang dirancang untuk mengawal integritas perolehan suara Partai Kongres pada Pemilu. Sistem bekerja dengan membandingkan secara otomatis data Form C1 fisik hasil input saksi di TPS dengan data digital hasil scraping/API real count KPU.

### Fitur Utama
- **Input data saksi** — Saksi TPS menginput hasil C1 (suara + foto + GPS)
- **Scraping data KPU** — Background worker otomatis mengambil data dari Sirekap KPU
- **Komparasi otomatis** — Sistem mendeteksi selisih suara (anomali) secara real-time
- **Notifikasi push** — Tim Hukum menerima notifikasi SSE saat anomali terdeteksi
- **PDF bukti sengketa** — Generate dokumen PDF komparasi untuk keperluan hukum pleno KPU
- **Manajemen pengurus** — CRUD kepengurusan DPD, DPC, PAC, Anak Ranting

---

## 2. STRUKTUR ARSITEKTUR

| Komponen | Teknologi | Status |
|----------|-----------|--------|
| **Runtime** | Bun | ✅ |
| **Web Framework** | ElysiaJS | ✅ |
| **ORM** | Drizzle ORM | ✅ |
| **Database** | MySQL | ✅ |
| **Autentikasi** | JWT (@elysiajs/jwt) | ✅ |
| **PDF Generator** | pdf-lib | ✅ |
| **Real-time** | SSE (Server-Sent Events) | ✅ |
| **CORS** | @elysiajs/cors | ✅ |

---

## 3. STRUKTUR FOLDER

```
src/
├── index.ts                    # Entry point, registrasi routes
├── db/
│   ├── index.ts                # Koneksi MySQL + Drizzle instance
│   ├── schema.ts               # 11 tabel + relasi + type inference
│   └── seed.ts                 # Import data wilayah Indonesia
├── middlewares/
│   └── auth-middleware.ts       # JWT verification + role check
├── routes/
│   ├── auth-route.ts           # Login + profile
│   ├── users-route.ts          # Registrasi
│   ├── saksi-route.ts          # Upload C1 + rekap
│   ├── advokasi-route.ts       # Anomali + bukti sengketa + PDF
│   ├── kpu-route.ts            # Scraper control (admin)
│   ├── notification-route.ts   # SSE stream + CRUD notifikasi
│   ├── pengurus-route.ts       # CRUD kepengurusan
│   └── wilayah-route.ts        # Data wilayah administratif
├── services/
│   ├── auth-services.ts        # Login + profile
│   ├── users-services.ts       # Registrasi + hash password
│   ├── saksi-services.ts       # Upload C1 + rekap (async I/O)
│   ├── advokasi-services.ts    # Anomali + export bukti + PDF
│   ├── kpu-scraper-services.ts # Fetch KPU + normalisasi + komparasi
│   ├── notification-services.ts # CRUD + auto-notifikasi anomali
│   ├── pdf-generator.ts        # Generate PDF bukti sengketa
│   ├── sse-manager.ts          # SSE connection manager
│   ├── pengurus-services.ts    # CRUD DPD/DPC/PAC/Anak Ranting
│   └── wilayah-services.ts     # Query wilayah administratif
└── workers/
    └── kpu-worker.ts           # Background scraping worker
```

---

## 4. SKEMA DATABASE (11 Tabel)

### 4.1. `users` — Autentikasi & Pengguna
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | INT PK AUTO | ID user |
| `name` | VARCHAR(255) | Nama lengkap |
| `email` | VARCHAR(255) UNIQUE | Email (login) |
| `password` | VARCHAR(255) | Bcrypt hash |
| `role` | VARCHAR(50) | `ADMIN`, `SAKSI`, `ADVOKASI`, `PENGURUS` |
| `created_at` | TIMESTAMP | Waktu registrasi |

### 4.2. `t_rekap_komparasi` — Inti SPM
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id_tps` | VARCHAR(20) PK | ID TPS |
| `provinsi`, `kab_kota`, `kecamatan`, `kelurahan` | VARCHAR | Lokasi TPS |
| `no_tps` | INT | Nomor TPS |
| `suara_partai_saksi` | INT | Suara partai dari saksi |
| `suara_caleg_total_saksi` | INT | Suara caleg dari saksi |
| `total_suara_internal` | INT (GENERATED) | `partai + caleg` |
| `file_c1_plano_url` | VARCHAR(255) | URL foto C1 |
| `input_saksi_timestamp` | TIMESTAMP | Waktu input saksi |
| `suara_partai_kpu` | INT | Suara partai dari KPU |
| `suara_caleg_total_kpu` | INT | Suara caleg dari KPU |
| `total_suara_kpu` | INT | Total suara KPU |
| `last_scrape_timestamp` | TIMESTAMP | Waktu scrape terakhir |
| `selisih_suara` | INT (GENERATED) | `internal - KPU` |
| `status_anomali` | VARCHAR(30) | `BELUM_TERVERIFIKASI`, `MATCH`, `MISMATCH_KPU_OVER`, `MISMATCH_KPU_UNDER` |
| `catatan_hukum` | TEXT | Catatan hukum sengketa |
| `geo_lat`, `geo_long` | VARCHAR(50) | Koordinat GPS |
| `saksi_user_id` | INT FK → users | User saksi |

### 4.3. `notifications` — Push Notification
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | INT PK AUTO | ID notifikasi |
| `user_id` | INT FK → users | Penerima |
| `title` | VARCHAR(255) | Judul |
| `body` | TEXT | Isi pesan |
| `type` | VARCHAR(50) | Tipe (`ANOMALY_DETECTED`) |
| `reference_id` | VARCHAR(50) | ID referensi (id_tps) |
| `reference_type` | VARCHAR(50) | Tipe referensi (`TPS`) |
| `is_read` | BOOLEAN | Status baca |
| `created_at` | TIMESTAMP | Waktu dibuat |

### 4.4–4.7. Tabel Wilayah Administratif
- `provinsi` → `kabupaten` → `kecamatan` → `desa` (hierarki parent-child)

### 4.8–4.11. Tabel Kepengurusan
- `pengurus_dpd` (provinsi) → `pengurus_dpc` (kabupaten) → `pengurus_pac` (kecamatan) → `pengurus_anak_ranting` (desa)

### Relasi Drizzle ORM
```
users → notifications (one-to-many)
users → t_rekap_komparasi (one-to-many via saksi_user_id)
t_rekapKomparasi → users (many-to-one via saksi_user_id)
provinsi → kabupaten → kecamatan → desa (hierarki)
pengurus_dpd → provinsi, pengurus_dpc → kabupaten, dll.
```

---

## 5. API ENDPOINTS

### 5.1. Autentikasi (`/api/auth`)
| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| POST | `/api/auth/login` | ❌ | Login,返回 JWT token |
| GET | `/api/auth/me` | ✅ | Profil user login |

### 5.2. Registrasi (`/api/users`)
| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| POST | `/api/users` | ❌ | Register (hanya `SAKSI`/`ADVOKASI`/`PENGURUS`, password min 6 char) |

### 5.3. Saksi (`/api/v1/saksi`)
| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| POST | `/api/v1/saksi/upload-c1` | ✅ | Upload data C1 (suara + foto + GPS) |
| GET | `/api/v1/saksi/rekap` | ✅ | Daftar rekap (filter: provinsi, kabKota, kecamatan, statusAnomali) |
| GET | `/api/v1/saksi/rekap/:id_tps` | ✅ | Detail rekap satu TPS |

### 5.4. Advokasi (`/api/v1/advokasi`)
| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| GET | `/api/v1/advokasi/anomali-list` | ADVOKASI/ADMIN | Daftar TPS bermasalah |
| GET | `/api/v1/advokasi/export-bukti/:id_tps` | ADVOKASI/ADMIN | Export JSON bukti sengketa |
| PUT | `/api/v1/advokasi/catatan-hukum/:id_tps` | ADVOKASI/ADMIN | Update catatan hukum |
| GET | `/api/v1/advokasi/download-bukti-pdf/:id_tps` | ADVOKASI/ADMIN | Download PDF bukti sengketa |

### 5.5. KPU Scraper (`/api/v1/kpu`)
| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| GET | `/api/v1/kpu/scrape-status` | ADMIN | Status worker |
| POST | `/api/v1/kpu/trigger-scrape` | ADMIN | Trigger manual scraping |
| PUT | `/api/v1/kpu/update-manual/:id_tps` | ADMIN | Input manual data KPU |

### 5.6. Notifikasi (`/api/v1/notifications`)
| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| GET | `/api/v1/notifications/stream` | ✅ | SSE stream (real-time push) |
| GET | `/api/v1/notifications` | ✅ | Daftar notifikasi (?unread=true) |
| GET | `/api/v1/notifications/unread-count` | ✅ | Jumlah belum dibaca |
| PUT | `/api/v1/notifications/:id/read` | ✅ | Tandai sudah dibaca |
| PUT | `/api/v1/notifications/read-all` | ✅ | Tandai semua sudah dibaca |

### 5.7. Kepengurusan (`/api/pengurus`)
| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| GET | `/api/pengurus/dpd`, `/dpc`, `/pac`, `/anak-ranting` | ADMIN | List pengurus |
| GET | `/api/pengurus/[level]/:id` | ADMIN | Detail pengurus |
| POST | `/api/pengurus/[level]` | ADMIN | Create pengurus |
| PUT | `/api/pengurus/[level]/:id` | ADMIN | Update pengurus |
| DELETE | `/api/pengurus/[level]/:id` | ADMIN | Delete pengurus |

### 5.8. Wilayah (`/api/wilayah`)
| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| GET | `/api/wilayah/provinsi` | ❌ | Daftar provinsi |
| GET | `/api/wilayah/kabupaten?provinsiId=` | ❌ | Daftar kabupaten |
| GET | `/api/wilayah/kecamatan?kabupatenId=` | ❌ | Daftar kecamatan |
| GET | `/api/wilayah/desa?kecamatanId=` | ❌ | Daftar desa |

---

## 6. SISTEM NOTIFIKASI

### Flow Notifikasi
1. **Deteksi anomali** — KPU Scraper atau Saksi Upload mendeteksi `MISMATCH_KPU_OVER` / `MISMATCH_KPU_UNDER`
2. **Simpan ke DB** — Notifikasi disimpan ke tabel `notifications`
3. **Push SSE** — Jika user Tim Hukum (ADVOKASI) online, notifikasi dikirim real-time via SSE
4. **Client terima** — Frontend menerima event `notification` dan menampilkan popup/alert

### SSE Stream
- **Endpoint:** `GET /api/v1/notifications/stream`
- **Format:** `event: notification\ndata: {"title": "...", "body": "...", "type": "..."}`
- **Heartbeat:** Tiap 30 detik (`:ping`)

---

## 7. PDF BUKTI SENGKETA

### Endpoint
`GET /api/v1/advokasi/download-bukti-pdf/:id_tps`

### Isi Dokumen (A4, multi-halaman)
1. **Header** — Logo SPM, judul, klasifikasi rahasia
2. **Metadata** — Nomor berkas, tanggal pembuatan
3. **Wilayah TPS** — Provinsi s.d. nomor TPS
4. **Tabel Komparasi** — Data Saksi vs Data KPU
5. **Analisis Selisih** — Status anomali + warning box
6. **Data Pendukung** — File C1, timestamp, GPS
7. **Catatan Hukum** — Telaah sengketa
8. **Protokol Sanggahan** — 3 langkah pleno KPU
9. **Form Keberatan Saksi** — Form kosong untuk sidang

---

## 8. KEAMANAN

### Role-Based Access Control
| Role | Akses |
|------|-------|
| `ADMIN` | Full akses (scraper, pengurus CRUD, semua data) |
| `SAKSI` | Upload C1, lihat rekap sendiri |
| `ADVOKASI` | Lihat anomali, export bukti, update catatan hukum, PDF |
| `PENGURUS` | Terbatas (hanya lihat data) |

### Implementasi Auth
- JWT token wajib untuk semua endpoint sensitif
- `verifyJwt()` — Verifikasi Bearer token dari header
- `checkRole()` — Cek role user terhadap daftar role yang diizinkan
- Password di-hash dengan bcrypt (salt 10)
- CORS dikonfigurasi via env `CORS_ORIGIN`
- `JWT_SECRET` wajib di-set di `.env` (server crash jika kosong)

---

## 9. BACKGROUND WORKER (KPU Scraper)

### Konfigurasi
- **Interval:** `KPU_SCRAPE_INTERVAL_MINUTES` (default: 5 menit)
- **Timeout fetch:** 10 detik per TPS
- **Delay antar request:** 300ms
- **Target scrape:** TPS `BELUM_TERVERIFIKASI` + `MISMATCH_KPU_OVER` + `MISMATCH_KPU_UNDER`

### Flow
1. Ambil semua TPS yang perlu di-scrape
2. Fetch data dari `sirekap-obj-data.kpu.go.id`
3. Normalisasi respons KPU
4. Update DB + tentukan status anomali
5. Jika anomali → push notifikasi ke Tim Hukum
6. Log statistik (total, sukses, gagal, match, anomali)

---

## 10. ENVIRONMENT VARIABLES

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=kongres
DATABASE_URL=mysql://root:@localhost:3306/kongres
JWT_SECRET=<wajib_diisi>
KPU_API_BASE_URL=https://sirekap-obj-data.kpu.go.id
KPU_SCRAPE_INTERVAL_MINUTES=5
CORS_ORIGIN=*
```

---

## 11. STATUS IMPLEMENTASI

### ✅ Selesai (Backend)
- [x] Setup Bun + ElysiaJS + Drizzle ORM + MySQL
- [x] 11 tabel database + relasi + seed data wilayah
- [x] Autentikasi JWT + role-based access control
- [x] Registrasi user (batasan role)
- [x] Login + profil user
- [x] Upload C1 saksi (suara + foto + GPS, async I/O)
- [x] Rekap data saksi (list + detail)
- [x] Background worker scraping KPU
- [x] Deteksi anomali otomatis (overcounted/undercounted)
- [x] Push notification SSE ke Tim Hukum
- [x] CRUD notifikasi + mark read
- [x] Export bukti sengketa JSON
- [x] Generate PDF bukti sengketa
- [x] Update catatan hukum
- [x] CRUD kepengurusan DPD/DPC/PAC/Anak Ranting
- [x] Query wilayah administratif
- [x] CORS configuration
- [x] Input validation (Elysia schema)

### ❌ Belum Diimplementasi (Frontend)
- [ ] Client App Saksi (PWA / Mobile-first)
- [ ] Admin/Legal Panel Dashboard
- [ ] Monitoring Anomali Real-time (WebSocket/SSE di frontend)
- [ ] Form Keberatan Saksi (digital)

### ❌ Belum Diimplementasi (Backend Lanjutan)
- [ ] Job queue (BullMQ) untuk scraping
- [ ] Proxy rotation untuk scraper
- [ ] Rate limiting
- [ ] Account lockout setelah N kali gagal login
- [ ] Password change/reset
- [ ] Pagination endpoint (notifications, rekap)
- [ ] Notification cleanup/TTL
- [ ] Logging & monitoring (Sentry, etc.)

---

## 12. CARA MENJALANKAN

```bash
# 1. Install dependencies
bun install

# 2. Setup database
cp .env.example .env
# Edit .env sesuai konfigurasi MySQL
bun run db:push

# 3. Seed data wilayah
bun run db:seed

# 4. Jalankan development server
bun run dev

# Server berjalan di http://localhost:3000
```

---

## 13. COMMANDS

| Command | Keterangan |
|---------|------------|
| `bun run dev` | Development server + hot reload |
| `bun run db:generate` | Generate SQL migration |
| `bun run db:push` | Push schema ke database |
| `bun run db:studio` | Buka Drizzle Studio |
| `bun run db:seed` | Import data wilayah |
| `bunx tsc --noEmit` | Type check |
