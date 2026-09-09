// =============================================================================
// SSE (SERVER-SENT EVENTS) CONNECTION MANAGER
// Menyimpan koneksi SSE per user dan mengirim notifikasi real-time
// =============================================================================

interface SseConnection {
  userId: number;
  controller: ReadableStreamDefaultController;
  connectedAt: Date;
}

// Map userId -> koneksi SSE aktif
const connections = new Map<number, SseConnection>();

/**
 * Mendaftarkan koneksi SSE baru untuk user tertentu
 */
export function addConnection(
  userId: number,
  controller: ReadableStreamDefaultController
): void {
  // Tutup koneksi lama jika ada (satu user satu koneksi)
  if (connections.has(userId)) {
    const old = connections.get(userId)!;
    try {
      old.controller.close();
    } catch {
      // sudah tertutup, abaikan
    }
  }

  connections.set(userId, {
    userId,
    controller,
    connectedAt: new Date(),
  });

  console.log(
    `[SSE] User ${userId} terhubung. Total koneksi aktif: ${connections.size}`
  );
}

/**
 * Melepaskan koneksi SSE saat client disconnect
 */
export function removeConnection(userId: number): void {
  connections.delete(userId);
  console.log(
    `[SSE] User ${userId} terputus. Total koneksi aktif: ${connections.size}`
  );
}

/**
 * Mengirim event SSE ke user tertentu
 */
export function sendToUser(
  userId: number,
  event: string,
  data: Record<string, unknown>
): boolean {
  const conn = connections.get(userId);
  if (!conn) return false;

  try {
    const encoder = new TextEncoder();
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    conn.controller.enqueue(encoder.encode(payload));
    return true;
  } catch {
    // Koneksi rusak, hapus
    connections.delete(userId);
    return false;
  }
}

/**
 * Mengirim event SSE ke semua user dengan role tertentu
 */
export function sendToRole(
  role: string,
  event: string,
  data: Record<string, unknown>,
  userRoleMap: Map<number, string>
): number {
  let sentCount = 0;

  for (const [userId, userRole] of userRoleMap) {
    if (userRole === role) {
      if (sendToUser(userId, event, data)) {
        sentCount++;
      }
    }
  }

  return sentCount;
}

/**
 * Mendapatkan jumlah koneksi aktif
 */
export function getConnectionCount(): number {
  return connections.size;
}

/**
 * Mendapatkan daftar userId yang sedang terkoneksi
 */
export function getConnectedUserIds(): number[] {
  return Array.from(connections.keys());
}

/**
 * Mengirim keepalive/heartbeat ke semua koneksi
 */
export function sendHeartbeat(): void {
  const encoder = new TextEncoder();
  const payload = `:heartbeat\n\n`;

  for (const [userId, conn] of connections) {
    try {
      conn.controller.enqueue(encoder.encode(payload));
    } catch {
      connections.delete(userId);
    }
  }
}
