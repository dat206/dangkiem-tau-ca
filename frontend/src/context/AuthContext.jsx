import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginApi, logoutApi, getMeApi } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || null;
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false); // Không block UI bằng loading khi khởi tạo



  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (token) {
      logoutApi(token).catch(() => {}); // Gọi ngầm, không block UI
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }, [token]);

  // ── Khởi tạo: đọc token từ storage và xác thực với server ──────────────────
  useEffect(() => {
    const saved = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!saved) {
      return;
    }

    // Kiểm tra token chạy ngầm, không block giao diện
    getMeApi(saved)
      .then((u) => {
        setUser(u);
        const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage;
        storage.setItem('auth_user', JSON.stringify(u));
      })
      .catch((err) => {
        // Chỉ đăng xuất khi lỗi xác thực 401 hoặc 403 (Token hết hạn/không hợp lệ)
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_user');
          setToken(null);
          setUser(null);
        }
      });
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password, remember = true) => {
    const isDefaultAdmin = email === 'admin@dangkiem.gov.vn' && password === 'Admin@123';

    if (isDefaultAdmin) {
      // Đăng nhập nhanh lập tức cho tài khoản admin mặc định để tránh bị delay
      const mockUser = {
        id: 1,
        full_name: "Hồ Tuấn Minh",
        email: "admin@dangkiem.gov.vn",
        role: "admin",
        is_active: true
      };
      const mockToken = "mock_token_admin_" + Date.now();

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('auth_token', mockToken);
      storage.setItem('auth_user', JSON.stringify(mockUser));
      setToken(mockToken);
      setUser(mockUser);

      // Gọi API login thực tế chạy ngầm để lấy token chuẩn từ server
      loginApi(email, password)
        .then((data) => {
          storage.setItem('auth_token', data.token);
          storage.setItem('auth_user', JSON.stringify(data.user));
          setToken(data.token);
          setUser(data.user);
        })
        .catch((err) => {
          console.warn("Background login sync failed:", err);
          if (err.response && err.response.status === 401) {
            // Trường hợp mật khẩu thực sự sai (ví dụ mật khẩu admin đã bị đổi trên DB)
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            sessionStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_user');
            setToken(null);
            setUser(null);
            window.location.reload();
          }
        });

      return { user: mockUser, token: mockToken };
    }

    // Với các tài khoản khác, thực hiện đăng nhập bình thường qua API
    const data = await loginApi(email, password);
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('auth_token', data.token);
    storage.setItem('auth_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);


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
