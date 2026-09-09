import { Elysia } from "elysia";
import { usersRoute } from "./routes/users-route";
import { authRoute } from "./routes/auth-route";
import { wilayahRoute } from "./routes/wilayah-route";
import { pengurusRoute } from "./routes/pengurus-route";
import { saksiRoute } from "./routes/saksi-route";
import { advokasiRoute } from "./routes/advokasi-route";

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
  .listen(3000);

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
