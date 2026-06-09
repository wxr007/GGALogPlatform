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
  },

  getDatasetDetail: async (id: string) => {
    const response = await api.get(`/admin/datasets/${id}`);
    return response.data;
  },

  downloadDataset: async (id: string, fileName: string) => {
    const response = await api.get(`/admin/datasets/${id}/download`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
