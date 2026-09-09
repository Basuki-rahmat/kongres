// =============================================================================
// PDF GENERATOR — Bukti Sengketa Pleno KPU
// Membuat dokumen PDF komparasi data suara untuk keperluan hukum
// =============================================================================

import { PDFDocument, StandardFonts, rgb, PDFName, PDFString } from "pdf-lib";

interface BerkasSengketa {
  metadata: {
    nomorBerkas: string;
    tanggalDibuat: string;
    klasifikasi: string;
  };
  wilayahTps: {
    idTps: string;
    provinsi: string;
    kabKota: string;
    kecamatan: string;
    kelurahan: string;
    noTps: number;
  };
  dataSaksiInternal: {
    suaraPartai: number | null;
    suaraCalegTotal: number | null;
    totalSuara: number | null;
    fileC1PlanoUrl: string | null;
    inputTimestamp: Date | null;
    koordinatGps: { lat: string | null; long: string | null };
  };
  dataKpu: {
    suaraPartai: number | null;
    suaraCalegTotal: number | null;
    totalSuara: number | null;
    lastScrapeTimestamp: Date | null;
  };
  analisisSelisih: {
    selisihSuara: number | null;
    statusAnomali: string;
    keterangan: string;
  };
  catatanHukum: string;
  protokolSanggahanPleno: string[];
}

// =============================================================================
// WARNA & LAYOUT
// =============================================================================
const COLORS = {
  black: rgb(0, 0, 0),
  white: rgb(1, 1, 1),
  darkGray: rgb(0.2, 0.2, 0.2),
  lightGray: rgb(0.93, 0.93, 0.93),
  headerBg: rgb(0.13, 0.13, 0.13),
  red: rgb(0.8, 0.1, 0.1),
  green: rgb(0.1, 0.6, 0.2),
  blue: rgb(0.1, 0.3, 0.6),
  warningBg: rgb(1, 0.95, 0.9),
  warningBorder: rgb(0.9, 0.6, 0.2),
};

const PAGE = {
  width: 595.28, // A4
  height: 841.89,
  margin: 50,
  contentWidth: 595.28 - 50 * 2,
};

