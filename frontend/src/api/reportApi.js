import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Issue #003: Thiết lập Axios Client với Base URL và Timeout cho hệ thống
const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 60000, // Thời gian chờ 1 phút để upload file lớn
});

// Các hàm API
// Issue #015: Hàm gửi yêu cầu xuất báo cáo với các tham số cấu hình (quý, năm, tỉnh)
export const generateReport = async (files, config) => {
  /**
   * Tạo báo cáo từ danh sách các file DOCX
   * @param {File[]} files - Danh sách các file DOCX
   * @param {Object} config - Cấu hình { quarter, year, provinces }
   * @returns {Promise<Blob>} - File ZIP kết quả
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
   * Lấy lịch sử xuất báo cáo từ máy chủ
   * @param {number} skip - Vị trí bắt đầu (phân trang)
   * @param {number} limit - Số lượng bản ghi mỗi trang
   * @returns {Promise<Array>} - Danh sách các báo cáo đã xuất
   */
  try {
    const response = await apiClient.get('/reports/history', {
      params: { skip, limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
};

export const downloadBlob = (blob, filename) => {
  /**
   * Kích hoạt trình duyệt tải xuống file từ dữ liệu Blob
   * @param {Blob} blob - Dữ liệu file (Blob)
   * @param {string} filename - Tên file khi tải xuống
   */
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

export default apiClient;
