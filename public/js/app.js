// =============================================================================
// APP — SPM Saksi (Main Entry)
// =============================================================================

// --- Register Service Worker ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
