import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { loginService, getUserProfileService } from "../services/auth-services";

export const jwtPlugin = jwt({
  name: "jwt",
  secret: process.env.JWT_SECRET || "supersecret_kongres_jwt_key_2026",
  exp: "7d",
});

export const authRoute = new Elysia({ prefix: "/api/auth" })
  .use(jwtPlugin)

  // POST /api/auth/login
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const result = await loginService(body);

      if (!result.success || !result.user) {
        set.status = result.status;
        return { error: result.error };
      }

      // Generate token JWT
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

  // GET /api/auth/me
  .get("/me", async ({ headers, jwt, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Token otentikasi tidak ditemukan" };
    }

    const token = authHeader.substring(7);
    const payload = (await jwt.verify(token)) as {
      id: number;
      name: string;
      email: string;
      role: string;
    } | false;

    if (!payload || !payload.id) {
      set.status = 401;
      return { error: "Token tidak valid atau telah kedaluwarsa" };
    }

    const profile = await getUserProfileService(payload.id);
    if (!profile.success) {
      set.status = profile.status;
      return { error: profile.error };
    }

    return { data: profile.user };
  });
