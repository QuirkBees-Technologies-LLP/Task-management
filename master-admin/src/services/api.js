import axios from 'axios';
import { getToken } from '../utils/authStorage';
import { message } from 'antd';
import { Navigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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
      config.headers.Authorization = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjk1NGNjNWI4NGY3ZDg3Zjk2MzRlZmEyIiwiaXNTeXN0ZW1BZG1pbiI6dHJ1ZSwiaWF0IjoxNzY3Njk0MDgwLCJleHAiOjE3Njc3ODA0ODB9.aJUWdoMgw7KBYNx_8hfK87rwYI3zR787ykfcota6q4Y`;
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
    const errorMessage = error?.response?.data?.error || '';
    if (errorMessage === "Invalid or expired token") {
      message.error("Session expired. Please login again.");
      localStorage.clear();
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

  list: ({ page = 1, limit = 10, search = "" }) =>
    api.get("/superadmin/organizations", { params: { page, limit, search } }),

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
