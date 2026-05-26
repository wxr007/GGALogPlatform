import api from './api';

export const adminService = {
  getUsers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  setAdmin: async (id: string, isAdmin: boolean) => {
    const response = await api.put(`/admin/users/${id}/admin`, { isAdmin });
    return response.data;
  },

  getUserDatasets: async (id: string, params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) => {
    const response = await api.get(`/admin/users/${id}/datasets`, { params });
    return response.data;
  }
};
