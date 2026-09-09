import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users } from "../db/schema";

export interface RegisterUserInput {
  nama: string;
  email: string;
  password: string;
  role?: string;
}

export async function registerUserService(input: RegisterUserInput) {
  // 1. Cek apakah email sudah terdaftar
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existingUser.length > 0) {
    return {
      success: false,
      status: 400,
      error: "Email sudah terdaftar",
    };
  }

  // 2. Hash password menggunakan bcrypt
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(input.password, salt);

  // 3. Simpan user baru ke database
  await db.insert(users).values({
    name: input.nama,
    email: input.email,
    password: hashedPassword,
    role: input.role || "SAKSI",
  });

  return {
    success: true,
    status: 200,
    data: "OK",
  };
}
