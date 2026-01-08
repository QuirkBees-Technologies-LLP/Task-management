import axios from 'axios';
import { getToken } from '../utils/authStorage';
import { message } from 'antd';
import { createBrowserHistory } from 'history';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const history = createBrowserHistory();
/* ----------------------------------------------------
   Axios Instance
---------------------------------------------------- */

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/* ----------------------------------------------------
   Request Interceptor
---------------------------------------------------- */

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ----------------------------------------------------
   Response Interceptor
---------------------------------------------------- */

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // window.location.href = '/login';
        message.error('Session expired. Redirecting to login...');

        // Navigate to login without full page reload
      history.push('/login');
    }
    return Promise.reject(error);
  }
);

/* ----------------------------------------------------
   Auth APIs (Super Admin)
---------------------------------------------------- */

export const authAPI = {
  login: (credentials) =>
    api.post('/superadmin/auth/login', credentials),

  logout: () =>
    api.post('/superadmin/auth/logout'),
};

/* ----------------------------------------------------
   Organization APIs (Super Admin)
---------------------------------------------------- */

export const organizationAPI = {
  create: (payload) =>
    api.post("/superadmin/organizations", payload),

  list: ({ page = 1, limit = 10 }) =>
    api.get("/superadmin/organizations", { params: { page, limit } }),

  updateStatus: (id, payload) =>
    api.patch(`/superadmin/organizations/${id}`, payload),

  update: (id, payload) =>
    api.patch(`/superadmin/organizations/${id}`, payload),

  delete: (id) =>
    api.delete(`/superadmin/organizations/${id}`),
};

/* ----------------------------------------------------
   Planner APIs (Super Admin)
---------------------------------------------------- */

export const plansAPI = {
  // GET /api/superadmin/plans?page=&limit=
  list: (params) =>
    api.get('/superadmin/plans', { params }),

  // POST /api/superadmin/plans
  create: (data) =>
    api.post('/superadmin/plans', data),

  // GET /api/superadmin/plans/:id
  getById: (id) =>
    api.get(`/superadmin/plans/${id}`),

  // PATCH /api/superadmin/plans/:id
  update: (id, data) =>
    api.patch(`/superadmin/plans/${id}`, data),

  // DELETE /api/superadmin/plans/:id (soft delete)
  delete: (id) =>
    api.delete(`/superadmin/plans/${id}`),
};

/* ----------------------------------------------------
   Dashboard APIs (Super Admin)
---------------------------------------------------- */

export const dashboardAPI = {
  // GET /api/superadmin/dashboard
  getStats: () =>
    api.get('/superadmin/dashboard'),
};

export default api;
