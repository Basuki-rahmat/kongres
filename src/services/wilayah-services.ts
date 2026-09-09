import { eq } from "drizzle-orm";
import { db } from "../db";
import { provinsi, kabupaten, kecamatan, desa } from "../db/schema";

export async function getProvinsiList() {
  return await db.select().from(provinsi).orderBy(provinsi.nama);
}

export async function getKabupatenList(provinsiId?: number) {
  if (provinsiId) {
    return await db
      .select()
      .from(kabupaten)
      .where(eq(kabupaten.provinsiId, provinsiId))
      .orderBy(kabupaten.nama);
  }
  return await db.select().from(kabupaten).orderBy(kabupaten.nama);
}

export async function getKecamatanList(kabupatenId?: number) {
  if (kabupatenId) {
    return await db
      .select()
      .from(kecamatan)
      .where(eq(kecamatan.kabupatenId, kabupatenId))
      .orderBy(kecamatan.nama);
  }
  return await db.select().from(kecamatan).orderBy(kecamatan.nama);
}

export async function getDesaList(kecamatanId?: number) {
  if (kecamatanId) {
    return await db
      .select()
      .from(desa)
      .where(eq(desa.kecamatanId, kecamatanId))
      .orderBy(desa.nama);
  }
  return await db.select().from(desa).orderBy(desa.nama);
}
