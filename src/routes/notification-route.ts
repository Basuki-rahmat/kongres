import { Elysia } from "elysia";
import { jwtPlugin, verifyJwt } from "../middlewares/auth-middleware";
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

  // SSE endpoint — verifikasi manual
  .get("/stream", async ({ headers, jwt }) => {
    const user = await verifyJwt(headers, jwt.verify as any);
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const stream = new ReadableStream({
      start(controller) {
        addConnection(user.id, controller);

        const encoder = new TextEncoder();
        controller.enqueue(
          encoder.encode(
            `event: connected\ndata: ${JSON.stringify({ userId: user!.id, message: "SSE terhubung" })}\n\n`
          )
        );

        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`:ping\n\n`));
          } catch {
            clearInterval(heartbeat);
          }
        }, 30000);

        stream.cancel = () => {
          clearInterval(heartbeat);
          removeConnection(user!.id);
          return Promise.resolve();
        };
      },
      cancel() {
        removeConnection(user.id);
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
  })

  // GET /api/v1/notifications (wajib login)
  .get("/", async ({ headers, jwt, query, set }) => {
    const user = await verifyJwt(headers, jwt.verify as any);
    if (!user) {
      set.status = 401;
      return { error: "Token tidak valid" };
    }

    const unreadOnly = query.unread === "true";
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const result = await getNotificationsByUser(user.id, unreadOnly, page, limit);
    return { success: true, ...result };
  })

  // GET /api/v1/notifications/unread-count (wajib login)
  .get("/unread-count", async ({ headers, jwt, set }) => {
    const user = await verifyJwt(headers, jwt.verify as any);
    if (!user) {
      set.status = 401;
      return { error: "Token tidak valid" };
    }

    const count = await getUnreadCount(user.id);
    return { success: true, unreadCount: count };
  })

  // PUT /api/v1/notifications/:id/read (wajib login)
  .put("/:id/read", async ({ headers, jwt, params, set }) => {
    const user = await verifyJwt(headers, jwt.verify as any);
    if (!user) {
      set.status = 401;
      return { error: "Token tidak valid" };
    }

    const updated = await markAsRead(Number(params.id), user.id);
    if (!updated) {
      set.status = 404;
      return { error: "Notifikasi tidak ditemukan" };
    }
    return { success: true, message: "Notifikasi ditandai sudah dibaca" };
  })

  // PUT /api/v1/notifications/read-all (wajib login)
  .put("/read-all", async ({ headers, jwt, set }) => {
    const user = await verifyJwt(headers, jwt.verify as any);
    if (!user) {
      set.status = 401;
      return { error: "Token tidak valid" };
    }

    const affected = await markAllAsRead(user.id);
    return {
      success: true,
      message: `${affected} notifikasi ditandai sudah dibaca`,
    };
  });
