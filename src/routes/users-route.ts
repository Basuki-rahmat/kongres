import { Elysia, t } from "elysia";
import { registerUserService } from "../services/users-services";

export const usersRoute = new Elysia({ prefix: "/api/users" }).post(
  "/",
  async ({ body, set }) => {
    // Batasi role yang bisa didaftarkan publik — ADMIN tidak boleh self-register
    const allowedRoles = ["SAKSI", "ADVOKASI", "PENGURUS"];
    const role = body.role && allowedRoles.includes(body.role) ? body.role : "SAKSI";

    const result = await registerUserService({ ...body, role });

    if (!result.success) {
      set.status = result.status;
      return { error: result.error };
    }

    set.status = 201;
    return { data: result.data };
  },
  {
    body: t.Object({
      nama: t.String({ minLength: 1 }),
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 6 }),
      role: t.Optional(
        t.Union([
          t.Literal("SAKSI"),
          t.Literal("ADVOKASI"),
          t.Literal("PENGURUS"),
        ])
      ),
    }),
  }
);
