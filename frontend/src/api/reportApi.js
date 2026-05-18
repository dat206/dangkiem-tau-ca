import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 60000, // 1 minute timeout for file upload
});

// API Functions
export const generateReport = async (files, config) => {
  /**
   * Generate report từ list files DOCX
   * @param {File[]} files - Array of DOCX files
   * @param {Object} config - { quarter, year, provinces }
   * @returns {Promise<Blob>} - ZIP file
   */
  const formData = new FormData();
  
  files.forEach(file => formData.append('files', file));
  formData.append('quarter', config.quarter);
  formData.append('year', config.year);
  formData.append('provinces', config.provinces.join(','));

  try {
    const response = await apiClient.post('/generate-report', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
    });
    
    return response.data;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

export const getReportHistory = async (skip = 0, limit = 10) => {
  /**
   * Lấy lịch sử xuất báo cáo
   * @param {number|Object} skip - Pagination offset or query params
   * @param {number} limit - Number of records
   * @returns {Promise<Object>} - Paginated reports
   */
  const params = typeof skip === 'object'
    ? {
        skip: skip.skip ?? 0,
        limit: skip.limit ?? 10,
        quarter: skip.quarter || undefined,
        year: skip.year || undefined,
      }
    : { skip, limit };

  try {
    const response = await apiClient.get('/reports/history', {
      params,
    });

    if (Array.isArray(response.data)) {
      return {
        items: response.data,
        total: response.data.length,
        skip: params.skip,
        limit: params.limit,
      };
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
};

export const downloadReportHistory = async (reportId) => {
  /**
   * Download lại báo cáo đã xuất
   * @param {number} reportId - Report history ID
   * @returns {Promise<Blob>} - Report file blob
   */
  try {
    const response = await apiClient.get(`/reports/history/${reportId}/download`, {
      responseType: 'blob',
    });

    return response.data;
  } catch (error) {
    console.error('Error downloading history report:', error);
    throw error;
  }
};

export const downloadBlob = (blob, filename) => {
  /**
   * Trigger download of blob file
   * @param {Blob} blob - File blob
   * @param {string} filename - Download filename
   */
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

export default apiClient;
