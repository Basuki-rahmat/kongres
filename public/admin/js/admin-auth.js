// =============================================================================
// ADMIN HELPERS
// =============================================================================

const AdminAuth = {
  isLoggedIn() {
    return !!localStorage.getItem('admin_token');
  },

  getUser() {
    const raw = localStorage.getItem('admin_user');
    return raw ? JSON.parse(raw) : null;
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/admin/login.html';
      return false;
    }
    return true;
  },

  requireAdmin() {
    const user = this.getUser();
    if (!user || user.role !== 'ADMIN') {
      window.location.href = '/admin/login.html';
      return false;
    }
    return true;
  },

  logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login.html';
  },
};

function showToast(message, type = 'info', duration = 3000) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), duration);
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}h lalu`;
  return date.toLocaleDateString('id-ID');
}

function formatNumber(n) {
  return new Intl.NumberFormat('id-ID').format(n);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
