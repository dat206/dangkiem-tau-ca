import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

export const reportApi = {
  getConfigs: async () => {
    const response = await apiClient.get('/reports/configs');
    return response.data;
  },

  saveConfig: async (config) => {
    const response = await apiClient.post('/reports/configs', config);
    return response.data;
  },

  uploadBatchReports: async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await apiClient.post('/reports/upload-batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },
};

export const getReportHistory = async ({
  skip = 0,
  limit = 10,
  quarter,
  year,
} = {}) => {
  const response = await apiClient.get('/reports/history', {
    params: { skip, limit, quarter, year },
  });
  return response.data;
};

export const downloadReportHistory = async (reportId) => {
  const response = await apiClient.get(`/reports/history/${reportId}/download`, {
    responseType: 'blob',
  });
  return response.data;
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

export default apiClient;
