import { Elysia, t } from "elysia";
import { jwtPlugin, verifyJwt, checkRole } from "../middlewares/auth-middleware";
import {
  normalizeKpuResponse,
  updateRekapFromKpu,
} from "../services/kpu-scraper-services";
import { runOneCycle, getWorkerStatus } from "../workers/kpu-worker";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tRekapKomparasi } from "../db/schema";

async function requireAdmin(headers: Record<string, string | undefined>, jwt: any) {
  const user = await verifyJwt(headers, jwt.verify as any);
  if (!user) return null;
  if (!checkRole(user, "ADMIN")) return null;
  return user;
}

export const kpuRoute = new Elysia({ prefix: "/api/v1/kpu" })
  .use(jwtPlugin)

  // GET /api/v1/kpu/scrape-status (ADMIN)
  .get("/scrape-status", async ({ headers, jwt, set }) => {
    const user = await requireAdmin(headers, jwt);
    if (!user) {
      set.status = 403;
      return { error: "Akses ditolak. Role ADMIN diperlukan." };
    }
    return { data: getWorkerStatus() };
  })

  // POST /api/v1/kpu/trigger-scrape (ADMIN)
  .post("/trigger-scrape", async ({ headers, jwt, set }) => {
    const user = await requireAdmin(headers, jwt);
    if (!user) {
      set.status = 403;
      return { error: "Akses ditolak. Role ADMIN diperlukan." };
    }

    console.log(`[KPU Route] Scraping di-trigger manual oleh admin id=${user.id}`);

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

  // PUT /api/v1/kpu/update-manual/:id_tps (ADMIN)
  .put(
    "/update-manual/:id_tps",
    async ({ headers, jwt, params, body, set }) => {
      const user = await requireAdmin(headers, jwt);
      if (!user) {
        set.status = 403;
        return { error: "Akses ditolak. Role ADMIN diperlukan." };
      }

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

      const kpuData = normalizeKpuResponse({
        suara_partai: body.suara_partai_kpu,
        suara_caleg: body.suara_caleg_kpu,
        total_suara: body.total_suara_kpu,
      });

      const { statusAnomali, selisih } = await updateRekapFromKpu(
        params.id_tps,
        kpuData
      );

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
