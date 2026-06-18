import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Anchor } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password, remember);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        'Sai email hoặc mật khẩu. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      {/* ─── Left panel ─────────────────────────────────── */}
      <div className={styles.brandPanel}>
        {/* Decorative circles */}
        <div className={styles.circle} style={{ width: 480, height: 480, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className={styles.circle} style={{ width: 320, height: 320, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className={styles.circle} style={{ width: 160, height: 160, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />

        <div className={styles.brandContent}>
          {/* Logo */}
          <div className={styles.brandLogo}>
            <Anchor size={22} />
            <div>
              <div className={styles.brandLogoTitle}>HỆ THỐNG ĐĂNG KIỂM</div>
              <div className={styles.brandLogoSub}>CỤC ĐĂNG KIỂM VIỆT NAM</div>
            </div>
          </div>

          {/* Headline */}
          <h1 className={styles.brandHeadline}>
            Quản lý đăng kiểm<br />tàu cá toàn quốc.
          </h1>
          <p className={styles.brandDesc}>
            Tổng hợp dữ liệu kiểm tra an toàn kỹ thuật, xuất báo cáo quý theo tỉnh,
            đồng bộ từ hồ sơ DOCX vào kho dữ liệu trung tâm.
          </p>

          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>1.247</span>
              <span className={styles.statLabel}>tàu trong CSDL</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>15</span>
              <span className={styles.statLabel}>tỉnh tham gia</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>Q.II/2026</span>
              <span className={styles.statLabel}>kỳ báo cáo hiện tại</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.brandFooter}>
          v2.4.1 · build 1842
          <span style={{ flex: 1 }} />
          © 2026 · Dữ liệu phục vụ công tác đăng kiểm
        </div>
      </div>

      {/* ─── Right panel (form) ──────────────────────────── */}
      <div className={styles.formPanel}>
        <div className={styles.formBox}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Đăng nhập hệ thống</h2>
            <p className={styles.formSubtitle}>
              Vui lòng nhập thông tin tài khoản được cấp.
            </p>
          </div>

          {error && (
            <div className={styles.errorAlert}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form className={styles.form} onSubmit={handleLogin} noValidate>
            {/* Email */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="login-email">
                Email / Tên đăng nhập
              </label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@dangkiem.gov.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="login-password">
                Mật khẩu
              </label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className={styles.checkbox}
                id="login-remember"
              />
              <span className={styles.checkboxLabel}>
                Ghi nhớ đăng nhập trên thiết bị này
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
              id="login-submit"
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Đang xác thực...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <p className={styles.supportNote}>
            Cần hỗ trợ tài khoản?{' '}
            <span className={styles.supportLink}>Liên hệ quản trị viên đơn vị.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
