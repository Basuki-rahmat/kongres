import { Elysia, t } from "elysia";
import { jwtPlugin, verifyJwt, checkRole } from "../middlewares/auth-middleware";
import {
  getAnomaliListService,
  getExportBuktiService,
  updateCatatanHukumService,
  generatePdfService,
} from "../services/advokasi-services";

export const advokasiRoute = new Elysia({ prefix: "/api/v1/advokasi" })
  .use(jwtPlugin)

  // GET /api/v1/advokasi/anomali-list (ADVOKASI/ADMIN)
  .get(
    "/anomali-list",
    async ({ headers, jwt, query, set }) => {
      const user = await verifyJwt(headers, jwt.verify as any);
      if (!user) {
        set.status = 401;
        return { error: "Token tidak valid" };
      }
      if (!checkRole(user, "ADVOKASI", "ADMIN")) {
        set.status = 403;
        return { error: "Akses ditolak. Role ADVOKASI/ADMIN diperlukan." };
      }

      const result = await getAnomaliListService({
        provinsi: query.provinsi,
        kabKota: query.kabKota,
        kecamatan: query.kecamatan,
        status: query.status,
      });
      return result;
    },
    {
      query: t.Object({
        provinsi: t.Optional(t.String()),
        kabKota: t.Optional(t.String()),
        kecamatan: t.Optional(t.String()),
        status: t.Optional(t.String()),
      }),
    }
  )

  // GET /api/v1/advokasi/export-bukti/:id_tps (ADVOKASI/ADMIN)
  .get("/export-bukti/:id_tps", async ({ headers, jwt, params, set }) => {
    const user = await verifyJwt(headers, jwt.verify as any);
    if (!user) {
      set.status = 401;
      return { error: "Token tidak valid" };
    }
    if (!checkRole(user, "ADVOKASI", "ADMIN")) {
      set.status = 403;
      return { error: "Akses ditolak. Role ADVOKASI/ADMIN diperlukan." };
    }

    const result = await getExportBuktiService(params.id_tps);
    if (!result.success) {
      set.status = result.status;
      return { error: result.error };
    }
    return result;
  })

  // PUT /api/v1/advokasi/catatan-hukum/:id_tps (ADVOKASI/ADMIN)
  .put(
    "/catatan-hukum/:id_tps",
    async ({ headers, jwt, params, body, set }) => {
      const user = await verifyJwt(headers, jwt.verify as any);
      if (!user) {
        set.status = 401;
        return { error: "Token tidak valid" };
      }
      if (!checkRole(user, "ADVOKASI", "ADMIN")) {
        set.status = 403;
        return { error: "Akses ditolak. Role ADVOKASI/ADMIN diperlukan." };
      }

      const result = await updateCatatanHukumService(
        params.id_tps,
        body.catatan_hukum
      );
      if (!result.success) {
        set.status = result.status;
        return { error: result.error };
      }
      return result;
    },
    {
      body: t.Object({
        catatan_hukum: t.String({ minLength: 1 }),
      }),
    }
  )

  // GET /api/v1/advokasi/download-bukti-pdf/:id_tps (ADVOKASI/ADMIN)
  .get("/download-bukti-pdf/:id_tps", async ({ headers, jwt, params, set }) => {
    const user = await verifyJwt(headers, jwt.verify as any);
    if (!user) {
      set.status = 401;
      return { error: "Token tidak valid" };
    }
    if (!checkRole(user, "ADVOKASI", "ADMIN")) {
      set.status = 403;
      return { error: "Akses ditolak. Role ADVOKASI/ADMIN diperlukan." };
    }

    const result = await generatePdfService(params.id_tps);
    if (!result.success) {
      set.status = result.status;
      return { error: result.error };
    }

    return new Response(result.data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  });
