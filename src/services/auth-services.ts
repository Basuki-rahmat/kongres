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

// =============================================================================
// PASSWORD CHANGE
// =============================================================================
export async function changePasswordService(
  userId: number,
  currentPassword: string,
  newPassword: string
) {
  // 1. Cari user
  const [user] = await db
    .select()
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

  // 2. Verifikasi password lama
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return {
      success: false,
      status: 401,
      error: "Password lama salah",
    };
  }

  // 3. Hash password baru
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 4. Update password
  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, userId));

  return {
    success: true,
    status: 200,
    message: "Password berhasil diubah",
  };
}

// =============================================================================
// PASSWORD RESET (Admin only — reset password user lain)
// =============================================================================
export async function resetPasswordService(
  targetUserId: number,
  newPassword: string
) {
  // 1. Cek apakah target user ada
  const [targetUser] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!targetUser) {
    return {
      success: false,
      status: 404,
      error: "Target pengguna tidak ditemukan",
    };
  }

  // 2. Hash password baru
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 3. Update password
  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, targetUserId));

  return {
    success: true,
    status: 200,
    message: `Password ${targetUser.name} berhasil direset`,
  };
}
