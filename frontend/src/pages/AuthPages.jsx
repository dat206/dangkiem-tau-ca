import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { registerApi } from '../api/authApi';

// ─── Shared: Icon (inline SVG) ────────────────────────────────────────────────
function Icon({ name, size = 18, className = '' }) {
  const paths = {
    eye:    'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    eyeoff: 'm3 3 18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9 5.5A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.3 4M6.1 6.1A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 3-.5',
    lock:   'M6 11V8a6 6 0 1 1 12 0v3m-9 0h6a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3Z',
    mail:   'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 0 8 9 8-9',
    user:   'M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    alert:  'M12 9v4m0 4h0M10.3 3.5 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z',
    check:  'm4 12 5 5L20 6',
    anchor: 'M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 6v12m0 0a8 8 0 0 1-8-8h3m5 8a8 8 0 0 0 8-8h-3M9 12h6',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d={paths[name]} />
    </svg>
  );
}

// ─── Password strength ────────────────────────────────────────────────────────
function strengthOf(pw) {
  let s = 0;
  if (pw.length >= 6)  s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH_LABEL = ['', 'Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
const STRENGTH_COLOR = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#15803d'];

// ─── Shared layout ────────────────────────────────────────────────────────────
function AuthLayout({ children, switchLabel, switchHref, onSwitch }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative bg-[#0b3d6b] text-white flex-col justify-between p-14 overflow-hidden">
        {/* Grid background */}
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" aria-hidden="true">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Rings */}
        <svg className="absolute -right-48 -bottom-48 opacity-10 pointer-events-none" width="700" height="700" viewBox="0 0 700 700">
          {[1,2,3,4,5,6,7].map(i => (
            <circle key={i} cx="350" cy="350" r={i*70} fill="none" stroke="white" strokeWidth="1" />
          ))}
        </svg>

        {/* Logo */}
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl">
            ⚓
          </div>
          <div>
            <div className="text-base font-bold tracking-wide">HỆ THỐNG ĐĂNG KIỂM</div>
            <div className="text-xs text-white/60 tracking-widest uppercase">Cục Đăng kiểm Việt Nam</div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative">
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
            Quản lý đăng kiểm<br />tàu cá toàn quốc.
          </h1>
          <p className="mt-5 text-lg text-white/75 max-w-md leading-relaxed">
            Tổng hợp dữ liệu kiểm tra an toàn kỹ thuật, xuất báo cáo quý theo tỉnh,
            đồng bộ từ hồ sơ DOCX vào kho dữ liệu trung tâm.
          </p>
          <div className="mt-10 flex gap-10">
            {[
              { n: '1.247', l: 'tàu trong CSDL' },
              { n: '15',    l: 'tỉnh tham gia' },
              { n: 'Q.II/2026', l: 'kỳ báo cáo hiện tại' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-2xl font-extrabold tabular-nums">{s.n}</div>
                <div className="text-sm text-white/60 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex justify-between text-xs text-white/40">
          <span>v2.4.1 · build 1842</span>
          <span>© 2026 · Dữ liệu phục vụ công tác đăng kiểm</span>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top switch link */}
        <div className="flex justify-end px-8 pt-8 shrink-0">
          <span className="text-sm text-slate-500">
            {switchLabel}{' '}
            <button onClick={onSwitch} className="font-bold text-[#0b3d6b] hover:underline focus:outline-none">
              {switchHref}
            </button>
          </span>
        </div>
        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Input field component ────────────────────────────────────────────────────
function Field({ label, icon, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className={`flex items-center gap-2 px-3 h-11 rounded-lg border bg-white transition-all
        ${error
          ? 'border-red-400 shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
          : 'border-slate-200 focus-within:border-[#0b3d6b] focus-within:shadow-[0_0_0_3px_rgba(11,61,107,0.10)]'
        }`}>
        <span className="text-slate-400 shrink-0"><Icon name={icon} size={15} /></span>
        {children}
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <Icon name="alert" size={12} /> {error}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function LoginPage({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [apiErr, setApiErr] = useState('');
  const [fieldErr, setFieldErr] = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Vui lòng nhập email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email không hợp lệ.';
    if (!password) e.password = 'Vui lòng nhập mật khẩu.';
    setFieldErr(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiErr('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password, remember);
      // AuthContext sẽ cập nhật isLoggedIn → App.jsx tự chuyển trang
    } catch (err) {
      setApiErr(err.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (role) => {
    setEmail(role === 'admin' ? 'admin@dangkiem.gov.vn' : 'nhanvien@dangkiem.gov.vn');
    setPassword(role === 'admin' ? 'admin123' : 'nhanvien123');
    setFieldErr({});
    setApiErr('');
  };

  return (
    <AuthLayout
      switchLabel="Chưa có tài khoản?"
      switchHref="Đăng ký ngay"
      onSwitch={onSwitchToRegister}
    >
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Đăng nhập hệ thống</h2>
        <p className="text-sm text-slate-500 mt-2">Nhập thông tin tài khoản được cấp để tiếp tục.</p>
      </div>

      {/* Demo quick-fill */}
      <div className="mb-6 p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Demo nhanh</p>
        <div className="flex gap-2">
          {['admin', 'staff'].map(r => (
            <button key={r} onClick={() => quickFill(r)}
              className="flex-1 h-8 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-600
                hover:border-[#0b3d6b] hover:text-[#0b3d6b] transition-colors">
              {r === 'admin' ? '👑 Admin' : '👤 Nhân viên'}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Email" icon="mail" error={fieldErr.email}>
          <input id="login-email" type="email" value={email}
            onChange={e => { setEmail(e.target.value); setFieldErr(p => ({...p, email: ''})); }}
            placeholder="ten@dangkiem.gov.vn" autoComplete="email"
            className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
        </Field>

        <Field label="Mật khẩu" icon="lock" error={fieldErr.password}>
          <input id="login-password" type={showPw ? 'text' : 'password'} value={password}
            onChange={e => { setPassword(e.target.value); setFieldErr(p => ({...p, password: ''})); }}
            placeholder="••••••••" autoComplete="current-password"
            className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
          <button type="button" onClick={() => setShowPw(s => !s)}
            className="text-slate-400 hover:text-slate-600 transition-colors">
            <Icon name={showPw ? 'eyeoff' : 'eye'} size={16} />
          </button>
        </Field>

        {apiErr && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            <Icon name="alert" size={15} /> {apiErr}
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 accent-[#0b3d6b] cursor-pointer" />
          Ghi nhớ đăng nhập trên thiết bị này
        </label>

        <button id="login-submit" type="submit" disabled={loading}
          className={`h-12 rounded-xl font-bold text-white flex items-center justify-center gap-3 transition-all
            bg-[#0b3d6b] hover:bg-[#0a3560] active:scale-[.98] shadow-lg shadow-[#0b3d6b]/20
            ${loading ? 'opacity-70 cursor-wait' : ''}`}>
          {loading && (
            <span className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          )}
          {loading ? 'Đang xác thực...' : 'Đăng nhập'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        Cần hỗ trợ tài khoản? Liên hệ quản trị viên đơn vị.
      </p>
    </AuthLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTER PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function RegisterPage({ onSwitchToLogin }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '', role: 'staff' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiErr, setApiErr] = useState('');
  const [fieldErr, setFieldErr] = useState({});
  const [success, setSuccess] = useState(false);

  const set = (key) => (e) => {
    setForm(f => ({...f, [key]: e.target.value}));
    setFieldErr(p => ({...p, [key]: ''}));
    setApiErr('');
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) e.fullName = 'Họ tên phải có ít nhất 2 ký tự.';
    if (!form.email.trim()) e.email = 'Vui lòng nhập email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ.';
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu.';
    else if (form.password.length < 6) e.password = 'Tối thiểu 6 ký tự.';
    if (form.confirm !== form.password) e.confirm = 'Mật khẩu xác nhận không khớp.';
    setFieldErr(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiErr('');
    if (!validate()) return;
    setLoading(true);
    try {
      await registerApi({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password, role: form.role });
      setSuccess(true);
      setTimeout(() => onSwitchToLogin(), 2000);
    } catch (err) {
      setApiErr(err.response?.data?.detail || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const score = strengthOf(form.password);

  return (
    <AuthLayout
      switchLabel="Đã có tài khoản?"
      switchHref="Đăng nhập"
      onSwitch={onSwitchToLogin}
    >
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Tạo tài khoản mới</h2>
        <p className="text-sm text-slate-500 mt-2">Điền thông tin để đăng ký tài khoản đăng kiểm.</p>
      </div>

      {success ? (
        <div className="flex flex-col items-center gap-4 py-10">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <Icon name="check" size={30} className="text-green-600" />
          </div>
          <p className="text-lg font-bold text-green-700">Đăng ký thành công!</p>
          <p className="text-sm text-slate-500">Đang chuyển đến trang đăng nhập...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Họ và tên" icon="user" error={fieldErr.fullName}>
            <input id="reg-fullname" value={form.fullName} onChange={set('fullName')}
              placeholder="Nguyễn Văn A" autoComplete="name"
              className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
          </Field>

          <Field label="Email" icon="mail" error={fieldErr.email}>
            <input id="reg-email" type="email" value={form.email} onChange={set('email')}
              placeholder="ten@dangkiem.gov.vn" autoComplete="email"
              className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
          </Field>

          {/* Role selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vai trò</label>
            <div className="flex gap-2">
              {[
                { val: 'staff', label: '👤 Nhân viên', desc: 'Xem và upload hồ sơ' },
                { val: 'admin', label: '👑 Quản trị viên', desc: 'Toàn quyền hệ thống' },
              ].map(r => (
                <button key={r.val} type="button" onClick={() => setForm(f => ({...f, role: r.val}))}
                  className={`flex-1 p-3 rounded-xl text-left border transition-all
                    ${form.role === r.val
                      ? 'border-[#0b3d6b] bg-blue-50 text-[#0b3d6b]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                  <div className="text-sm font-bold">{r.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <Field label="Mật khẩu" icon="lock" error={fieldErr.password}>
            <input id="reg-password" type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
              placeholder="Tối thiểu 6 ký tự" autoComplete="new-password"
              className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
            <button type="button" onClick={() => setShowPw(s => !s)}
              className="text-slate-400 hover:text-slate-600 transition-colors">
              <Icon name={showPw ? 'eyeoff' : 'eye'} size={16} />
            </button>
          </Field>

          {/* Strength bar */}
          {form.password && (
            <div className="-mt-2">
              <div className="flex gap-1 mb-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex-1 h-1 rounded-full transition-all duration-200"
                    style={{ background: i <= score ? STRENGTH_COLOR[score] : '#e2e8f0' }} />
                ))}
              </div>
              <span className="text-xs font-semibold" style={{ color: STRENGTH_COLOR[score] }}>
                {STRENGTH_LABEL[score]}
              </span>
            </div>
          )}

          <Field label="Xác nhận mật khẩu" icon="lock" error={fieldErr.confirm}>
            <input id="reg-confirm" type={showConfirm ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')}
              placeholder="Nhập lại mật khẩu" autoComplete="new-password"
              className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
            <button type="button" onClick={() => setShowConfirm(s => !s)}
              className="text-slate-400 hover:text-slate-600 transition-colors">
              <Icon name={showConfirm ? 'eyeoff' : 'eye'} size={16} />
            </button>
          </Field>

          {apiErr && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              <Icon name="alert" size={15} /> {apiErr}
            </div>
          )}

          <button id="register-submit" type="submit" disabled={loading}
            className={`h-12 rounded-xl font-bold text-white flex items-center justify-center gap-3 transition-all
              bg-gradient-to-r from-[#0b3d6b] to-[#0d7377] hover:opacity-90 active:scale-[.98]
              shadow-lg shadow-[#0b3d6b]/20
              ${loading ? 'opacity-70 cursor-wait' : ''}`}>
            {loading && (
              <span className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            )}
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
