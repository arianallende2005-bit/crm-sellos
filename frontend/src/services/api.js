import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// Helper to get static upload files (strips /api from the URL)
export const STATIC_URL = BASE_URL.replace('/api', '');

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Important: send cookies with requests
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 errors (unauthorized - token expired or invalid)
        if (error.response?.status === 401) {
            // Clear auth state and redirect to login only if not already on login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// Authentication API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
    getAll: () => api.get('/users'),
    create: (userData) => api.post('/users', userData),
    update: (id, userData) => api.put(`/users/${id}`, userData),
    resetPassword: (id, password) => api.put(`/users/${id}/password`, { password }),
    toggleActive: (id) => api.put(`/users/${id}/toggle-active`),
    changeOwnPassword: (currentPassword, newPassword) =>
        api.put('/users/me/password', { currentPassword, newPassword }),
    delete: (id) => api.delete(`/users/${id}`),
};

// Orders API
export const ordersAPI = {
    getAll: (params) => api.get('/orders', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    create: (formData) => api.post('/orders', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    update: (id, formData) => api.put(`/orders/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    updateStatus: (id, formData) => api.put(`/orders/${id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    updateHistoryNotes: (orderId, status, notes) => api.put(`/orders/${orderId}/history/${status}/notes`, { notes }),
    updatePriority: (id, priority_order) => api.put(`/orders/${id}/priority`, { priority_order }),
    toggleArchive: (id, is_archived) => api.put(`/orders/${id}/archive`, { is_archived }),
    toggleUrgent: (id, is_urgent) => api.put(`/orders/${id}/urgent`, { is_urgent }),
    getStats: () => api.get('/orders/stats'),
    delete: (id) => api.delete(`/orders/${id}`),
};

// Notifications API
export const notificationsAPI = {
    getAll: (limit) => api.get('/notifications', { params: { limit } }),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
