import { Elysia } from "elysia";
import { usersRoute } from "./routes/users-route";

const app = new Elysia()
  .get("/", () => ({
    message: "Selamat datang di API Kongres (Bun + Elysia + Drizzle + MySQL)",
  }))
  .get("/ping", () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  })
  .use(usersRoute)
  .listen(3000);

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
