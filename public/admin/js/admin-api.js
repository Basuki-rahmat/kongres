// =============================================================================
// ADMIN API CLIENT — Admin/Legal Panel
// =============================================================================

const API_BASE = window.location.origin + '/api';

class AdminApi {
  constructor() {
    this.token = localStorage.getItem('admin_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('admin_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  // --- Auth ---
  async login(email, password) {
    const data = await this.request('POST', '/auth/login', { email, password });
    this.setToken(data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    return data;
  }

  async getProfile() {
    return this.request('GET', '/auth/me');
  }

  // --- Users ---
  async getUsers() {
    return this.request('GET', '/users');
  }

  async getUser(id) {
    return this.request('GET', `/users/${id}`);
  }

  // --- Rekap ---
  async getRekapList(params = {}) {
    const qs = new URLSearchParams();
    if (params.provinsi) qs.set('provinsi', params.provinsi);
    if (params.kabKota) qs.set('kabKota', params.kabKota);
    if (params.kecamatan) qs.set('kecamatan', params.kecamatan);
    if (params.statusAnomali) qs.set('statusAnomali', params.statusAnomali);
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    const q = qs.toString();
    return this.request('GET', `/saksi/rekap${q ? '?' + q : ''}`);
  }

  async getRekapDetail(idTps) {
    return this.request('GET', `/saksi/rekap/${idTps}`);
  }

  // --- Catatan Hukum ---
  async updateCatatanHukum(idTps, catatan) {
    return this.request('PUT', `/advokasi/catatan-hukum/${idTps}`, { catatan });
  }

  // --- Notifications ---
  async getNotifications(page = 1, limit = 50) {
    return this.request('GET', `/notifications?page=${page}&limit=${limit}`);
  }

  async getUnreadCount() {
    return this.request('GET', '/notifications/unread-count');
  }

  // --- Pengurus ---
  async getPengurus(params = {}) {
    const qs = new URLSearchParams();
    if (params.level) qs.set('level', params.level);
    if (params.parentId) qs.set('parent_id', params.parentId);
    const q = qs.toString();
    return this.request('GET', `/pengurus${q ? '?' + q : ''}`);
  }

  async createPengurus(data) {
    return this.request('POST', '/pengurus', data);
  }

  async updatePengurus(id, data) {
    return this.request('PUT', `/pengurus/${id}`, data);
  }

  async deletePengurus(id) {
    return this.request('DELETE', `/pengurus/${id}`);
  }

  // --- Keberatan ---
  async createKeberatan(data) {
    return this.request('POST', '/advokasi/keberatan', data);
  }

  async downloadBuktiPdf(idTps) {
    const res = await fetch(`${API_BASE}/advokasi/download-bukti-pdf/${idTps}`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error('Gagal download PDF');
    return res.blob();
  }

  // --- SSE ---
  connectSSE(onMessage) {
    const evtSource = new EventSource(`${API_BASE}/notifications/stream?token=${this.token}`);
    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {}
    };
    evtSource.onerror = () => console.log('SSE disconnected');
    return evtSource;
  }
}

window.adminApi = new AdminApi();
