import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      if (email === 'admin@dangkiem.vn' && password === '123456') {
        navigate('/dashboard');
      } else {
        setError('Sai tên đăng nhập hoặc mật khẩu');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        
        {/* Brand Panel */}
        <div className={styles.brandPanel}>
          <svg className={styles.waveSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h4l3-9 5 18 3-9h5" />
          </svg>
          <h1 className={styles.brandTitle}>Hệ thống Đăng kiểm Tàu cá</h1>
          <p className={styles.brandSubtitle}>Cục Đăng kiểm Việt Nam</p>
        </div>

        {/* Form Panel */}
        <div className={styles.formPanel}>
          <div>
            <h2 className={styles.formTitle}>Đăng nhập</h2>
            <p className={styles.formSubtitle}>Vui lòng đăng nhập để truy cập hệ thống</p>
          </div>

          {error && (
            <div className={styles.errorAlert}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form className={styles.form} onSubmit={handleLogin}>
            <Input
              label="Tên đăng nhập / Email"
              type="text"
              placeholder="Nhập email hoặc tên đăng nhập"
              iconLeft={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <Input
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              iconLeft={Lock}
              iconRight={showPassword ? EyeOff : Eye}
              onIconRightClick={() => setShowPassword(!showPassword)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className={styles.checkboxWrapper}>
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Ghi nhớ đăng nhập</label>
            </div>

            <Button type="submit" loading={loading} className={styles.submitBtn} size="lg">
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </Button>
          </form>

          <div className={styles.footer}>
            Phiên bản 1.0.0 &copy; 2026 Cục Đăng kiểm Việt Nam
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
