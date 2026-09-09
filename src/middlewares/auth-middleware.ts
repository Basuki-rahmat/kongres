import { Elysia } from "elysia";
import { jwtPlugin } from "../routes/auth-route";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

/**
 * Middleware untuk memvalidasi Bearer Token JWT dan mengekstrak data user.
 * Menyediakan 'user' ke context request.
 */
export const authGuard = new Elysia({ name: "authGuard" })
  .use(jwtPlugin)
  .derive(async ({ headers, jwt, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      throw new Error("UNAUTHORIZED: Token otentikasi diperlukan");
    }

    const token = authHeader.substring(7);
    const payload = (await jwt.verify(token)) as AuthUser | false;

    if (!payload || !payload.id) {
      set.status = 401;
      throw new Error("UNAUTHORIZED: Token tidak valid atau telah kedaluwarsa");
    }

    return { user: payload };
  });

/**
 * Helper untuk memeriksa apakah user memiliki role yang diizinkan.
 */
export function requireRoles(userRole: string, allowedRoles: string[]) {
  if (!allowedRoles.includes(userRole)) {
    const error: any = new Error(
      `FORBIDDEN: Peran ${userRole} tidak memiliki izin untuk akses ini`
    );
    error.status = 403;
    throw error;
  }
}
