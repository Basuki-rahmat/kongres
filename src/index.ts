import { Elysia, t } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";

const app = new Elysia()
  .get("/", () => ({
    message: "Selamat datang di API Kongres (Bun + Elysia + Drizzle + MySQL)",
  }))
  .get("/ping", () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  })
  .get("/users", async () => {
    const allUsers = await db.select().from(users);
    return allUsers;
  })
  .post(
    "/users",
    async ({ body, set }) => {
      try {
        await db.insert(users).values({
          name: body.name,
          email: body.email,
        });
        set.status = 201;
        return { message: "User berhasil dibuat", user: body };
      } catch (error: any) {
        set.status = 400;
        return { error: error.message };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
      }),
    }
  )
  .listen(3000);

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
