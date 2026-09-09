import { Elysia, t } from "elysia";
import { jwtPlugin } from "./auth-route";
import {
  getAnomaliListService,
  getExportBuktiService,
  updateCatatanHukumService,
  generatePdfService,
} from "../services/advokasi-services";

export const advokasiRoute = new Elysia({ prefix: "/api/v1/advokasi" })
  .use(jwtPlugin)

  // GET /api/v1/advokasi/anomali-list
  .get(
    "/anomali-list",
    async ({ query }) => {
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

  // GET /api/v1/advokasi/export-bukti/:id_tps
  .get("/export-bukti/:id_tps", async ({ params, set }) => {
    const result = await getExportBuktiService(params.id_tps);
    if (!result.success) {
      set.status = result.status;
      return { error: result.error };
    }
    return result;
  })

  // PUT /api/v1/advokasi/catatan-hukum/:id_tps
  .put(
    "/catatan-hukum/:id_tps",
    async ({ params, body, set }) => {
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

  // GET /api/v1/advokasi/download-bukti-pdf/:id_tps
  // Download dokumen PDF bukti sengketa
  .get("/download-bukti-pdf/:id_tps", async ({ params, set }) => {
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
