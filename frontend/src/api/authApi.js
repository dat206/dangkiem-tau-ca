import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ─── Axios instance với Bearer token tự động ─────────────────────────────────
export const authAxios = axios.create({ baseURL: API_URL });

authAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// ─── Auth API calls ───────────────────────────────────────────────────────────

/**
 * Đăng nhập — trả về { user, token, message }
 */
export const loginApi = async (email, password) => {
  const res = await axios.post(`${API_URL}/auth/login`, { email, password });
  return res.data;
};

/**
 * Đăng ký tài khoản mới — trả về UserResponse
 */
export const registerApi = async ({ fullName, email, password, role = 'staff' }) => {
  const res = await axios.post(`${API_URL}/auth/register`, {
    full_name: fullName,
    email,
    password,
    role,
  });
  return res.data;
};

/**
 * Đăng xuất — vô hiệu hoá token trên server
 */
export const logoutApi = async (token) => {
  try {
    await axios.post(
      `${API_URL}/auth/logout`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (_) {
    // Bỏ qua lỗi mạng — vẫn xoá storage phía client
  }
};

/**
 * Lấy thông tin người dùng hiện tại từ token
 */
export const getMeApi = async (token) => {
  const res = await axios.get(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
