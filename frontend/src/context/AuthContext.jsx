import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginApi, logoutApi, getMeApi } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(() => {
    const saved = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return !!saved;
  }); // kiểm tra token lưu trong storage khi khởi động

  // ── Khởi tạo: đọc token từ storage và xác thực với server ──────────────────
  useEffect(() => {
    const saved = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!saved) {
      return;
    }
    getMeApi(saved)
      .then((u) => {
        setToken(saved);
        setUser(u);
      })
      .catch(() => {
        // Token hết hạn hoặc không hợp lệ → xoá
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_user');
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password, remember = true) => {
    const data = await loginApi(email, password);
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('auth_token', data.token);
    storage.setItem('auth_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (token) await logoutApi(token);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }, [token]);

  const isLoggedIn = !!token;

  return (
    <AuthContext.Provider value={{ user, token, loading, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng trong AuthProvider');
  return ctx;
}
