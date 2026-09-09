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
import { file } from "bun";

// MIME types for static files
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

// Serve static file from public/
async function serveStatic(path: string) {
  const filePath = `./public/${path}`;
  const f = file(filePath);
  if (await f.exists()) {
    const ext = "." + path.split(".").pop();
    const mime = MIME_TYPES[ext] || "application/octet-stream";
    return new Response(f, { headers: { "Content-Type": mime } });
  }
  return null;
}

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
  .get("/", async () => {
    const resp = await serveStatic("index.html");
    if (resp) return resp;
    return { message: "Selamat datang di API Kongres (Bun + Elysia + Drizzle + MySQL)" };
  })
  .get("/ping", () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  })
  // Static files
  .get("/*", async ({ path }) => {
    const resp = await serveStatic(path);
    if (resp) return resp;
    return new Response("Not Found", { status: 404 });
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
console.log(`📱 SPM Saksi App: http://${app.server?.hostname}:${app.server?.port}/dashboard.html`);

export type App = typeof app;
