import { eq } from "drizzle-orm";
import { db } from "../db";
import {
  pengurusDpd,
  pengurusDpc,
  pengurusPac,
  pengurusAnakRanting,
  type NewPengurusDpd,
  type NewPengurusDpc,
  type NewPengurusPac,
  type NewPengurusAnakRanting,
} from "../db/schema";

// =============================================================================
// SERVICES PENGURUS DPD (TINGKAT PROVINSI)
// =============================================================================
export async function getPengurusDpdList(provinsiId?: number) {
  return await db.query.pengurusDpd.findMany({
    where: provinsiId ? (t, { eq }) => eq(t.provinsiId, provinsiId) : undefined,
    with: {
      provinsi: true,
    },
    orderBy: (t, { asc }) => [asc(t.nama)],
  });
}

export async function getPengurusDpdById(id: number) {
  const result = await db.query.pengurusDpd.findFirst({
    where: (t, { eq }) => eq(t.id, id),
    with: {
      provinsi: true,
    },
  });
  return result || null;
}

export async function createPengurusDpd(data: NewPengurusDpd) {
  const [res] = await db.insert(pengurusDpd).values(data);
  return { id: res.insertId, ...data };
}

export async function updatePengurusDpd(
  id: number,
  data: Partial<NewPengurusDpd>
) {
  await db.update(pengurusDpd).set(data).where(eq(pengurusDpd.id, id));
  return await getPengurusDpdById(id);
}

export async function deletePengurusDpd(id: number) {
  await db.delete(pengurusDpd).where(eq(pengurusDpd.id, id));
  return { success: true };
}

// =============================================================================
// SERVICES PENGURUS DPC (TINGKAT KABUPATEN/KOTA)
// =============================================================================
export async function getPengurusDpcList(kabupatenId?: number) {
  return await db.query.pengurusDpc.findMany({
    where: kabupatenId
      ? (t, { eq }) => eq(t.kabupatenId, kabupatenId)
      : undefined,
    with: {
      kabupaten: true,
    },
    orderBy: (t, { asc }) => [asc(t.nama)],
  });
}

export async function getPengurusDpcById(id: number) {
  const result = await db.query.pengurusDpc.findFirst({
    where: (t, { eq }) => eq(t.id, id),
    with: {
      kabupaten: true,
    },
  });
  return result || null;
}

export async function createPengurusDpc(data: NewPengurusDpc) {
  const [res] = await db.insert(pengurusDpc).values(data);
  return { id: res.insertId, ...data };
}

export async function updatePengurusDpc(
  id: number,
  data: Partial<NewPengurusDpc>
) {
  await db.update(pengurusDpc).set(data).where(eq(pengurusDpc.id, id));
  return await getPengurusDpcById(id);
}

export async function deletePengurusDpc(id: number) {
  await db.delete(pengurusDpc).where(eq(pengurusDpc.id, id));
  return { success: true };
}

// =============================================================================
// SERVICES PENGURUS PAC (TINGKAT KECAMATAN)
// =============================================================================
export async function getPengurusPacList(kecamatanId?: number) {
  return await db.query.pengurusPac.findMany({
    where: kecamatanId
      ? (t, { eq }) => eq(t.kecamatanId, kecamatanId)
      : undefined,
    with: {
      kecamatan: true,
    },
    orderBy: (t, { asc }) => [asc(t.nama)],
  });
}

export async function getPengurusPacById(id: number) {
  const result = await db.query.pengurusPac.findFirst({
    where: (t, { eq }) => eq(t.id, id),
    with: {
      kecamatan: true,
    },
  });
  return result || null;
}

export async function createPengurusPac(data: NewPengurusPac) {
  const [res] = await db.insert(pengurusPac).values(data);
  return { id: res.insertId, ...data };
}

export async function updatePengurusPac(
  id: number,
  data: Partial<NewPengurusPac>
) {
  await db.update(pengurusPac).set(data).where(eq(pengurusPac.id, id));
  return await getPengurusPacById(id);
}

export async function deletePengurusPac(id: number) {
  await db.delete(pengurusPac).where(eq(pengurusPac.id, id));
  return { success: true };
}

// =============================================================================
// SERVICES PENGURUS ANAK RANTING (TINGKAT DESA/KELURAHAN)
// =============================================================================
export async function getPengurusAnakRantingList(desaId?: number) {
  return await db.query.pengurusAnakRanting.findMany({
    where: desaId ? (t, { eq }) => eq(t.desaId, desaId) : undefined,
    with: {
      desa: true,
    },
    orderBy: (t, { asc }) => [asc(t.nama)],
  });
}

export async function getPengurusAnakRantingById(id: number) {
  const result = await db.query.pengurusAnakRanting.findFirst({
    where: (t, { eq }) => eq(t.id, id),
    with: {
      desa: true,
    },
  });
  return result || null;
}

export async function createPengurusAnakRanting(data: NewPengurusAnakRanting) {
  const [res] = await db.insert(pengurusAnakRanting).values(data);
  return { id: res.insertId, ...data };
}

export async function updatePengurusAnakRanting(
  id: number,
  data: Partial<NewPengurusAnakRanting>
) {
  await db
    .update(pengurusAnakRanting)
    .set(data)
    .where(eq(pengurusAnakRanting.id, id));
  return await getPengurusAnakRantingById(id);
}

export async function deletePengurusAnakRanting(id: number) {
  await db
    .delete(pengurusAnakRanting)
    .where(eq(pengurusAnakRanting.id, id));
  return { success: true };
}
