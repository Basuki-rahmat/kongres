import { and, eq, not, sql } from "drizzle-orm";
import { db } from "../db";
import { tRekapKomparasi } from "../db/schema";
import { generatePdfBuktiSengketa } from "./pdf-generator";

export interface AnomaliFilter {
  provinsi?: string;
  kabKota?: string;
  kecamatan?: string;
  status?: string;
}

/**
 * Mengambil daftar TPS yang mengalami anomali selisih suara (Red Flag)
 */
export async function getAnomaliListService(filter: AnomaliFilter) {
  const conditions = [];

  if (filter.provinsi) {
    conditions.push(eq(tRekapKomparasi.provinsi, filter.provinsi));
  }
  if (filter.kabKota) {
    conditions.push(eq(tRekapKomparasi.kabKota, filter.kabKota));
  }
  if (filter.kecamatan) {
    conditions.push(eq(tRekapKomparasi.kecamatan, filter.kecamatan));
  }

  // Filter status anomali: jika ditentukan gunakan nilai tsb,
  // jika tidak ditentukan bawaan cari semua TPS bermasalah (bukan MATCH dan bukan BELUM_TERVERIFIKASI)
  if (filter.status) {
    conditions.push(eq(tRekapKomparasi.statusAnomali, filter.status));
  } else {
    conditions.push(
      sql`${tRekapKomparasi.statusAnomali} IN ('MISMATCH_KPU_OVER', 'MISMATCH_KPU_UNDER')`
    );
  }

  const list = await db
    .select()
    .from(tRekapKomparasi)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(tRekapKomparasi.provinsi, tRekapKomparasi.kabKota, tRekapKomparasi.noTps);

  return {
    totalAnomali: list.length,
    data: list,
  };
}

/**
 * Menghasilkan data komparasi komprehensif untuk lampiran gugatan sengketa pleno KPU
 */
export async function getExportBuktiService(idTps: string) {
  const [data] = await db
    .select()
    .from(tRekapKomparasi)
    .where(eq(tRekapKomparasi.idTps, idTps))
    .limit(1);

  if (!data) {
    return {
      success: false,
      status: 404,
      error: `Data rekap untuk TPS ${idTps} tidak ditemukan`,
    };
  }

  // Susun berkas komparasi bukti sengketa hukum
  const berkasSengketa = {
    metadata: {
      nomorBerkas: `SPM-BUKTI-${data.idTps}-${Date.now()}`,
      tanggalDibuat: new Date().toISOString(),
      klasifikasi: "DOKUMEN RAHASIA INTERNAL SENGKETA PEMILU",
    },
    wilayahTps: {
      idTps: data.idTps,
      provinsi: data.provinsi,
      kabKota: data.kabKota,
      kecamatan: data.kecamatan,
      kelurahan: data.kelurahan,
      noTps: data.noTps,
    },
    dataSaksiInternal: {
      suaraPartai: data.suaraPartaiSaksi,
      suaraCalegTotal: data.suaraCalegTotalSaksi,
      totalSuara: data.totalSuaraInternal,
      fileC1PlanoUrl: data.fileC1PlanoUrl,
      inputTimestamp: data.inputSaksiTimestamp,
      koordinatGps: {
        lat: data.geoLat,
        long: data.geoLong,
      },
    },
    dataKpu: {
      suaraPartai: data.suaraPartaiKpu,
      suaraCalegTotal: data.suaraCalegTotalKpu,
      totalSuara: data.totalSuaraKpu,
      lastScrapeTimestamp: data.lastScrapeTimestamp,
    },
    analisisSelisih: {
      selisihSuara: data.selisihSuara,
      statusAnomali: data.statusAnomali,
      keterangan:
        data.statusAnomali === "MISMATCH_KPU_OVER"
          ? "PERINGATAN: Suara KPU terindikasi menggelembung tak wajar (Overcounted)"
          : data.statusAnomali === "MISMATCH_KPU_UNDER"
          ? "PERINGATAN: Suara Partai di KPU terindikasi berkurang/hilang (Undercounted)"
          : "Data Suara Sesuai (Match)",
    },
    catatanHukum: data.catatanHukum || "Belum ada catatan hukum tambahan.",
    protokolSanggahanPleno: [
      "Step 1: Sistem mengirimkan Push Notification ke Tim Hukum Wilayah/Kecamatan terkait.",
      "Step 2: Tim Hukum mengunduh Bukti Komparasi Otomatis dari aplikasi SPM ini.",
      "Step 3: Saksi Partai di Pleno mengajukan Form Keberatan Saksi (Model KPU) sebelum rekapitulasi tingkat kecamatan disahkan, dengan menyandingkan data komparasi ini dan mencocokkannya langsung dengan Kotak Suara / Form C1 Plano fisik asli di ruang sidang.",
    ],
  };

  return {
    success: true,
    status: 200,
    data: berkasSengketa,
  };
}

