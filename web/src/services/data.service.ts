import api from './api';

export const dataService = {
  getDatasets: async (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    sort?: string;
    order?: string;
  }) => {
    const response = await api.get('/data/datasets', { params });
    return response.data;
  },

  getDatasetDetail: async (id: string) => {
    const response = await api.get(`/data/datasets/${id}`);
    return response.data;
  },

  downloadDataset: async (id: string, fileName: string) => {
    const response = await api.get(`/data/datasets/${id}/download`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  getStats: async () => {
    const response = await api.get('/data/stats');
    return response.data;
  }
};
