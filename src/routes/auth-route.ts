import { Elysia, t } from "elysia";
import { jwtPlugin, verifyJwt } from "../middlewares/auth-middleware";
import type { AuthUser } from "../middlewares/auth-middleware";
import { loginService, getUserProfileService } from "../services/auth-services";

export const authRoute = new Elysia({ prefix: "/api/auth" })
  .use(jwtPlugin)

  // POST /api/auth/login (public)
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const result = await loginService(body);

      if (!result.success || !result.user) {
        set.status = result.status;
        return { error: result.error };
      }

      const token = await jwt.sign({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      });

      return {
        message: "Login berhasil",
        token,
        user: result.user,
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )

  // GET /api/auth/me (wajib login)
  .get("/me", async ({ headers, jwt, set }) => {
    const user = await verifyJwt(headers, jwt.verify as any);
    if (!user) {
      set.status = 401;
      return { error: "Token tidak valid" };
    }

    const profile = await getUserProfileService(user.id);
    if (!profile.success) {
      set.status = profile.status;
      return { error: profile.error };
    }
    return { data: profile.user };
  });
