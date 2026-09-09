import { Elysia, t } from "elysia";
import { jwtPlugin } from "./auth-route";
import {
  normalizeKpuResponse,
  updateRekapFromKpu,
} from "../services/kpu-scraper-services";
import { runOneCycle, getWorkerStatus } from "../workers/kpu-worker";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tRekapKomparasi } from "../db/schema";

export const kpuRoute = new Elysia({ prefix: "/api/v1/kpu" })
  .use(jwtPlugin)

  // -----------------------------------------------------------------------
  // GET /api/v1/kpu/scrape-status
  // Status worker scraper (admin)
  // -----------------------------------------------------------------------
  .get("/scrape-status", async ({ headers, jwt, set }) => {
    const payload = await verifyAdmin(headers, jwt);
    if (!payload) {
      set.status = 403;
      return { error: "Akses ditolak. Role ADMIN diperlukan." };
    }

    const status = getWorkerStatus();
    return { data: status };
  })

  // -----------------------------------------------------------------------
  // POST /api/v1/kpu/trigger-scrape
  // Trigger satu siklus scraping secara manual (admin on-demand)
  // -----------------------------------------------------------------------
  .post("/trigger-scrape", async ({ headers, jwt, set }) => {
    const payload = await verifyAdmin(headers, jwt);
    if (!payload) {
      set.status = 403;
      return { error: "Akses ditolak. Role ADMIN diperlukan." };
    }

    console.log(
      `[KPU Route] Scraping di-trigger manual oleh admin id=${payload.id}`
    );

    // Jalankan async tanpa blocking response
    runOneCycle().then((stats) => {
      if (stats) {
        console.log(
          `[KPU Route] Trigger selesai: ${stats.sukses}/${stats.totalTps} TPS diproses.`
        );
      }
    });

    return {
      message:
        "Scraping dimulai di background. Cek /api/v1/kpu/scrape-status untuk progres.",
    };
  })

  // -----------------------------------------------------------------------
  // PUT /api/v1/kpu/update-manual/:id_tps
  // Input/simulasi data KPU secara manual untuk satu TPS (admin)
  // Digunakan saat API KPU resmi belum tersedia / untuk pengujian
  // -----------------------------------------------------------------------
  .put(
    "/update-manual/:id_tps",
    async ({ headers, jwt, params, body, set }) => {
      const payload = await verifyAdmin(headers, jwt);
      if (!payload) {
        set.status = 403;
        return { error: "Akses ditolak. Role ADMIN diperlukan." };
      }

      // Cek apakah TPS ada di database
      const [existing] = await db
        .select({ idTps: tRekapKomparasi.idTps })
        .from(tRekapKomparasi)
        .where(eq(tRekapKomparasi.idTps, params.id_tps))
        .limit(1);

      if (!existing) {
        set.status = 404;
        return {
          error: `TPS ${params.id_tps} tidak ditemukan. Upload C1 terlebih dahulu.`,
        };
      }

      // Normalisasi dan simpan data KPU
      const kpuData = normalizeKpuResponse({
        suara_partai: body.suara_partai_kpu,
        suara_caleg: body.suara_caleg_kpu,
        total_suara: body.total_suara_kpu,
      });

      const { statusAnomali, selisih } = await updateRekapFromKpu(
        params.id_tps,
        kpuData
      );

      // Ambil data lengkap untuk respon
      const [updated] = await db
        .select()
        .from(tRekapKomparasi)
        .where(eq(tRekapKomparasi.idTps, params.id_tps))
        .limit(1);

      return {
        message: "Data KPU berhasil diperbarui",
        idTps: params.id_tps,
        statusAnomali,
        selisihSuara: selisih,
        data: updated,
      };
    },
    {
      body: t.Object({
        suara_partai_kpu: t.Number({ minimum: 0 }),
        suara_caleg_kpu: t.Number({ minimum: 0 }),
        total_suara_kpu: t.Number({ minimum: 0 }),
      }),
    }
  );

// =============================================================================
// HELPER: Verifikasi Admin JWT
// =============================================================================
async function verifyAdmin(
  headers: Record<string, string | undefined>,
  jwt: any
): Promise<{ id: number; role: string } | null> {
  const authHeader = headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);
  const payload = (await jwt.verify(token)) as {
    id: number;
    role: string;
  } | false;

  if (!payload || !payload.id) return null;
  if (payload.role !== "ADMIN") return null;

  return payload;
}
