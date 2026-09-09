import { eq } from "drizzle-orm";
import { db } from "../db";
import { tRekapKomparasi } from "../db/schema";

// =============================================================================
// TIPE DATA
// =============================================================================
export interface KpuRawResponse {
  suara_partai?: number;
  suara_caleg?: number;
  total_suara?: number;
  [key: string]: any;
}

export interface KpuNormalizedData {
  suaraPartai: number;
  suaraCaleg: number;
  totalSuara: number;
}

// Log statistik satu siklus scraping
export interface ScrapeStats {
  totalTps: number;
  sukses: number;
  gagal: number;
  match: number;
  anomali: number;
  startedAt: Date;
  finishedAt?: Date;
}

// =============================================================================
// ADAPTER: NORMALISASI RESPONS KPU
// Ganti implementasi fungsi ini saat format API KPU resmi tersedia
// =============================================================================
export function normalizeKpuResponse(raw: KpuRawResponse): KpuNormalizedData {
  // Format 1: Struktur langsung { suara_partai, suara_caleg, total_suara }
  if (raw.suara_partai !== undefined) {
    return {
      suaraPartai: Number(raw.suara_partai) || 0,
      suaraCaleg: Number(raw.suara_caleg) || 0,
      totalSuara:
        Number(raw.total_suara) ||
        (Number(raw.suara_partai) + Number(raw.suara_caleg)),
    };
  }

  // Format 2: Sirekap KPU (adaptasi dari format objek chart/table)
  if (raw.chart || raw.table) {
    const chart = raw.chart || {};
    const suaraPartai = Number(chart["101"] || chart["partai"] || 0);
    const suaraCaleg = Number(chart["102"] || chart["caleg"] || 0);
    return {
      suaraPartai,
      suaraCaleg,
      totalSuara: suaraPartai + suaraCaleg,
    };
  }

  // Fallback: semua nol (tidak dikenali)
  return { suaraPartai: 0, suaraCaleg: 0, totalSuara: 0 };
}

// =============================================================================
// FETCH DATA KPU UNTUK SATU TPS
// =============================================================================
export async function fetchKpuData(
  idTps: string
): Promise<KpuNormalizedData | null> {
  const baseUrl =
    process.env.KPU_API_BASE_URL || "https://sirekap-obj-data.kpu.go.id";

  // Contoh URL Sirekap: /pemilu/results/0/0/0/{kode_tps}.json
  // id_tps pada sistem internal digunakan sebagai kode referensi.
  // TODO: Sesuaikan mapping id_tps -> kode_wilayah_kpu saat URL resmi tersedia.
  const url = `${baseUrl}/pemilu/results/0/0/0/${idTps}.json`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // timeout 10 detik

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SPM-Kongres-Scraper/1.0)",
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `[KPU Scraper] HTTP ${response.status} untuk TPS ${idTps}: ${url}`
      );
      return null;
    }

    const raw = (await response.json()) as KpuRawResponse;
    return normalizeKpuResponse(raw);
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.warn(`[KPU Scraper] Timeout untuk TPS ${idTps}`);
    } else {
      console.warn(`[KPU Scraper] Gagal fetch TPS ${idTps}: ${err.message}`);
    }
    return null;
  }
}

