import { Elysia, t } from "elysia";
import { registerUserService } from "../services/users-services";

export const usersRoute = new Elysia({ prefix: "/api/users" }).post(
  "/",
  async ({ body, set }) => {
    const result = await registerUserService(body);

    if (!result.success) {
      set.status = result.status;
      return { error: result.error };
    }

    set.status = result.status;
    return { data: result.data };
  },
  {
    body: t.Object({
      nama: t.String({ minLength: 1 }),
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 1 }),
      role: t.Optional(
        t.Union([
          t.Literal("ADMIN"),
          t.Literal("SAKSI"),
          t.Literal("ADVOKASI"),
          t.Literal("PENGURUS"),
        ])
      ),
    }),
  }
);
