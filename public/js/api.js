// =============================================================================
// API CLIENT — SPM Saksi App
// =============================================================================

const API_BASE = window.location.origin + '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    return data;
  }

  // --- Auth ---
  async login(email, password) {
    const data = await this.request('POST', '/auth/login', { email, password });
    this.setToken(data.token);
    return data;
  }

  async getProfile() {
    return this.request('GET', '/auth/me');
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('PUT', '/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  // --- Rekap (prefix: /api/v1/saksi) ---
  async getRekapList(params = {}) {
    const qs = new URLSearchParams();
    if (params.provinsi) qs.set('provinsi', params.provinsi);
    if (params.kabKota) qs.set('kabKota', params.kabKota);
    if (params.kecamatan) qs.set('kecamatan', params.kecamatan);
    if (params.statusAnomali) qs.set('statusAnomali', params.statusAnomali);
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    const q = qs.toString();
    return this.request('GET', `/v1/saksi/rekap${q ? '?' + q : ''}`);
  }

  async getRekapDetail(idTps) {
    return this.request('GET', `/v1/saksi/rekap/${idTps}`);
  }

  // --- Upload C1 (prefix: /api/v1/saksi) ---
  async uploadC1(formData) {
    const headers = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${API_BASE}/v1/saksi/upload-c1`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  // --- Notifications (prefix: /api/v1/notifications) ---
  async getNotifications(page = 1, limit = 20) {
    return this.request('GET', `/v1/notifications?page=${page}&limit=${limit}`);
  }

  async getUnreadCount() {
    return this.request('GET', '/v1/notifications/unread-count');
  }

  async markAsRead(id) {
    return this.request('PUT', `/v1/notifications/${id}/read`);
  }

  async markAllRead() {
    return this.request('PUT', '/v1/notifications/read-all');
  }

  // --- SSE Stream ---
  connectSSE(onMessage) {
    const evtSource = new EventSource(`${API_BASE}/v1/notifications/stream?token=${this.token}`);

    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    evtSource.onerror = () => {
      console.log('SSE connection error, reconnecting...');
    };

    return evtSource;
  }
}

window.api = new ApiClient();