/**
 * Menyimpan atau memperbarui catatan hukum / telaah sengketa TPS
 */
export async function updateCatatanHukumService(
  idTps: string,
  catatanHukum: string
) {
  const [existing] = await db
    .select()
    .from(tRekapKomparasi)
    .where(eq(tRekapKomparasi.idTps, idTps))
    .limit(1);

  if (!existing) {
    return {
      success: false,
      status: 404,
      error: `Data rekap untuk TPS ${idTps} tidak ditemukan`,
    };
  }

  await db
    .update(tRekapKomparasi)
    .set({ catatanHukum })
    .where(eq(tRekapKomparasi.idTps, idTps));

  return {
    success: true,
    status: 200,
    message: "Catatan hukum berhasil disimpan",
    idTps,
    catatanHukum,
  };
}

// =============================================================================
// GENERATE PDF BUKTI SENGKETA
// =============================================================================
export async function generatePdfService(idTps: string) {
  const [data] = await db
    .select()
    .from(tRekapKomparasi)
    .where(eq(tRekapKomparasi.idTps, idTps))
    .limit(1);

  if (!data) {
    return {
      success: false,
      status: 404,
      error: `Data rekap untuk TPS ${idTps} tidak ditemukan`,
    };
  }

  // Susun data untuk PDF
  const berkasSengketa = {
    metadata: {
      nomorBerkas: `SPM-BUKTI-${data.idTps}-${Date.now()}`,
      tanggalDibuat: new Date().toISOString(),
      klasifikasi: "DOKUMEN RAHASIA INTERNAL SENGKETA PEMILU",
    },
    wilayahTps: {
      idTps: data.idTps,
      provinsi: data.provinsi,
      kabKota: data.kabKota,
      kecamatan: data.kecamatan,
      kelurahan: data.kelurahan,
      noTps: data.noTps,
    },
    dataSaksiInternal: {
      suaraPartai: data.suaraPartaiSaksi,
      suaraCalegTotal: data.suaraCalegTotalSaksi,
      totalSuara: data.totalSuaraInternal,
      fileC1PlanoUrl: data.fileC1PlanoUrl,
      inputTimestamp: data.inputSaksiTimestamp,
      koordinatGps: {
        lat: data.geoLat,
        long: data.geoLong,
      },
    },
    dataKpu: {
      suaraPartai: data.suaraPartaiKpu,
      suaraCalegTotal: data.suaraCalegTotalKpu,
      totalSuara: data.totalSuaraKpu,
      lastScrapeTimestamp: data.lastScrapeTimestamp,
    },
    analisisSelisih: {
      selisihSuara: data.selisihSuara,
      statusAnomali: data.statusAnomali || "BELUM_TERVERIFIKASI",
      keterangan:
        data.statusAnomali === "MISMATCH_KPU_OVER"
          ? "PERINGATAN: Suara KPU terindikasi menggelembung tak wajar (Overcounted)"
          : data.statusAnomali === "MISMATCH_KPU_UNDER"
            ? "PERINGATAN: Suara Partai di KPU terindikasi berkurang/hilang (Undercounted)"
            : "Data Suara Sesuai (Match)",
    },
    catatanHukum: data.catatanHukum || "Belum ada catatan hukum tambahan.",
    protokolSanggahanPleno: [
      "Step 1: Sistem mengirimkan Push Notification ke Tim Hukum Wilayah/Kecamatan terkait.",
      "Step 2: Tim Hukum mengunduh Bukti Komparasi Otomatis dari aplikasi SPM ini.",
      "Step 3: Saksi Partai di Pleno mengajukan Form Keberatan Saksi (Model KPU) sebelum rekapitulasi tingkat kecamatan disahkan, dengan menyandingkan data komparasi ini dan mencocokkannya langsung dengan Kotak Suara / Form C1 Plano fisik asli di ruang sidang.",
    ],
  };

  // Generate PDF
  const pdfBytes = await generatePdfBuktiSengketa(berkasSengketa);

  return {
    success: true,
    status: 200,
    filename: `bukti-sengketa-${data.idTps}.pdf`,
    contentType: "application/pdf",
    data: pdfBytes,
  };
}
