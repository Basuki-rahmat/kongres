import { Elysia, t } from "elysia";
import { jwtPlugin, verifyJwt, checkRole } from "../middlewares/auth-middleware";
import {
  getPengurusDpdList,
  getPengurusDpdById,
  createPengurusDpd,
  updatePengurusDpd,
  deletePengurusDpd,
  getPengurusDpcList,
  getPengurusDpcById,
  createPengurusDpc,
  updatePengurusDpc,
  deletePengurusDpc,
  getPengurusPacList,
  getPengurusPacById,
  createPengurusPac,
  updatePengurusPac,
  deletePengurusPac,
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

async function requireAdmin(headers: Record<string, string | undefined>, jwt: any) {
  const user = await verifyJwt(headers, jwt.verify as any);
  if (!user) return null;
  if (!checkRole(user, "ADMIN")) return null;
  return user;
}

export const pengurusRoute = new Elysia({ prefix: "/api/pengurus" })
  .use(jwtPlugin)

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
    async ({ headers, jwt, body, set }) => {
      const user = await requireAdmin(headers, jwt);
      if (!user) {
        set.status = 403;
        return { error: "Akses ditolak. Role ADMIN diperlukan." };
      }
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
    async ({ headers, jwt, params, body, set }) => {
      const user = await requireAdmin(headers, jwt);
      if (!user) {
        set.status = 403;
        return { error: "Akses ditolak. Role ADMIN diperlukan." };
      }
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
  .delete("/dpd/:id", async ({ headers, jwt, params, set }) => {
    const user = await requireAdmin(headers, jwt);
    if (!user) {
      set.status = 403;
      return { error: "Akses ditolak. Role ADMIN diperlukan." };
    }
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
    async ({ headers, jwt, body, set }) => {
      const user = await requireAdmin(headers, jwt);
      if (!user) {
        set.status = 403;
        return { error: "Akses ditolak. Role ADMIN diperlukan." };
      }
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
    async ({ headers, jwt, params, body, set }) => {
      const user = await requireAdmin(headers, jwt);
      if (!user) {
        set.status = 403;
        return { error: "Akses ditolak. Role ADMIN diperlukan." };
      }
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
  .delete("/dpc/:id", async ({ headers, jwt, params, set }) => {
    const user = await requireAdmin(headers, jwt);
    if (!user) {
      set.status = 403;
      return { error: "Akses ditolak. Role ADMIN diperlukan." };
    }
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
    async ({ headers, jwt, body, set }) => {
      const user = await requireAdmin(headers, jwt);
      if (!user) {
        set.status = 403;
        return { error: "Akses ditolak. Role ADMIN diperlukan." };
      }
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
    async ({ headers, jwt, params, body, set }) => {
      const user = await requireAdmin(headers, jwt);
      if (!user) {
        set.status = 403;
        return { error: "Akses ditolak. Role ADMIN diperlukan." };
      }
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
  .delete("/pac/:id", async ({ headers, jwt, params, set }) => {
    const user = await requireAdmin(headers, jwt);
    if (!user) {
      set.status = 403;
      return { error: "Akses ditolak. Role ADMIN diperlukan." };
    }
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
    async ({ headers, jwt, body, set }) => {
      const user = await requireAdmin(headers, jwt);
      if (!user) {
        set.status = 403;
        return { error: "Akses ditolak. Role ADMIN diperlukan." };
      }
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
    async ({ headers, jwt, params, body, set }) => {
      const user = await requireAdmin(headers, jwt);
      if (!user) {
        set.status = 403;
        return { error: "Akses ditolak. Role ADMIN diperlukan." };
      }
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
  .delete("/anak-ranting/:id", async ({ headers, jwt, params, set }) => {
    const user = await requireAdmin(headers, jwt);
    if (!user) {
      set.status = 403;
      return { error: "Akses ditolak. Role ADMIN diperlukan." };
    }
    return await deletePengurusAnakRanting(Number(params.id));
  });
