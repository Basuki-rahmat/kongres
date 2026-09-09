import { Elysia, t } from "elysia";
import {
  // DPD
  getPengurusDpdList,
  getPengurusDpdById,
  createPengurusDpd,
  updatePengurusDpd,
  deletePengurusDpd,
  // DPC
  getPengurusDpcList,
  getPengurusDpcById,
  createPengurusDpc,
  updatePengurusDpc,
  deletePengurusDpc,
  // PAC
  getPengurusPacList,
  getPengurusPacById,
  createPengurusPac,
  updatePengurusPac,
  deletePengurusPac,
  // Anak Ranting
  getPengurusAnakRantingList,
  getPengurusAnakRantingById,
  createPengurusAnakRanting,
  updatePengurusAnakRanting,
  deletePengurusAnakRanting,
} from "../services/pengurus-services";

const BasePengurusSchema = {
  nama: t.String({ minLength: 1 }),
  jabatan: t.String({ minLength: 1 }),
  nik: t.Optional(t.String()),
  noKta: t.Optional(t.String()),
  noHp: t.Optional(t.String()),
  alamat: t.Optional(t.String()),
  fotoUrl: t.Optional(t.String()),
  fileSkUrl: t.Optional(t.String()),
  periodeMulai: t.Optional(t.Number()),
  periodeSelesai: t.Optional(t.Number()),
  statusAktif: t.Optional(t.Boolean()),
};

export const pengurusRoute = new Elysia({ prefix: "/api/pengurus" })
  // ===========================================================================
  // DPD (TINGKAT PROVINSI)
  // ===========================================================================
  .get(
    "/dpd",
    async ({ query }) => {
      const provinsiId = query.provinsiId ? Number(query.provinsiId) : undefined;
      const data = await getPengurusDpdList(provinsiId);
      return { data };
    },
    {
      query: t.Object({
        provinsiId: t.Optional(t.String()),
      }),
    }
  )
  .get("/dpd/:id", async ({ params, set }) => {
    const data = await getPengurusDpdById(Number(params.id));
    if (!data) {
      set.status = 404;
      return { error: "Pengurus DPD tidak ditemukan" };
    }
    return { data };
  })
  .post(
    "/dpd",
    async ({ body, set }) => {
      const data = await createPengurusDpd(body);
      set.status = 201;
      return { data };
    },
    {
      body: t.Object({
        provinsiId: t.Number(),
        ...BasePengurusSchema,
      }),
    }
  )
  .put(
    "/dpd/:id",
    async ({ params, body }) => {
      const data = await updatePengurusDpd(Number(params.id), body);
      return { data };
    },
    {
      body: t.Partial(
        t.Object({
          provinsiId: t.Number(),
          ...BasePengurusSchema,
        })
      ),
    }
  )
  .delete("/dpd/:id", async ({ params }) => {
    return await deletePengurusDpd(Number(params.id));
  })

  // ===========================================================================
  // DPC (TINGKAT KABUPATEN/KOTA)
  // ===========================================================================
  .get(
    "/dpc",
    async ({ query }) => {
      const kabupatenId = query.kabupatenId
        ? Number(query.kabupatenId)
        : undefined;
      const data = await getPengurusDpcList(kabupatenId);
      return { data };
    },
    {
      query: t.Object({
        kabupatenId: t.Optional(t.String()),
      }),
    }
  )
  .get("/dpc/:id", async ({ params, set }) => {
    const data = await getPengurusDpcById(Number(params.id));
    if (!data) {
      set.status = 404;
      return { error: "Pengurus DPC tidak ditemukan" };
    }
    return { data };
  })
  .post(
    "/dpc",
    async ({ body, set }) => {
      const data = await createPengurusDpc(body);
      set.status = 201;
      return { data };
    },
    {
      body: t.Object({
        kabupatenId: t.Number(),
        ...BasePengurusSchema,
      }),
    }
  )
  .put(
    "/dpc/:id",
    async ({ params, body }) => {
      const data = await updatePengurusDpc(Number(params.id), body);
      return { data };
    },
    {
      body: t.Partial(
        t.Object({
          kabupatenId: t.Number(),
          ...BasePengurusSchema,
        })
      ),
    }
  )
  .delete("/dpc/:id", async ({ params }) => {
    return await deletePengurusDpc(Number(params.id));
  })

  // ===========================================================================
  // PAC (TINGKAT KECAMATAN)
  // ===========================================================================
  .get(
    "/pac",
    async ({ query }) => {
      const kecamatanId = query.kecamatanId
        ? Number(query.kecamatanId)
        : undefined;
      const data = await getPengurusPacList(kecamatanId);
      return { data };
    },
    {
      query: t.Object({
        kecamatanId: t.Optional(t.String()),
      }),
    }
  )
  .get("/pac/:id", async ({ params, set }) => {
    const data = await getPengurusPacById(Number(params.id));
    if (!data) {
      set.status = 404;
      return { error: "Pengurus PAC tidak ditemukan" };
    }
    return { data };
  })
  .post(
    "/pac",
    async ({ body, set }) => {
      const data = await createPengurusPac(body);
      set.status = 201;
      return { data };
    },
    {
      body: t.Object({
        kecamatanId: t.Number(),
        ...BasePengurusSchema,
      }),
    }
  )
  .put(
    "/pac/:id",
    async ({ params, body }) => {
      const data = await updatePengurusPac(Number(params.id), body);
      return { data };
    },
    {
      body: t.Partial(
        t.Object({
          kecamatanId: t.Number(),
          ...BasePengurusSchema,
        })
      ),
    }
  )
  .delete("/pac/:id", async ({ params }) => {
    return await deletePengurusPac(Number(params.id));
  })

  // ===========================================================================
  // ANAK RANTING (TINGKAT DESA/KELURAHAN)
  // ===========================================================================
  .get(
    "/anak-ranting",
    async ({ query }) => {
      const desaId = query.desaId ? Number(query.desaId) : undefined;
      const data = await getPengurusAnakRantingList(desaId);
      return { data };
    },
    {
      query: t.Object({
        desaId: t.Optional(t.String()),
      }),
    }
  )
  .get("/anak-ranting/:id", async ({ params, set }) => {
    const data = await getPengurusAnakRantingById(Number(params.id));
    if (!data) {
      set.status = 404;
      return { error: "Pengurus Anak Ranting tidak ditemukan" };
    }
    return { data };
  })
  .post(
    "/anak-ranting",
    async ({ body, set }) => {
      const data = await createPengurusAnakRanting(body);
      set.status = 201;
      return { data };
    },
    {
      body: t.Object({
        desaId: t.Number(),
        ...BasePengurusSchema,
      }),
    }
  )
  .put(
    "/anak-ranting/:id",
    async ({ params, body }) => {
      const data = await updatePengurusAnakRanting(Number(params.id), body);
      return { data };
    },
    {
      body: t.Partial(
        t.Object({
          desaId: t.Number(),
          ...BasePengurusSchema,
        })
      ),
    }
  )
  .delete("/anak-ranting/:id", async ({ params }) => {
    return await deletePengurusAnakRanting(Number(params.id));
  });
