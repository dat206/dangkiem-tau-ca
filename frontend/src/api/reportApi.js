import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const reportApi = {
  getConfigs: async () => {
    const response = await axios.get(`${API_URL}/reports/configs`);
    return response.data;
  },
  saveConfig: async (config) => {
    const response = await axios.post(`${API_URL}/reports/configs`, config);
    return response.data;
  },
  /**
   * Hàm gọi API gửi danh sách nhiều file Word lên server để xử lý hàng loạt.
   */
  uploadBatchReports: async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await axios.post(`${API_URL}/reports/upload-batch`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};