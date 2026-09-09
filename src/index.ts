import { Elysia } from "elysia";
import cors from "@elysiajs/cors";
import { rateLimit } from "./middlewares/rate-limit";
import { usersRoute } from "./routes/users-route";
import { authRoute } from "./routes/auth-route";
import { wilayahRoute } from "./routes/wilayah-route";
import { pengurusRoute } from "./routes/pengurus-route";
import { saksiRoute } from "./routes/saksi-route";
import { advokasiRoute } from "./routes/advokasi-route";
import { kpuRoute } from "./routes/kpu-route";
import { notificationRoute } from "./routes/notification-route";
import { startKpuWorker } from "./workers/kpu-worker";
import { startNotificationCleanupWorker } from "./services/notification-services";

const app = new Elysia()
  .use(
    cors({
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  )
  .use(rateLimit(100, 60_000)) // Global: 100 request/menit per IP
  .get("/", () => ({
    message: "Selamat datang di API Kongres (Bun + Elysia + Drizzle + MySQL)",
  }))
  .get("/ping", () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  })
  .use(rateLimit(10, 60_000)) // Auth routes: 10 request/menit per IP (brute-force protection)
  .use(usersRoute)
  .use(authRoute)
  .use(wilayahRoute)
  .use(pengurusRoute)
  .use(saksiRoute)
  .use(advokasiRoute)
  .use(kpuRoute)
  .use(notificationRoute)
  .listen(3000);

startKpuWorker();
startNotificationCleanupWorker(24); // Cleanup setiap 24 jam

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
