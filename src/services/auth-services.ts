import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users } from "../db/schema";

export interface LoginInput {
  email: string;
  password: string;
}

export async function loginService(input: LoginInput) {
  // 1. Cari pengguna berdasarkan email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (!user) {
    return {
      success: false,
      status: 401,
      error: "Email atau password salah",
    };
  }

  // 2. Verifikasi hash password
  const isMatch = await bcrypt.compare(input.password, user.password);
  if (!isMatch) {
    return {
      success: false,
      status: 401,
      error: "Email atau password salah",
    };
  }

  // 3. Return user data tanpa password
  return {
    success: true,
    status: 200,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getUserProfileService(userId: number) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return {
      success: false,
      status: 404,
      error: "Pengguna tidak ditemukan",
    };
  }

  return {
    success: true,
    status: 200,
    user,
  };
}
