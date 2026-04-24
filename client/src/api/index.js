import axios from 'axios';

const api = axios.create({
  baseURL:         '/api',
  withCredentials: true,
  timeout:         15000,
});

// ── Request interceptor — attach access token ────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — silent token refresh on 401 ──────────────────────
let isRefreshing = false;
let queue        = [];

const processQueue = (err, token) => {
  queue.forEach(p => err ? p.reject(err) : p.resolve(token));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then(token => {
          orig.headers.Authorization = `Bearer ${token}`;
          return api(orig);
        });
      }
      orig._retry   = true;
      isRefreshing  = true;
      try {
        const { data } = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true });
        const token = data.data.accessToken;
        localStorage.setItem('accessToken', token);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        processQueue(null, token);
        orig.headers.Authorization = `Bearer ${token}`;
        return api(orig);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register:       (d)  => api.post('/auth/register', d),
  login:          (d)  => api.post('/auth/login', d),
  logout:         ()   => api.post('/auth/logout'),
  me:             ()   => api.get('/auth/me'),
  updateProfile:  (d)  => api.patch('/auth/me', d),
  changePassword: (d)  => api.post('/auth/change-password', d),
  updateWatchlist:(d)  => api.patch('/auth/watchlist', d),
};

export const stockAPI = {
  dashboard: ()  => api.get('/stocks'),
  detail:    (s) => api.get(`/stocks/${s}`),
  search:    (q) => api.get(`/stocks/search?q=${encodeURIComponent(q)}`),
};

export const portfolioAPI = {
  get:       ()  => api.get('/portfolio'),
  addTrade:  (d) => api.post('/portfolio/trade', d),
  trades:    (p) => api.get('/portfolio/trades', { params: p }),
};

export const alertAPI = {
  list:   (p) => api.get('/alerts', { params: p }),
  create: (d) => api.post('/alerts', d),
  delete: (id)=> api.delete(`/alerts/${id}`),
  toggle: (id)=> api.patch(`/alerts/${id}/toggle`),
};

export default api;
