import { Elysia, t } from "elysia";
import {
  getProvinsiList,
  getKabupatenList,
  getKecamatanList,
  getDesaList,
} from "../services/wilayah-services";

export const wilayahRoute = new Elysia({ prefix: "/api/wilayah" })
  // GET /api/wilayah/provinsi
  .get("/provinsi", async () => {
    const data = await getProvinsiList();
    return { data };
  })

  // GET /api/wilayah/kabupaten?provinsiId=18
  .get(
    "/kabupaten",
    async ({ query }) => {
      const provinsiId = query.provinsiId ? Number(query.provinsiId) : undefined;
      const data = await getKabupatenList(provinsiId);
      return { data };
    },
    {
      query: t.Object({
        provinsiId: t.Optional(t.String()),
      }),
    }
  )

  // GET /api/wilayah/kecamatan?kabupatenId=1804
  .get(
    "/kecamatan",
    async ({ query }) => {
      const kabupatenId = query.kabupatenId
        ? Number(query.kabupatenId)
        : undefined;
      const data = await getKecamatanList(kabupatenId);
      return { data };
    },
    {
      query: t.Object({
        kabupatenId: t.Optional(t.String()),
      }),
    }
  )

  // GET /api/wilayah/desa?kecamatanId=1
  .get(
    "/desa",
    async ({ query }) => {
      const kecamatanId = query.kecamatanId
        ? Number(query.kecamatanId)
        : undefined;
      const data = await getDesaList(kecamatanId);
      return { data };
    },
    {
      query: t.Object({
        kecamatanId: t.Optional(t.String()),
      }),
    }
  );