// =============================================================================
// HELPER: Format angka dengan pemisah ribuan
// =============================================================================
function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("id-ID");
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =============================================================================
// FUNGSI UTAMA: Generate PDF Bukti Sengketa
// =============================================================================
export async function generatePdfBuktiSengketa(
  data: BerkasSengketa
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  // Set metadata dokumen
  pdf.setTitle(`Bukti Sengketa - ${data.wilayahTps.idTps}`);
  pdf.setAuthor("Sistem Pembanding Mandiri (SPM)");
  pdf.setSubject(data.metadata.klasifikasi);
  pdf.setCreator("SPM Kongres");
  pdf.setProducer("pdf-lib");

  // Embed font
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontCourier = await pdf.embedFont(StandardFonts.Courier);

  let page = pdf.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - PAGE.margin;

  // =========================================================================
  // HEADER DOKUMEN
  // =========================================================================
  // Background header
  page.drawRectangle({
    x: PAGE.margin,
    y: y - 60,
    width: PAGE.contentWidth,
    height: 65,
    color: COLORS.headerBg,
  });

  // Garis merah di bawah header
  page.drawRectangle({
    x: PAGE.margin,
    y: y - 63,
    width: PAGE.contentWidth,
    height: 3,
    color: COLORS.red,
  });

  page.drawText("SISTEM PEMBANDING MANDIRI (SPM)", {
    x: PAGE.margin + 10,
    y: y - 18,
    size: 16,
    font: fontBold,
    color: COLORS.white,
  });

  page.drawText("DOKUMEN BUKTI SENGKETA PLENO KPU", {
    x: PAGE.margin + 10,
    y: y - 38,
    size: 11,
    font: font,
    color: COLORS.white,
  });

  page.drawText(data.metadata.klasifikasi, {
    x: PAGE.margin + 10,
    y: y - 52,
    size: 8,
    font: font,
    color: COLORS.red,
  });

  y -= 80;

  // =========================================================================
  // METADATA DOKUMEN
  // =========================================================================
  page.drawText("METADATA DOKUMEN", {
    x: PAGE.margin,
    y,
    size: 10,
    font: fontBold,
    color: COLORS.blue,
  });
  y -= 5;

  // Garis pemisah
  page.drawLine({
    start: { x: PAGE.margin, y },
    end: { x: PAGE.margin + PAGE.contentWidth, y },
    thickness: 1,
    color: COLORS.blue,
  });
  y -= 18;

  const metadataRows = [
    ["Nomor Berkas", data.metadata.nomorBerkas],
    ["Tanggal Pembuatan", formatDate(data.metadata.tanggalDibuat)],
  ];

  for (const [label, value] of metadataRows) {
    page.drawText(`${label}:`, {
      x: PAGE.margin + 5,
      y,
      size: 9,
      font: fontBold,
      color: COLORS.darkGray,
    });
    page.drawText(value || "—", {
      x: PAGE.margin + 160,
      y,
      size: 9,
      font: font,
      color: COLORS.black,
    });
    y -= 16;
  }

  y -= 10;

  // =========================================================================
  // WILAYAH TPS
  // =========================================================================
  page.drawText("WILAYAH TPS", {
    x: PAGE.margin,
    y,
    size: 10,
    font: fontBold,
    color: COLORS.blue,
  });
  y -= 5;

  page.drawLine({
    start: { x: PAGE.margin, y },
    end: { x: PAGE.margin + PAGE.contentWidth, y },
    thickness: 1,
    color: COLORS.blue,
  });
  y -= 18;

  const wilayahRows = [
    ["ID TPS", data.wilayahTps.idTps],
    ["Provinsi", data.wilayahTps.provinsi],
    ["Kabupaten/Kota", data.wilayahTps.kabKota],
    ["Kecamatan", data.wilayahTps.kecamatan],
    ["Kelurahan/Desa", data.wilayahTps.kelurahan],
    ["Nomor TPS", String(data.wilayahTps.noTps)],
  ];

  for (const [label, value] of wilayahRows) {
    page.drawText(`${label}:`, {
      x: PAGE.margin + 5,
      y,
      size: 9,
      font: fontBold,
      color: COLORS.darkGray,
    });
    page.drawText(value || "—", {
      x: PAGE.margin + 160,
      y,
      size: 9,
      font: font,
      color: COLORS.black,
    });
    y -= 16;
  }

  y -= 10;

  // =========================================================================
  // TABEL KOMPARASI DATA SUARA
  // =========================================================================
  page.drawText("KOMPARASI DATA SUARA", {
    x: PAGE.margin,
    y,
    size: 10,
    font: fontBold,
    color: COLORS.blue,
  });
  y -= 5;

  page.drawLine({
    start: { x: PAGE.margin, y },
    end: { x: PAGE.margin + PAGE.contentWidth, y },
    thickness: 1,
    color: COLORS.blue,
  });
  y -= 5;

  // Tabel
  const colWidths = [160, 120, 120];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableX = PAGE.margin + (PAGE.contentWidth - tableWidth) / 2;
  const rowHeight = 22;

  // Header tabel
  page.drawRectangle({
    x: tableX,
    y: y - rowHeight + 5,
    width: tableWidth,
    height: rowHeight,
    color: COLORS.headerBg,
  });

  const headers = ["Komponen", "Data Saksi (Internal)", "Data KPU"];
  let cellX = tableX + 8;
  for (let i = 0; i < headers.length; i++) {
    const headerText = headers[i] || "";
    const colWidth = colWidths[i] || 100;
    page.drawText(headerText, {
      x: cellX,
      y: y - 12,
      size: 9,
      font: fontBold,
      color: COLORS.white,
    });
    cellX += colWidth;
  }
  y -= rowHeight + 5;

  // Baris data
  const tableRows = [
    ["Suara Partai", formatNumber(data.dataSaksiInternal.suaraPartai), formatNumber(data.dataKpu.suaraPartai)],
    ["Suara Caleg Total", formatNumber(data.dataSaksiInternal.suaraCalegTotal), formatNumber(data.dataKpu.suaraCalegTotal)],
    ["Total Suara", formatNumber(data.dataSaksiInternal.totalSuara), formatNumber(data.dataKpu.totalSuara)],
  ];

  for (let i = 0; i < tableRows.length; i++) {
    const row = tableRows[i];
    if (!row) continue;
    const isEven = i % 2 === 0;
    const bgColor = isEven ? COLORS.lightGray : COLORS.white;

    page.drawRectangle({
      x: tableX,
      y: y - rowHeight + 5,
      width: tableWidth,
      height: rowHeight,
      color: bgColor,
    });

    cellX = tableX + 8;
    for (let j = 0; j < row.length; j++) {
      const textColor = j === 0 ? COLORS.darkGray : COLORS.black;
      const textFont = j === 0 ? fontBold : font;
      const cellValue = row[j] || "—";
      const colWidth = colWidths[j] || 100;
      page.drawText(cellValue, {
        x: cellX,
        y: y - 12,
        size: 9,
        font: textFont,
        color: textColor,
      });
      cellX += colWidth;
    }
    y -= rowHeight + 5;
  }

  // Border tabel
  page.drawRectangle({
    x: tableX,
    y: y + 5,
    width: tableWidth,
    height: (rowHeight + 5) * (tableRows.length + 1),
    borderColor: COLORS.darkGray,
    borderWidth: 1,
    color: COLORS.white,
    opacity: 0,
  });

  // =========================================================================
  // SELISIH & STATUS
  // =========================================================================
  y -= 15;

  page.drawText("ANALISIS SELISIH SUARA", {
    x: PAGE.margin,
    y,
    size: 10,
    font: fontBold,
    color: COLORS.blue,
  });
  y -= 5;

  page.drawLine({
    start: { x: PAGE.margin, y },
    end: { x: PAGE.margin + PAGE.contentWidth, y },
    thickness: 1,
    color: COLORS.blue,
  });
  y -= 20;

  // Kotak peringatan
  const statusColor =
    data.analisisSelisih.statusAnomali === "MISMATCH_KPU_OVER" ||
    data.analisisSelisih.statusAnomali === "MISMATCH_KPU_UNDER"
      ? COLORS.red
      : COLORS.green;

  page.drawRectangle({
    x: PAGE.margin,
    y: y - 55,
    width: PAGE.contentWidth,
    height: 60,
    color: COLORS.warningBg,
    borderColor: statusColor,
    borderWidth: 1.5,
  });

  page.drawText(`Status: ${data.analisisSelisih.statusAnomali}`, {
    x: PAGE.margin + 10,
    y: y - 10,
    size: 11,
    font: fontBold,
    color: statusColor,
  });

  page.drawText(`Selisih Suara: ${formatNumber(data.analisisSelisih.selisihSuara)}`, {
    x: PAGE.margin + 10,
    y: y - 26,
    size: 10,
    font: fontBold,
    color: COLORS.black,
  });

  // Word wrap keterangan
  const keterangan = data.analisisSelisih.keterangan;
  const maxCharsPerLine = 75;
  if (keterangan.length > maxCharsPerLine) {
    page.drawText(keterangan.substring(0, maxCharsPerLine), {
      x: PAGE.margin + 10,
      y: y - 42,
      size: 8,
      font: font,
      color: COLORS.darkGray,
    });
    page.drawText(keterangan.substring(maxCharsPerLine), {
      x: PAGE.margin + 10,
      y: y - 52,
      size: 8,
      font: font,
      color: COLORS.darkGray,
    });
  } else {
    page.drawText(keterangan, {
      x: PAGE.margin + 10,
      y: y - 42,
      size: 8,
      font: font,
      color: COLORS.darkGray,
    });
  }

  y -= 75;

  // =========================================================================
  // DATA PENDUKUNG
  // =========================================================================
  page.drawText("DATA PENDUKUNG", {
    x: PAGE.margin,
    y,
    size: 10,
    font: fontBold,
    color: COLORS.blue,
  });
  y -= 5;

  page.drawLine({
    start: { x: PAGE.margin, y },
    end: { x: PAGE.margin + PAGE.contentWidth, y },
    thickness: 1,
    color: COLORS.blue,
  });
  y -= 18;

  const supportRows = [
    ["File C1/Plano", data.dataSaksiInternal.fileC1PlanoUrl || "Tidak ada"],
    ["Timestamp Input Saksi", formatDate(data.dataSaksiInternal.inputTimestamp)],
    ["Timestamp Scraping KPU", formatDate(data.dataKpu.lastScrapeTimestamp)],
    ["Koordinat GPS", `${data.dataSaksiInternal.koordinatGps.lat || "—"}, ${data.dataSaksiInternal.koordinatGps.long || "—"}`],
  ];

  for (const [label, value] of supportRows) {
    page.drawText(`${label}:`, {
      x: PAGE.margin + 5,
      y,
      size: 9,
      font: fontBold,
      color: COLORS.darkGray,
    });
    // Truncate panjang value
    const safeValue = value || "—";
    const displayValue = safeValue.length > 50 ? safeValue.substring(0, 47) + "..." : safeValue;
    page.drawText(displayValue, {
      x: PAGE.margin + 170,
      y,
      size: 9,
      font: font,
      color: COLORS.black,
    });
    y -= 16;
  }

  y -= 10;

  // =========================================================================
  // CATATAN HUKUM
  // =========================================================================
  page.drawText("CATATAN HUKUM", {
    x: PAGE.margin,
    y,
    size: 10,
    font: fontBold,
    color: COLORS.blue,
  });
  y -= 5;

  page.drawLine({
    start: { x: PAGE.margin, y },
    end: { x: PAGE.margin + PAGE.contentWidth, y },
    thickness: 1,
    color: COLORS.blue,
  });
  y -= 18;

  // Word wrap catatan hukum
  const catatanLines = wordWrap(data.catatanHukum, 80);
  for (const line of catatanLines) {
    if (y < PAGE.margin + 50) {
      // Halaman baru jika kurang dari 50px dari bawah
      page = pdf.addPage([PAGE.width, PAGE.height]);
      y = PAGE.height - PAGE.margin;
    }
    page.drawText(line, {
      x: PAGE.margin + 5,
      y,
      size: 9,
      font: font,
      color: COLORS.darkGray,
    });
    y -= 14;
  }

  y -= 15;

  // =========================================================================
  // PROTOKOL SANGGAHAN PLENO
  // =========================================================================
  if (y < PAGE.margin + 120) {
    page = pdf.addPage([PAGE.width, PAGE.height]);
    y = PAGE.height - PAGE.margin;
  }

  page.drawText("PROTOKOL SANGGAHAN PLENO KPU", {
    x: PAGE.margin,
    y,
    size: 10,
    font: fontBold,
    color: COLORS.blue,
  });
  y -= 5;

  page.drawLine({
    start: { x: PAGE.margin, y },
    end: { x: PAGE.margin + PAGE.contentWidth, y },
    thickness: 1,
    color: COLORS.blue,
  });
  y -= 18;

  for (let i = 0; i < data.protokolSanggahanPleno.length; i++) {
    const step = data.protokolSanggahanPleno[i];
    if (!step) continue;
    const stepLines = wordWrap(step, 78);
    for (let j = 0; j < stepLines.length; j++) {
      if (y < PAGE.margin + 30) {
        page = pdf.addPage([PAGE.width, PAGE.height]);
        y = PAGE.height - PAGE.margin;
      }
      const lineText = stepLines[j] || "";
      page.drawText(lineText, {
        x: PAGE.margin + 10,
        y,
        size: 9,
        font: j === 0 ? font : font,
        color: COLORS.darkGray,
      });
      y -= 14;
    }
    y -= 4;
  }

  // =========================================================================
  // FOOTER
  // =========================================================================
  y = PAGE.margin + 20;

  page.drawLine({
    start: { x: PAGE.margin, y: y + 15 },
    end: { x: PAGE.margin + PAGE.contentWidth, y: y + 15 },
    thickness: 0.5,
    color: COLORS.darkGray,
  });

  page.drawText(
    "Dokumen ini dihasilkan secara otomatis oleh Sistem Pembanding Mandiri (SPM).",
    {
      x: PAGE.margin,
      y,
      size: 7,
      font: font,
      color: COLORS.darkGray,
    }
  );

  page.drawText(
    `Dicetak: ${formatDate(new Date().toISOString())} | ${data.metadata.nomorBerkas}`,
    {
      x: PAGE.margin,
      y: y - 10,
      size: 7,
      font: fontCourier,
      color: COLORS.darkGray,
    }
  );

  // =========================================================================
  // HALAMAN: Salin ke clipboard untuk saksi (opsional, sebagai halaman terpisah)
  // =========================================================================
  page = pdf.addPage([PAGE.width, PAGE.height]);
  y = PAGE.height - PAGE.margin;

  page.drawText("FORM KEBERATAN SAKSI (MODEL KPU)", {
    x: PAGE.margin,
    y,
    size: 12,
    font: fontBold,
    color: COLORS.black,
  });
  y -= 25;

  page.drawText("Yang bertanda tangan di bawah ini:", {
    x: PAGE.margin,
    y,
    size: 10,
    font: font,
    color: COLORS.black,
  });
  y -= 30;

  const formFields = [
    "Nama Saksi           : _________________________________",
    "Partai Politik        : _________________________________",
    "Nomor KTA            : _________________________________",
    "TPS / Kelurahan      : _________________________________",
    "",
    "Dengan ini menyatakan keberatan terhadap hasil rekapitulasi",
    "perolehan suara di TPS yang tercantum dalam dokumen bukti",
    "sengketa yang merupakan lampiran dari dokumen ini, karena:",
    "",
    "☐ Data suara pada Form C1 Plano tidak sesuai dengan",
    "   data yang tercatat dalam Sistem Pembanding Mandiri.",
    "",
    "☐ Terdapat selisih suara sebesar: _____________ suara.",
    "",
    "Bukti komparasi otomatis terlampir pada dokumen SPM ini.",
    "",
    "",
    "Tanggal: ____ / ____ / 2026",
    "",
    "",
    "Tanda Tangan Saksi",
    "",
    "_______________________________",
  ];

  for (const line of formFields) {
    page.drawText(line, {
      x: PAGE.margin + 10,
      y,
      size: 10,
      font: font,
      color: COLORS.black,
    });
    y -= 18;
  }

  return pdf.save();
}

// =============================================================================
// HELPER: Word Wrap
// =============================================================================
function wordWrap(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + " " + word : word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.length > 0 ? lines : [""];
}
