import { Elysia, t } from "elysia";
import { jwtPlugin } from "./auth-route";
import {
  getNotificationsByUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../services/notification-services";
import {
  addConnection,
  removeConnection,
} from "../services/sse-manager";

export const notificationRoute = new Elysia({ prefix: "/api/v1/notifications" })
  .use(jwtPlugin)

  // -------------------------------------------------------------------------
  // GET /api/v1/notifications/stream
  // SSE endpoint — client connect di sini untuk push real-time
  // -------------------------------------------------------------------------
  .get(
    "/stream",
    async ({ headers, jwt }) => {
      // Verifikasi JWT
      const authHeader = headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response("Unauthorized", { status: 401 });
      }

      const token = authHeader.substring(7);
      const payload = (await jwt.verify(token)) as {
        id: number;
        role: string;
      } | false;

      if (!payload || !payload.id) {
        return new Response("Unauthorized", { status: 401 });
      }

      const userId = payload.id;

      // Buat ReadableStream untuk SSE
      const stream = new ReadableStream({
        start(controller) {
          // Daftarkan koneksi
          addConnection(userId, controller);

          // Kirim event koneksi berhasil
          const encoder = new TextEncoder();
          controller.enqueue(
            encoder.encode(
              `event: connected\ndata: ${JSON.stringify({ userId, message: "SSE terhubung" })}\n\n`
            )
          );

          // Kirim heartbeat tiap 30 detik agar koneksi tetap hidup
          const heartbeat = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(`:ping\n\n`));
            } catch {
              clearInterval(heartbeat);
            }
          }, 30000);

          // Cleanup saat client disconnect
          stream.cancel = () => {
            clearInterval(heartbeat);
            removeConnection(userId);
            return Promise.resolve();
          };
        },
        cancel() {
          removeConnection(userId);
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }
  )

  // -------------------------------------------------------------------------
  // GET /api/v1/notifications
  // Daftar notifikasi (default: semua, ?unread=true hanya belum dibaca)
  // -------------------------------------------------------------------------
  .get("/", async ({ headers, jwt, query, set }) => {
    const payload = await verifyToken(headers, jwt);
    if (!payload) {
      set.status = 401;
      return { error: "Token tidak valid" };
    }

    const unreadOnly = query.unread === "true";
    const result = await getNotificationsByUser(payload.id, unreadOnly);

    return {
      success: true,
      ...result,
    };
  })

  // -------------------------------------------------------------------------
  // GET /api/v1/notifications/unread-count
  // Jumlah notifikasi belum dibaca
  // -------------------------------------------------------------------------
  .get("/unread-count", async ({ headers, jwt, set }) => {
    const payload = await verifyToken(headers, jwt);
    if (!payload) {
      set.status = 401;
      return { error: "Token tidak valid" };
    }

    const count = await getUnreadCount(payload.id);
    return { success: true, unreadCount: count };
  })

  // -------------------------------------------------------------------------
  // PUT /api/v1/notifications/:id/read
  // Tandai satu notifikasi sudah dibaca
  // -------------------------------------------------------------------------
  .put(
    "/:id/read",
    async ({ headers, jwt, params, set }) => {
      const payload = await verifyToken(headers, jwt);
      if (!payload) {
        set.status = 401;
        return { error: "Token tidak valid" };
      }

      const updated = await markAsRead(Number(params.id), payload.id);
      if (!updated) {
        set.status = 404;
        return { error: "Notifikasi tidak ditemukan" };
      }

      return { success: true, message: "Notifikasi ditandai sudah dibaca" };
    }
  )

  // -------------------------------------------------------------------------
  // PUT /api/v1/notifications/read-all
  // Tandai semua notifikasi sudah dibaca
  // -------------------------------------------------------------------------
  .put("/read-all", async ({ headers, jwt, set }) => {
    const payload = await verifyToken(headers, jwt);
    if (!payload) {
      set.status = 401;
      return { error: "Token tidak valid" };
    }

    const affected = await markAllAsRead(payload.id);
    return {
      success: true,
      message: `${affected} notifikasi ditandai sudah dibaca`,
    };
  });

// =============================================================================
// HELPER
// =============================================================================
async function verifyToken(
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
  return payload;
}