// =============================================================================
// UPDATE DATABASE DARI DATA KPU + DETEKSI ANOMALI OTOMATIS
// =============================================================================
export async function updateRekapFromKpu(
  idTps: string,
  kpuData: KpuNormalizedData
): Promise<{ statusAnomali: string; selisih: number }> {
  // Ambil data saksi internal terkini
  const [existing] = await db
    .select()
    .from(tRekapKomparasi)
    .where(eq(tRekapKomparasi.idTps, idTps))
    .limit(1);

  if (!existing) {
    throw new Error(`TPS ${idTps} tidak ditemukan di database`);
  }

  const totalInternal =
    (Number(existing.suaraPartaiSaksi) || 0) +
    (Number(existing.suaraCalegTotalSaksi) || 0);
  const totalKpu = kpuData.totalSuara;

  // Tentukan status anomali
  let statusAnomali: string;
  if (totalInternal === 0 && totalKpu === 0) {
    statusAnomali = "BELUM_TERVERIFIKASI";
  } else if (totalInternal === totalKpu) {
    statusAnomali = "MATCH";
  } else if (totalKpu > totalInternal) {
    statusAnomali = "MISMATCH_KPU_OVER";
  } else {
    statusAnomali = "MISMATCH_KPU_UNDER";
  }

  // Simpan ke database
  await db
    .update(tRekapKomparasi)
    .set({
      suaraPartaiKpu: kpuData.suaraPartai,
      suaraCalegTotalKpu: kpuData.suaraCaleg,
      totalSuaraKpu: kpuData.totalSuara,
      lastScrapeTimestamp: new Date(),
      statusAnomali,
    })
    .where(eq(tRekapKomparasi.idTps, idTps));

  if (statusAnomali !== "MATCH" && statusAnomali !== "BELUM_TERVERIFIKASI") {
    console.warn(
      `[KPU Scraper] ⚠️  ANOMALI TERDETEKSI! TPS ${idTps}: ${statusAnomali} | Internal=${totalInternal} | KPU=${totalKpu} | Selisih=${totalInternal - totalKpu}`
    );
  }

  return { statusAnomali, selisih: totalInternal - totalKpu };
}

// =============================================================================
// SATU SIKLUS SCRAPING SELURUH TPS
// =============================================================================
export async function runScrapingCycle(): Promise<ScrapeStats> {
  const stats: ScrapeStats = {
    totalTps: 0,
    sukses: 0,
    gagal: 0,
    match: 0,
    anomali: 0,
    startedAt: new Date(),
  };

  console.log("[KPU Worker] 🔄 Memulai siklus scraping...");

  // Ambil semua TPS yang sudah ada data saksinya
  const allTps = await db
    .select({
      idTps: tRekapKomparasi.idTps,
      inputSaksiTimestamp: tRekapKomparasi.inputSaksiTimestamp,
      lastScrapeTimestamp: tRekapKomparasi.lastScrapeTimestamp,
    })
    .from(tRekapKomparasi)
    .where(eq(tRekapKomparasi.statusAnomali, "BELUM_TERVERIFIKASI"));

  stats.totalTps = allTps.length;

  if (stats.totalTps === 0) {
    console.log("[KPU Worker] ℹ️  Tidak ada TPS yang perlu di-scrape.");
    stats.finishedAt = new Date();
    return stats;
  }

  console.log(`[KPU Worker] 📋 Memproses ${stats.totalTps} TPS...`);

  for (const tps of allTps) {
    try {
      const kpuData = await fetchKpuData(tps.idTps);

      if (!kpuData) {
        stats.gagal++;
        continue;
      }

      const { statusAnomali } = await updateRekapFromKpu(tps.idTps, kpuData);
      stats.sukses++;

      if (statusAnomali === "MATCH") {
        stats.match++;
      } else if (
        statusAnomali === "MISMATCH_KPU_OVER" ||
        statusAnomali === "MISMATCH_KPU_UNDER"
      ) {
        stats.anomali++;
      }

      // Jeda singkat antar request agar tidak membebani server KPU
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (err: any) {
      console.error(
        `[KPU Worker] ❌ Error saat proses TPS ${tps.idTps}: ${err.message}`
      );
      stats.gagal++;
    }
  }

  stats.finishedAt = new Date();
  const durasi = (stats.finishedAt.getTime() - stats.startedAt.getTime()) / 1000;

  console.log(
    `[KPU Worker] ✅ Siklus selesai dalam ${durasi.toFixed(1)}s | ` +
      `Total: ${stats.totalTps} | Sukses: ${stats.sukses} | Gagal: ${stats.gagal} | ` +
      `Match: ${stats.match} | Anomali: ${stats.anomali}`
  );

  return stats;
}
