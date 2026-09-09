// =============================================================================
// NOTIFICATION SERVICE
// CRUD notifikasi + integrasi SSE untuk push real-time ke Tim Hukum
// =============================================================================

import { and, eq, sql, desc } from "drizzle-orm";
import { db } from "../db";
import { notifications, users } from "../db/schema";
import { sendToUser } from "./sse-manager";

// =============================================================================
// TIPE DATA
// =============================================================================

export interface CreateNotificationInput {
  userId: number;
  title: string;
  body: string;
  type: string;
  referenceId?: string;
  referenceType?: string;
}

// =============================================================================
// FUNGSI INTI
// =============================================================================

/**
 * Membuat notifikasi baru + mengirim via SSE jika user online
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  // Simpan ke database
  await db.insert(notifications).values({
    userId: input.userId,
    title: input.title,
    body: input.body,
    type: input.type,
    referenceId: input.referenceId || null,
    referenceType: input.referenceType || null,
    isRead: false,
  });

  // Coba kirim real-time via SSE
  const sent = sendToUser(input.userId, "notification", {
    title: input.title,
    body: input.body,
    type: input.type,
    referenceId: input.referenceId,
    referenceType: input.referenceType,
  });

  if (sent) {
    console.log(
      `[Notif] Push terkirim ke user ${input.userId} (online): ${input.title}`
    );
  } else {
    console.log(
      `[Notif] User ${input.userId} offline. Notifikasi tersimpan: ${input.title}`
    );
  }
}

/**
 * Mengambil daftar notifikasi milik user tertentu
 */
export async function getNotificationsByUser(
  userId: number,
  unreadOnly: boolean = false
) {
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  const list = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt));

  return {
    total: list.length,
    data: list,
  };
}

/**
 * Mendapatkan jumlah belum dibaca
 */
export async function getUnreadCount(userId: number): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );

  return Number(result?.count) || 0;
}

/**
 * Tandai satu notifikasi sudah dibaca
 */
export async function markAsRead(
  notificationId: number,
  userId: number
): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    )
    .limit(1);

  if (!existing) return false;

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));

  return true;
}

/**
 * Tandai semua notifikasi user sudah dibaca
 */
export async function markAllAsRead(userId: number): Promise<number> {
  const [before] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );

  return Number(before?.count) || 0;
}

// =============================================================================
// NOTIFIKASI OTOMATIS: ANOMALI SUIARA (KPU Scraper / Saksi C1)
// =============================================================================

/**
 * Mengirim notifikasi ke seluruh Tim Hukum (role ADVOKASI) 
 * saat anomali suara terdeteksi
 */
export async function notifyTimHukumAnomaly(params: {
  idTps: string;
  provinsi: string;
  kabKota: string;
  kecamatan: string;
  kelurahan: string;
  noTps: number;
  statusAnomali: string;
  selisih: number;
  source: "KPU_SCRAPER" | "SAKSI_C1";
}): Promise<number> {
  // Cari semua user dengan role ADVOKASI
  const timHukumUsers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, "ADVOKASI"));

  if (timHukumUsers.length === 0) {
    console.warn(
      `[Notif] Tidak ada user ADVOKASI ditemukan untuk notifikasi anomali TPS ${params.idTps}`
    );
    return 0;
  }

  // Susun pesan
  const label =
    params.statusAnomali === "MISMATCH_KPU_OVER"
      ? "Suara KPU terindikasi menggelembung (Overcounted)"
      : params.statusAnomali === "MISMATCH_KPU_UNDER"
        ? "Suara terindikasi berkurang/hilang (Undercounted)"
        : `Anomali terdeteksi (${params.statusAnomali})`;

  const title = `ALERT: Anomali TPS ${params.noTps} — ${label}`;
  const body = [
    `TPS: ${params.noTps}, ${params.kelurahan}, ${params.kecamatan}, ${params.kabKota}, ${params.provinsi}`,
    `ID TPS: ${params.idTps}`,
    `Status: ${params.statusAnomali}`,
    `Selisih Suara: ${params.selisih}`,
    `Sumber Deteksi: ${params.source === "KPU_SCRAPER" ? "Scraping KPU" : "Upload C1 Saksi"}`,
    "",
    "Segera verifikasi data dan siapkan dokumen sengketa pleno KPU.",
  ].join("\n");

  // Kirim ke semua Tim Hukum
  let sentCount = 0;
  for (const user of timHukumUsers) {
    await createNotification({
      userId: user.id,
      title,
      body,
      type: "ANOMALY_DETECTED",
      referenceId: params.idTps,
      referenceType: "TPS",
    });
    sentCount++;
  }

  console.log(
    `[Notif] Notifikasi anomali TPS ${params.idTps} dikirim ke ${sentCount} anggota Tim Hukum`
  );

  return sentCount;
}
