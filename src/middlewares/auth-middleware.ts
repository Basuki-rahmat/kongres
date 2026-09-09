import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET harus diset di environment variables (.env)");
}

export const jwtPlugin = jwt({
  name: "jwt",
  secret: JWT_SECRET,
  exp: "7d",
});

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

/**
 * Helper: verifikasi JWT dari header.
 */
export async function verifyJwt(
  headers: Record<string, string | undefined>,
  jwtVerify: (token: string) => Promise<AuthUser | false>
): Promise<AuthUser | null> {
  const authHeader = headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  const payload = await jwtVerify(token);
  if (!payload || !payload.id) return null;
  return payload;
}

/**
 * Helper: cek role user.
 */
export function checkRole(user: AuthUser, ...allowedRoles: string[]): boolean {
  return allowedRoles.includes(user.role);
}
