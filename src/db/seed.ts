import fs from "fs";
import path from "path";
import { pool } from "./index";

async function seed() {
  console.log("🌱 Memulai import data awal wilayah...");
  const filePath = path.resolve(__dirname, "../table provinsi-kab-kec-desa.txt");

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File tidak ditemukan: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");

  // Ekstrak statement INSERT INTO untuk tiap tabel wilayah
  const insertRegex = /INSERT INTO `?(provinsi|kabupaten|kecamatan|desa)`?[\s\S]*?;/gi;
  const matches = content.match(insertRegex);

  if (!matches || matches.length === 0) {
    console.error("❌ Tidak ada data INSERT yang ditemukan dalam file.");
    process.exit(1);
  }

  // Kelompokkan per nama tabel
  const tableInserts: Record<string, string> = {};
  for (const statement of matches) {
    const tableMatch = statement.match(/INSERT INTO `?(\w+)`?/i);
    if (tableMatch && tableMatch[1]) {
      tableInserts[tableMatch[1].toLowerCase()] = statement;
    }
  }

  // Urutan hierarkis impor wilayah
  const order = ["provinsi", "kabupaten", "kecamatan", "desa"];
  const connection = await pool.getConnection();

  try {
    console.log("⏳ Menonaktifkan foreign key checks sementara...");
    await connection.query("SET FOREIGN_KEY_CHECKS = 0;");

    for (const table of order) {
      const sql = tableInserts[table];
      if (sql) {
        console.log(`🧹 Mengosongkan data tabel ${table}...`);
        await connection.query(`DELETE FROM \`${table}\`;`);
        console.log(`📥 Mengimpor data ke tabel ${table}...`);
        await connection.query(sql);

        const [countResult]: any = await connection.query(
          `SELECT COUNT(*) as total FROM \`${table}\`;`
        );
        console.log(
          `✅ ${table}: ${countResult[0]?.total} data berhasil diimpor.`
        );
      } else {
        console.warn(`⚠️ Statement insert untuk tabel ${table} tidak ditemukan.`);
      }
    }

    console.log("🔒 Mengaktifkan kembali foreign key checks...");
    await connection.query("SET FOREIGN_KEY_CHECKS = 1;");

    console.log("🎉 Selesai! Seluruh data awal wilayah berhasil diimpor ke database.");
  } catch (err) {
    console.error("❌ Terjadi kesalahan saat seeding:", err);
    try {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1;");
    } catch {}
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seed();
