// =============================================================================
// RATE LIMITING MIDDLEWARE
// In-memory rate limiter sederhana per IP address
// =============================================================================

import { Elysia } from "elysia";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup setiap 1 menit agar memory tidak bocor
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60_000);

/**
 * Rate limiter: batasi jumlah request per window per IP
 * @param maxRequests - Maksimal request per window
 * @param windowMs - Window dalam milidetik (default: 1 menit)
 */
export function rateLimit(maxRequests: number = 60, windowMs: number = 60_000) {
  return new Elysia({ name: "rateLimit" })
    .onBeforeHandle(({ request, set }) => {
      // Ambil IP dari forwarded header atau direct IP
      const forwarded = request.headers.get("x-forwarded-for");
      const ip = forwarded?.split(",")[0]?.trim() || "127.0.0.1";
      const now = Date.now();
      const key = `${ip}:${new URL(request.url).pathname}`;

      const entry = store.get(key);

      if (!entry || now > entry.resetAt) {
        // Window baru
        store.set(key, { count: 1, resetAt: now + windowMs });
        return;
      }

      entry.count++;

      if (entry.count > maxRequests) {
        set.status = 429;
        return {
          error: "Terlalu banyak request. Coba lagi nanti.",
          retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        };
      }
    });
}
