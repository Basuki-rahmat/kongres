import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  },
  (table) => [
    index("idx_status_anomali").on(table.statusAnomali),
    index("idx_wilayah").on(table.provinsi, table.kabKota, table.kecamatan),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RekapKomparasi = typeof tRekapKomparasi.$inferSelect;
export type NewRekapKomparasi = typeof tRekapKomparasi.$inferInsert;
