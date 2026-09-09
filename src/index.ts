import { Elysia } from "elysia";
import { usersRoute } from "./routes/users-route";
import { authRoute } from "./routes/auth-route";
import { wilayahRoute } from "./routes/wilayah-route";
import { pengurusRoute } from "./routes/pengurus-route";
import { saksiRoute } from "./routes/saksi-route";
import { advokasiRoute } from "./routes/advokasi-route";
import { kpuRoute } from "./routes/kpu-route";
import { notificationRoute } from "./routes/notification-route";
import { startKpuWorker } from "./workers/kpu-worker";

const app = new Elysia()
  .get("/", () => ({
    message: "Selamat datang di API Kongres (Bun + Elysia + Drizzle + MySQL)",
  }))
  .get("/ping", () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  })
  .use(usersRoute)
  .use(authRoute)
  .use(wilayahRoute)
  .use(pengurusRoute)
  .use(saksiRoute)
  .use(advokasiRoute)
  .use(kpuRoute)
  .use(notificationRoute)
  .listen(3000);

// Mulai background worker KPU setelah server aktif
startKpuWorker();

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
