import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '/api',
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(cfg => {
    const token = localStorage.getItem('token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

api.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    me: () => api.get('/auth/me'),
    changePassword: (data) => api.post('/auth/change-password', data),
};

export const dashboardAPI = {
    summary: (params) => api.get('/dashboard/summary', { params }),
    trends: () => api.get('/dashboard/trends'),
    categoryScores: (params) => api.get('/dashboard/category-scores', { params }),
};

export const departmentsAPI = {
    list: () => api.get('/departments'),
    get: (id) => api.get(`/departments/${id}`),
    create: (data) => api.post('/departments', data),
    update: (id, data) => api.put(`/departments/${id}`, data),
    delete: (id) => api.delete(`/departments/${id}`),
    colleges: () => api.get('/departments/colleges/list'),
};

export const dataAPI = {
    metrics: () => api.get('/data/metrics'),
    periods: () => api.get('/data/periods'),
    entries: (params) => api.get('/data/entries', { params }),
    saveEntry: (data) => api.post('/data/entries', data),
    bulkSave: (data) => api.post('/data/entries/bulk', data),
    approve: (id) => api.put(`/data/entries/${id}/approve`),
    upload: (formData) => api.post('/data/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const reportsAPI = {
    exportExcel: (params) => api.get('/reports/export/excel', { params, responseType: 'blob' }),
    exportPDF: (params) => api.get('/reports/export/pdf', { params, responseType: 'blob' }),
    comparison: (params) => api.get('/reports/comparison', { params }),
};

export const notificationsAPI = {
    list: () => api.get('/notifications'),
    read: (id) => api.put(`/notifications/${id}/read`),
    readAll: () => api.put('/notifications/read-all'),
    create: (data) => api.post('/notifications', data),
};

export const usersAPI = {
    list: () => api.get('/users'),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
};

export default api;
