import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tRekapKomparasi } from "../db/schema";

export interface UploadC1Input {
  idTps: string;
  provinsi?: string;
  kabKota?: string;
  kecamatan?: string;
  kelurahan?: string;
  noTps?: number;
  suaraPartai: number;
  suaraCaleg: number;
  geoLat?: string;
  geoLong?: string;
  fileBase64?: string;
}

/**
 * Menyimpan file base64 ke folder lokal public/uploads/c1/
 */
function saveBase64Image(base64Str: string, idTps: string): string {
  const uploadDir = path.resolve(process.cwd(), "public/uploads/c1");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  let extension = "jpg";
  let cleanBase64 = base64Str;

  // Cek apakah ada header Data URI (contoh: data:image/png;base64,...)
  const matches = base64Str.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
  if (matches) {
    extension = matches[1] === "jpeg" ? "jpg" : matches[1];
    cleanBase64 = matches[2];
  }

  const filename = `c1_${idTps.replace(/[^a-zA-Z0-9_-]/g, "_")}_${Date.now()}.${extension}`;
  const filePath = path.join(uploadDir, filename);

  fs.writeFileSync(filePath, Buffer.from(cleanBase64, "base64"));
  return `/uploads/c1/${filename}`;
}

export async function uploadC1Service(input: UploadC1Input, userId?: number) {
  // 1. Simpan foto jika ada
  let fileUrl: string | null = null;
  if (input.fileBase64) {
    fileUrl = saveBase64Image(input.fileBase64, input.idTps);
  }

  const totalSuaraInternal = Number(input.suaraPartai) + Number(input.suaraCaleg);

  // 2. Cek apakah TPS sudah ada di database
  const [existing] = await db
    .select()
    .from(tRekapKomparasi)
    .where(eq(tRekapKomparasi.idTps, input.idTps))
    .limit(1);

  if (existing) {
    // Evaluasi status anomali jika data KPU sudah pernah di-scrape
    let statusAnomali = existing.statusAnomali || "BELUM_TERVERIFIKASI";
    if (existing.lastScrapeTimestamp || (existing.totalSuaraKpu && existing.totalSuaraKpu > 0)) {
      const totalKpu = Number(existing.totalSuaraKpu);
      if (totalSuaraInternal === totalKpu) {
        statusAnomali = "MATCH";
      } else if (totalKpu > totalSuaraInternal) {
        statusAnomali = "MISMATCH_KPU_OVER";
      } else {
        statusAnomali = "MISMATCH_KPU_UNDER";
      }
    }

    await db
      .update(tRekapKomparasi)
      .set({
        suaraPartaiSaksi: Number(input.suaraPartai),
        suaraCalegTotalSaksi: Number(input.suaraCaleg),
        fileC1PlanoUrl: fileUrl || existing.fileC1PlanoUrl,
        inputSaksiTimestamp: new Date(),
        geoLat: input.geoLat || existing.geoLat,
        geoLong: input.geoLong || existing.geoLong,
        saksiUserId: userId || existing.saksiUserId,
        statusAnomali,
      })
      .where(eq(tRekapKomparasi.idTps, input.idTps));
  } else {
    // Jika record TPS baru, field wilayah wajib diisi
    if (
      !input.provinsi ||
      !input.kabKota ||
      !input.kecamatan ||
      !input.kelurahan ||
      input.noTps === undefined
    ) {
      return {
        success: false,
        status: 400,
        error:
          "TPS baru terdeteksi. Field wilayah (provinsi, kabKota, kecamatan, kelurahan, noTps) wajib disertakan.",
      };
    }

    await db.insert(tRekapKomparasi).values({
      idTps: input.idTps,
      provinsi: input.provinsi,
      kabKota: input.kabKota,
      kecamatan: input.kecamatan,
      kelurahan: input.kelurahan,
      noTps: Number(input.noTps),
      suaraPartaiSaksi: Number(input.suaraPartai),
      suaraCalegTotalSaksi: Number(input.suaraCaleg),
      fileC1PlanoUrl: fileUrl,
      inputSaksiTimestamp: new Date(),
      geoLat: input.geoLat,
      geoLong: input.geoLong,
      saksiUserId: userId,
      statusAnomali: "BELUM_TERVERIFIKASI",
    });
  }

  // Ambil record yang baru di-update/insert
  const [updated] = await db
    .select()
    .from(tRekapKomparasi)
    .where(eq(tRekapKomparasi.idTps, input.idTps))
    .limit(1);

  return {
    success: true,
    status: 200,
    data: updated,
  };
}
