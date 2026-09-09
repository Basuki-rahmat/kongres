import { Elysia, t } from "elysia";
import { jwtPlugin } from "./auth-route";
import {
  uploadC1Service,
  getRekapListService,
  getRekapByIdTpsService,
} from "../services/saksi-services";

export const saksiRoute = new Elysia({ prefix: "/api/v1/saksi" })
  .use(jwtPlugin)

  // -----------------------------------------------------------------------
  // POST /api/v1/saksi/upload-c1
  // Input data hasil C1 fisik dari saksi TPS (suara + foto + GPS)
  // -----------------------------------------------------------------------
  .post(
    "/upload-c1",
    async ({ headers, jwt, body, set }) => {
      // Verifikasi JWT untuk mendapatkan userId
      const authHeader = headers["authorization"];
      let userId: number | undefined;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const payload = (await jwt.verify(token)) as {
          id: number;
          role: string;
        } | false;

        if (payload && payload.id) {
          userId = payload.id;
        }
      }

      const result = await uploadC1Service(
        {
          idTps: body.id_tps,
          provinsi: body.provinsi,
          kabKota: body.kab_kota,
          kecamatan: body.kecamatan,
          kelurahan: body.kelurahan,
          noTps: body.no_tps,
          suaraPartai: body.suara_partai,
          suaraCaleg: body.suara_caleg,
          geoLat: body.geo_lat,
          geoLong: body.geo_long,
          fileBase64: body.file_base64,
        },
        userId
      );

      if (!result.success) {
        set.status = result.status;
        return { error: result.error };
      }

      set.status = result.status;
      return {
        message: "Data Form C1 berhasil diinput",
        data: result.data,
      };
    },
    {
      body: t.Object({
        id_tps: t.String({ minLength: 1 }),
        provinsi: t.Optional(t.String()),
        kab_kota: t.Optional(t.String()),
        kecamatan: t.Optional(t.String()),
        kelurahan: t.Optional(t.String()),
        no_tps: t.Optional(t.Number()),
        suara_partai: t.Number({ minimum: 0 }),
        suara_caleg: t.Number({ minimum: 0 }),
        geo_lat: t.Optional(t.String()),
        geo_long: t.Optional(t.String()),
        file_base64: t.Optional(t.String()),
      }),
    }
  )

  // -----------------------------------------------------------------------
  // GET /api/v1/saksi/rekap
  // Daftar seluruh hasil rekap C1 yang sudah diinput saksi
  // Query: ?provinsi=...&kabKota=...&kecamatan=...&statusAnomali=...
  // -----------------------------------------------------------------------
  .get(
    "/rekap",
    async ({ query }) => {
      const result = await getRekapListService({
        provinsi: query.provinsi,
        kabKota: query.kabKota,
        kecamatan: query.kecamatan,
        statusAnomali: query.statusAnomali,
      });
      return result;
    },
    {
      query: t.Object({
        provinsi: t.Optional(t.String()),
        kabKota: t.Optional(t.String()),
        kecamatan: t.Optional(t.String()),
        statusAnomali: t.Optional(t.String()),
      }),
    }
  )

  // -----------------------------------------------------------------------
  // GET /api/v1/saksi/rekap/:id_tps
  // Detail rekap C1 dan komparasi satu TPS berdasarkan ID TPS
  // -----------------------------------------------------------------------
  .get("/rekap/:id_tps", async ({ params, set }) => {
    const result = await getRekapByIdTpsService(params.id_tps);
    if (!result.success) {
      set.status = result.status;
      return { error: result.error };
    }
    return result;
  });
