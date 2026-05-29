import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Lấy lịch sử xuất báo cáo.
 */
export const getReportHistory = async (params) => {
  const response = await axios.get(`${API_URL}/reports/history`, { params });
  return response.data;
};

/**
 * Tải tệp ZIP báo cáo từ lịch sử theo ID.
 */
export const downloadReportHistory = async (reportId) => {
  const response = await axios.get(`${API_URL}/reports/history/${reportId}/download`, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Trích xuất DOCX và sinh báo cáo ZIP trực tiếp.
 */
export const generateReport = async (files, config) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });
  formData.append("quarter", config.quarter);
  formData.append("year", config.year);
  
  // Hỗ trợ cả mảng tỉnh thành và chuỗi tỉnh thành
  const provinceStr = Array.isArray(config.provinces) 
    ? config.provinces.join(',') 
    : config.provinces;
  formData.append("provinces", provinceStr);

  const response = await axios.post(`${API_URL}/reports/generate-report`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Tải lên hàng loạt DOCX và trích xuất dữ liệu lưu DB.
 */
export const uploadBatchReports = async (files) => {
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
};

/**
 * Helper tải xuống file dạng Blob từ trình duyệt.
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
};

export const reportApi = {
  getConfigs: async () => {
    const response = await axios.get(`${API_URL}/reports/configs`);
    return response.data;
  },
  saveConfig: async (config) => {
    const response = await axios.post(`${API_URL}/reports/configs`, config);
    return response.data;
  },
  uploadBatchReports,
  getReportHistory,
  downloadReportHistory,
  generateReport,
  downloadBlob
};
