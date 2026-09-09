import { runScrapingCycle, type ScrapeStats } from "../services/kpu-scraper-services";

// =============================================================================
// STATE WORKER
// =============================================================================
let workerTimer: ReturnType<typeof setInterval> | null = null;
let isRunning = false;
let lastStats: ScrapeStats | null = null;
let totalCycles = 0;
let workerStartedAt: Date | null = null;

// =============================================================================
// MULAI BACKGROUND WORKER
// =============================================================================
export function startKpuWorker() {
  if (workerTimer) {
    console.log("[KPU Worker] Worker sudah berjalan, skip start.");
    return;
  }

  const intervalMinutes =
    Number(process.env.KPU_SCRAPE_INTERVAL_MINUTES) || 5;
  const intervalMs = intervalMinutes * 60 * 1000;

  workerStartedAt = new Date();

  console.log(
    `[KPU Worker] 🚀 Background worker aktif. Interval: setiap ${intervalMinutes} menit.`
  );

  // Jalankan satu kali saat start (delayed 10 detik agar server siap)
  setTimeout(async () => {
    await runOneCycle();
  }, 10_000);

  // Jadwalkan secara berkala
  workerTimer = setInterval(async () => {
    await runOneCycle();
  }, intervalMs);
}

// =============================================================================
// HENTIKAN BACKGROUND WORKER
// =============================================================================
export function stopKpuWorker() {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
    console.log("[KPU Worker] 🛑 Worker dihentikan.");
  }
}

// =============================================================================
// JALANKAN SATU SIKLUS (dengan proteksi agar tidak overlap)
// =============================================================================
export async function runOneCycle(): Promise<ScrapeStats | null> {
  if (isRunning) {
    console.log("[KPU Worker] ⏳ Siklus sebelumnya masih berjalan, skip.");
    return null;
  }

  isRunning = true;
  totalCycles++;

  try {
    lastStats = await runScrapingCycle();
    return lastStats;
  } catch (err: any) {
    console.error(`[KPU Worker] ❌ Error dalam siklus: ${err.message}`);
    return null;
  } finally {
    isRunning = false;
  }
}

// =============================================================================
// STATUS WORKER
// =============================================================================
export function getWorkerStatus() {
  const intervalMinutes =
    Number(process.env.KPU_SCRAPE_INTERVAL_MINUTES) || 5;

  return {
    aktif: workerTimer !== null,
    sedangBerjalan: isRunning,
    intervalMenit: intervalMinutes,
    totalSiklus: totalCycles,
    mulaiSejak: workerStartedAt?.toISOString() || null,
    statistikTerakhir: lastStats
      ? {
          totalTps: lastStats.totalTps,
          sukses: lastStats.sukses,
          gagal: lastStats.gagal,
          match: lastStats.match,
          anomali: lastStats.anomali,
          mulai: lastStats.startedAt?.toISOString(),
          selesai: lastStats.finishedAt?.toISOString(),
        }
      : null,
  };
}
