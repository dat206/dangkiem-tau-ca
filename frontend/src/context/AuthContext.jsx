import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loginApi, logoutApi, getMeApi } from '../api/authApi';

const AuthContext = createContext(null);
const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 tiếng (3.600.000 ms)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(() => {
    const saved = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return !!saved;
  }); // kiểm tra token lưu trong storage khi khởi động

  // Dùng ref để lưu trữ timer idle tránh re-create liên tục
  const idleTimerRef = useRef(null);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (token) {
      logoutApi(token).catch(() => {}); // Gọi ngầm, không block UI
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('last_activity');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('last_activity');
    setToken(null);
    setUser(null);
  }, [token]);

  // ── Khởi tạo: đọc token từ storage và xác thực với server ──────────────────
  useEffect(() => {
    const saved = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!saved) {
      setLoading(false);
      return;
    }

    // Kiểm tra thời gian rảnh rỗi trước khi load lại trang
    const lastActivity = localStorage.getItem('last_activity') || sessionStorage.getItem('last_activity');
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10);
      if (elapsed >= IDLE_TIMEOUT_MS) {
        // Đã quá 1 tiếng rảnh rỗi → Đăng xuất ngay lập tức
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('last_activity');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_user');
        sessionStorage.removeItem('last_activity');
        setLoading(false);
        return;
      }
    }

    getMeApi(saved)
      .then((u) => {
        setToken(saved);
        setUser(u);
        const nowStr = Date.now().toString();
        localStorage.setItem('last_activity', nowStr);
        sessionStorage.setItem('last_activity', nowStr);
      })
      .catch((err) => {
        // Chỉ đăng xuất khi lỗi xác thực 401 hoặc 403 (Token hết hạn/không hợp lệ)
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          localStorage.removeItem('last_activity');
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_user');
          sessionStorage.removeItem('last_activity');
        } else {
          // Gặp lỗi mạng hoặc server chưa khởi động kịp → Giữ phiên đăng nhập
          const savedUser = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');
          setToken(saved);
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password, remember = true) => {
    const data = await loginApi(email, password);
    const storage = remember ? localStorage : sessionStorage;
    const nowStr = Date.now().toString();
    storage.setItem('auth_token', data.token);
    storage.setItem('auth_user', JSON.stringify(data.user));
    storage.setItem('last_activity', nowStr);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  // ── Theo dõi hoạt động rảnh rỗi (Idle Timeout) ──────────────────────────────
  useEffect(() => {
    if (!token) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    const checkIdle = () => {
      const lastActivity = localStorage.getItem('last_activity') || sessionStorage.getItem('last_activity');
      if (lastActivity) {
        const elapsed = Date.now() - parseInt(lastActivity, 10);
        if (elapsed >= IDLE_TIMEOUT_MS) {
          logout();
        } else {
          // Người dùng hoạt động ở tab khác -> Thiết lập timer cho thời gian còn lại
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
          idleTimerRef.current = setTimeout(checkIdle, IDLE_TIMEOUT_MS - elapsed);
        }
      } else {
        logout();
      }
    };

    const resetTimer = () => {
      const nowStr = Date.now().toString();
      localStorage.setItem('last_activity', nowStr);
      sessionStorage.setItem('last_activity', nowStr);

      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(checkIdle, IDLE_TIMEOUT_MS);
    };

    // Các sự kiện tương tác của người dùng
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Khởi tạo timer ban đầu
    resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [token, logout]);

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
