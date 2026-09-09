import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";

// =============================================================================
// TABEL AUTENTIKASI & PENGGUNA
// =============================================================================
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("SAKSI").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// =============================================================================
// TABEL SISTEM PEMBANDING MANDIRI (SPM)
// =============================================================================
export const tRekapKomparasi = mysqlTable(
  "t_rekap_komparasi",
  {
    idTps: varchar("id_tps", { length: 20 }).primaryKey(),
    provinsi: varchar("provinsi", { length: 100 }).notNull(),
    kabKota: varchar("kab_kota", { length: 100 }).notNull(),
    kecamatan: varchar("kecamatan", { length: 100 }).notNull(),
    kelurahan: varchar("kelurahan", { length: 100 }).notNull(),
    noTps: int("no_tps").notNull(),

    // Data Saksi Internal
    suaraPartaiSaksi: int("suara_partai_saksi").default(0),
    suaraCalegTotalSaksi: int("suara_caleg_total_saksi").default(0),
    totalSuaraInternal: int("total_suara_internal").generatedAlwaysAs(
      sql`\`suara_partai_saksi\` + \`suara_caleg_total_saksi\``,
      { mode: "stored" }
    ),
    fileC1PlanoUrl: varchar("file_c1_plano_url", { length: 255 }),
    inputSaksiTimestamp: timestamp("input_saksi_timestamp"),

    // Data Hasil Scraping KPU
    suaraPartaiKpu: int("suara_partai_kpu").default(0),
    suaraCalegTotalKpu: int("suara_caleg_total_kpu").default(0),
    totalSuaraKpu: int("total_suara_kpu").default(0),
    lastScrapeTimestamp: timestamp("last_scrape_timestamp"),

    // Logika Komparasi & Validasi Hukum
    selisihSuara: int("selisih_suara").generatedAlwaysAs(
      sql`(\`suara_partai_saksi\` + \`suara_caleg_total_saksi\`) - \`total_suara_kpu\``,
      { mode: "stored" }
    ),
    statusAnomali: varchar("status_anomali", { length: 30 }).default(
      "BELUM_TERVERIFIKASI"
    ),
    catatanHukum: text("catatan_hukum"),

    // Geo-tagging & Petugas Saksi
    geoLat: varchar("geo_lat", { length: 50 }),
    geoLong: varchar("geo_long", { length: 50 }),
    saksiUserId: int("saksi_user_id").references(() => users.id),
  },
  (table) => [
    index("idx_status_anomali").on(table.statusAnomali),
    index("idx_wilayah").on(table.provinsi, table.kabKota, table.kecamatan),
  ]
);

// =============================================================================
// TABEL WILAYAH ADMINISTRATIF
// =============================================================================
export const provinsi = mysqlTable("provinsi", {
  id: int("id").primaryKey().autoincrement(),
  nama: varchar("nama", { length: 100 }).notNull(),
});

export const kabupaten = mysqlTable(
  "kabupaten",
  {
    id: int("id").primaryKey().autoincrement(),
    provinsiId: int("provinsi_id").references(() => provinsi.id),
    nama: varchar("nama", { length: 100 }).notNull(),
    kode: varchar("kode", { length: 10 }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_kabupaten_provinsi").on(table.provinsiId),
  ]
);

export const kecamatan = mysqlTable(
  "kecamatan",
  {
    id: int("id").primaryKey().autoincrement(),
    kabupatenId: int("kabupaten_id").references(() => kabupaten.id),
    nama: varchar("nama", { length: 100 }).notNull(),
    kode: varchar("kode", { length: 10 }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_kecamatan_kabupaten").on(table.kabupatenId),
  ]
);

export const desa = mysqlTable(
  "desa",
  {
    id: int("id").primaryKey().autoincrement(),
    kecamatanId: int("kecamatan_id").references(() => kecamatan.id),
    nama: varchar("nama", { length: 100 }).notNull(),
    kode: varchar("kode", { length: 10 }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_desa_kecamatan").on(table.kecamatanId),
  ]
);

// =============================================================================
// TABEL KEPENGURUSAN
// =============================================================================

// 1. Dewan Pimpinan Daerah (DPD) - Tingkat Provinsi
export const pengurusDpd = mysqlTable(
  "pengurus_dpd",
  {
    id: int("id").primaryKey().autoincrement(),
    provinsiId: int("provinsi_id")
      .notNull()
      .references(() => provinsi.id),
    nama: varchar("nama", { length: 255 }).notNull(),
    jabatan: varchar("jabatan", { length: 100 }).notNull(),
    nik: varchar("nik", { length: 16 }),
    noKta: varchar("no_kta", { length: 50 }),
    noHp: varchar("no_hp", { length: 20 }),
    alamat: text("alamat"),
    fotoUrl: varchar("foto_url", { length: 255 }),
    fileSkUrl: varchar("file_sk_url", { length: 255 }),
    periodeMulai: int("periode_mulai"),
    periodeSelesai: int("periode_selesai"),
    statusAktif: boolean("status_aktif").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => [
    index("idx_pengurus_dpd_provinsi").on(table.provinsiId),
  ]
);

// 2. Dewan Pimpinan Cabang (DPC) - Tingkat Kabupaten / Kota
export const pengurusDpc = mysqlTable(
  "pengurus_dpc",
  {
    id: int("id").primaryKey().autoincrement(),
    kabupatenId: int("kabupaten_id")
      .notNull()
      .references(() => kabupaten.id),
    nama: varchar("nama", { length: 255 }).notNull(),
    jabatan: varchar("jabatan", { length: 100 }).notNull(),
    nik: varchar("nik", { length: 16 }),
    noKta: varchar("no_kta", { length: 50 }),
    noHp: varchar("no_hp", { length: 20 }),
    alamat: text("alamat"),
    fotoUrl: varchar("foto_url", { length: 255 }),
    fileSkUrl: varchar("file_sk_url", { length: 255 }),
    periodeMulai: int("periode_mulai"),
    periodeSelesai: int("periode_selesai"),
    statusAktif: boolean("status_aktif").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => [
    index("idx_pengurus_dpc_kabupaten").on(table.kabupatenId),
  ]
);

// 3. Pimpinan Anak Cabang (PAC) - Tingkat Kecamatan
export const pengurusPac = mysqlTable(
  "pengurus_pac",
  {
    id: int("id").primaryKey().autoincrement(),
    kecamatanId: int("kecamatan_id")
      .notNull()
      .references(() => kecamatan.id),
    nama: varchar("nama", { length: 255 }).notNull(),
    jabatan: varchar("jabatan", { length: 100 }).notNull(),
    nik: varchar("nik", { length: 16 }),
    noKta: varchar("no_kta", { length: 50 }),
    noHp: varchar("no_hp", { length: 20 }),
    alamat: text("alamat"),
    fotoUrl: varchar("foto_url", { length: 255 }),
    fileSkUrl: varchar("file_sk_url", { length: 255 }),
    periodeMulai: int("periode_mulai"),
    periodeSelesai: int("periode_selesai"),
    statusAktif: boolean("status_aktif").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => [
    index("idx_pengurus_pac_kecamatan").on(table.kecamatanId),
  ]
);

// 4. Pengurus Anak Ranting / Ranting - Tingkat Desa / Kelurahan
export const pengurusAnakRanting = mysqlTable(
  "pengurus_anak_ranting",
  {
    id: int("id").primaryKey().autoincrement(),
    desaId: int("desa_id")
      .notNull()
      .references(() => desa.id),
    nama: varchar("nama", { length: 255 }).notNull(),
    jabatan: varchar("jabatan", { length: 100 }).notNull(),
    nik: varchar("nik", { length: 16 }),
    noKta: varchar("no_kta", { length: 50 }),
    noHp: varchar("no_hp", { length: 20 }),
    alamat: text("alamat"),
    fotoUrl: varchar("foto_url", { length: 255 }),
    fileSkUrl: varchar("file_sk_url", { length: 255 }),
    periodeMulai: int("periode_mulai"),
    periodeSelesai: int("periode_selesai"),
    statusAktif: boolean("status_aktif").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => [
    index("idx_pengurus_ranting_desa").on(table.desaId),
  ]
);

// =============================================================================
// RELATIONS (DRIZZLE ORM)
// =============================================================================
export const provinsiRelations = relations(provinsi, ({ many }) => ({
  kabupaten: many(kabupaten),
  pengurusDpd: many(pengurusDpd),
}));

export const kabupatenRelations = relations(kabupaten, ({ one, many }) => ({
  provinsi: one(provinsi, {
    fields: [kabupaten.provinsiId],
    references: [provinsi.id],
  }),
  kecamatan: many(kecamatan),
  pengurusDpc: many(pengurusDpc),
}));

export const kecamatanRelations = relations(kecamatan, ({ one, many }) => ({
  kabupaten: one(kabupaten, {
    fields: [kecamatan.kabupatenId],
    references: [kabupaten.id],
  }),
  desa: many(desa),
  pengurusPac: many(pengurusPac),
}));

export const desaRelations = relations(desa, ({ one, many }) => ({
  kecamatan: one(kecamatan, {
    fields: [desa.kecamatanId],
    references: [kecamatan.id],
  }),
  pengurusAnakRanting: many(pengurusAnakRanting),
}));

export const pengurusDpdRelations = relations(pengurusDpd, ({ one }) => ({
  provinsi: one(provinsi, {
    fields: [pengurusDpd.provinsiId],
    references: [provinsi.id],
  }),
}));

export const pengurusDpcRelations = relations(pengurusDpc, ({ one }) => ({
  kabupaten: one(kabupaten, {
    fields: [pengurusDpc.kabupatenId],
    references: [kabupaten.id],
  }),
}));

export const pengurusPacRelations = relations(pengurusPac, ({ one }) => ({
  kecamatan: one(kecamatan, {
    fields: [pengurusPac.kecamatanId],
    references: [kecamatan.id],
  }),
}));

export const pengurusAnakRantingRelations = relations(
  pengurusAnakRanting,
  ({ one }) => ({
    desa: one(desa, {
      fields: [pengurusAnakRanting.desaId],
      references: [desa.id],
    }),
  })
);

// =============================================================================
// TYPE INFERENCES
// =============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type RekapKomparasi = typeof tRekapKomparasi.$inferSelect;
export type NewRekapKomparasi = typeof tRekapKomparasi.$inferInsert;

export type Provinsi = typeof provinsi.$inferSelect;
export type NewProvinsi = typeof provinsi.$inferInsert;
export type Kabupaten = typeof kabupaten.$inferSelect;
export type NewKabupaten = typeof kabupaten.$inferInsert;
export type Kecamatan = typeof kecamatan.$inferSelect;
export type NewKecamatan = typeof kecamatan.$inferInsert;
export type Desa = typeof desa.$inferSelect;
export type NewDesa = typeof desa.$inferInsert;

export type PengurusDpd = typeof pengurusDpd.$inferSelect;
export type NewPengurusDpd = typeof pengurusDpd.$inferInsert;
export type PengurusDpc = typeof pengurusDpc.$inferSelect;
export type NewPengurusDpc = typeof pengurusDpc.$inferInsert;
export type PengurusPac = typeof pengurusPac.$inferSelect;
export type NewPengurusPac = typeof pengurusPac.$inferInsert;
export type PengurusAnakRanting = typeof pengurusAnakRanting.$inferSelect;
export type NewPengurusAnakRanting = typeof pengurusAnakRanting.$inferInsert;
