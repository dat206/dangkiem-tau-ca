import { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage, RegisterPage } from './pages/AuthPages';

// HBM Admin Dashboard imports
import { Sidebar } from './hbm/chrome';
import { DashboardScreen } from './hbm/screens-auth-dash';
import { UploadScreen, VesselsScreen, ReportsGenerateScreen, ReportsHistoryScreen } from './hbm/screens-data';
import { AdminUsersScreen, AdminSettingsScreen } from './hbm/screens-admin';

// User/Staff Dashboard imports (real features)
import FileUpload from './components/FileUpload';
import HistoryPage from './components/HistoryPage';
import { generateReport, downloadBlob } from './api/reportApi';

// ─── Constants & Child Components for UserApp ────────────────────────────────
const PROVINCES_LIST = [
  { code: 'QN', name: 'Quảng Ninh' },
  { code: 'TH', name: 'Thanh Hóa' },
  { code: 'HT', name: 'Hà Tĩnh' },
  { code: 'NB', name: 'Ninh Bình' },
  { code: 'NA', name: 'Nam Định' },
  { code: 'NG', name: 'Nghệ An' },
  { code: 'CT', name: 'Cà Mau' },
  { code: 'KG', name: 'Kiên Giang' },
  { code: 'BD', name: 'Bạc Liêu' },
  { code: 'SL', name: 'Sóc Trăng' },
];

function LogoutModal({ onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl p-8 w-96 shadow-2xl border border-slate-100 animate-slideUp">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 11V8a6 6 0 1 1 12 0v3m-9 0h6a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3Z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-center text-slate-800 mb-2">Xác nhận đăng xuất</h3>
        <p className="text-sm text-slate-500 text-center mb-7 leading-relaxed">
          Bạn có chắc muốn đăng xuất khỏi hệ thống?<br />
          Phiên làm việc hiện tại sẽ kết thúc.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
            Hủy
          </button>
          <button id="logout-confirm-btn" onClick={onConfirm} disabled={loading}
            className={`flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm
              flex items-center justify-center gap-2 transition-colors ${loading ? 'opacity-70 cursor-wait' : ''}`}>
            {loading && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
            {loading ? 'Đang đăng xuất...' : 'Đăng xuất'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── USER/STAFF APP (Giao diện cũ thanh ngang - Ảnh 2) ────────────────────────
function UserApp() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // States for report generation form
  const [files, setFiles] = useState([]);
  const [quarter, setQuarter] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedProvinces, setSelectedProvinces] = useState(['QN', 'TH']);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [downloadBlobData, setDownloadBlobData] = useState(null);
  const [downloadFilename, setDownloadFilename] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleProvinceToggle = (code) => {
    setSelectedProvinces(prev =>
      prev.includes(code) ? prev.filter(p => p !== code) : [...prev, code]
    );
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) { alert('Vui lòng chọn ít nhất một file .docx để sinh báo cáo!'); return; }
    if (selectedProvinces.length === 0) { alert('Vui lòng chọn ít nhất một tỉnh thành!'); return; }
    setLoading(true); setSuccessMsg(''); setErrorMsg(''); setDownloadBlobData(null);
    try {
      const config = { quarter: Number(quarter), year: Number(year), provinces: selectedProvinces };
      const blob = await generateReport(files, config);
      const filename = `report_q${quarter}_${year}.zip`;
      setDownloadBlobData(blob);
      setDownloadFilename(filename);
      setSuccessMsg('Sinh báo cáo thành công! Tệp ZIP đã sẵn sàng tải xuống.');
      downloadBlob(blob, filename);
    } catch (error) {
      setErrorMsg(`Đã xảy ra lỗi: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = () => {
    if (downloadBlobData && downloadFilename) downloadBlob(downloadBlobData, downloadFilename);
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    await logout();
    setLogoutLoading(false);
    setShowLogoutModal(false);
  };

  // User initials
  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-teal-500/20">
              🐟
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">Hệ Thống Đăng Kiểm Tàu Cá</h1>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-400">Tự động xuất báo cáo chất lượng cao</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Tabs */}
            <nav className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'upload',   label: 'Trích xuất dữ liệu' },
                { id: 'generate', label: 'Tạo báo cáo quý' },
                { id: 'history',  label: 'Lịch sử xuất bản' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* User + Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-[#0b3d6b] flex items-center justify-center text-xs font-bold text-white">
                  {initials}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-tight">{user?.full_name || 'Người dùng'}</div>
                  <div className="text-xs text-teal-400 capitalize">{user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</div>
                </div>
              </div>
              <button
                id="logout-btn"
                onClick={() => setShowLogoutModal(true)}
                title="Đăng xuất"
                className="ml-1 w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700
                  text-slate-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'upload' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <FileUpload />
          </div>
        )}

        {activeTab === 'generate' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                <span>📊</span> Cấu hình &amp; Sinh báo cáo quý tự động
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Chọn danh sách file văn bản Word (.docx), cài đặt quý, năm và các tỉnh cần báo cáo.
              </p>
              <form onSubmit={handleGenerateSubmit} className="space-y-6">
                {/* File Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-200">1. Chọn danh sách file văn bản (.docx)</label>
                  <div className="border-2 border-dashed border-slate-700 hover:border-teal-500 bg-slate-900/40 hover:bg-slate-900/60 rounded-xl p-8 text-center transition-all cursor-pointer relative group">
                    <input type="file" multiple accept=".docx" onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" id="generate-file-input" />
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">📂</span>
                      <span className="text-teal-400 group-hover:text-teal-300 font-bold">Bấm vào đây để chọn tệp</span>
                      <span className="text-slate-500 text-xs mt-1">Chấp nhận nhiều tệp .docx</span>
                    </div>
                  </div>
                  {files.length > 0 && (
                    <div className="mt-2 p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-sm flex items-center justify-between">
                      <span className="text-green-400 font-semibold">✓ Đã chọn {files.length} file tài liệu.</span>
                      <button type="button" onClick={() => setFiles([])} className="text-xs text-red-400 hover:underline font-bold">Xóa tất cả</button>
                    </div>
                  )}
                </div>

                {/* Quarter & Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-200">2. Chọn Quý báo cáo</label>
                    <select value={quarter} onChange={e => setQuarter(Number(e.target.value))}
                      className="w-full h-11 bg-slate-900 border border-slate-800 rounded-lg px-3 text-white font-semibold outline-none focus:border-teal-500">
                      <option value={1}>Quý I (Tháng 1-3)</option>
                      <option value={2}>Quý II (Tháng 4-6)</option>
                      <option value={3}>Quý III (Tháng 7-9)</option>
                      <option value={4}>Quý IV (Tháng 10-12)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-200">3. Chọn Năm báo cáo</label>
                    <input type="number" min="2000" max="2100" value={year} onChange={e => setYear(Number(e.target.value))}
                      className="w-full h-11 bg-slate-900 border border-slate-800 rounded-lg px-3 text-white font-semibold outline-none focus:border-teal-500" />
                  </div>
                </div>

                {/* Provinces */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-200">4. Lọc theo tỉnh ({selectedProvinces.length} đã chọn)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                    {PROVINCES_LIST.map(prov => {
                      const isChecked = selectedProvinces.includes(prov.code);
                      return (
                        <button key={prov.code} type="button" onClick={() => handleProvinceToggle(prov.code)}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-left text-sm font-semibold transition-all ${
                            isChecked
                              ? 'bg-teal-500/10 border-teal-500 text-teal-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}>
                          <span className={`h-4 w-4 rounded flex items-center justify-center text-[10px] ${
                            isChecked ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 border border-slate-700'
                          }`}>{isChecked && '✓'}</span>
                          {prov.name} ({prov.code})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {successMsg && (
                  <div className="p-4 bg-teal-950/80 border border-teal-500/50 rounded-xl flex items-center justify-between text-teal-300 text-sm">
                    <span>{successMsg}</span>
                    <button type="button" onClick={triggerDownload}
                      className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors">
                      Tải ngay
                    </button>
                  </div>
                )}
                {errorMsg && (
                  <div className="p-4 bg-red-950/80 border border-red-500/50 rounded-xl text-red-400 text-sm">{errorMsg}</div>
                )}

                <button type="submit" disabled={loading || files.length === 0}
                  className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-base ${
                    loading || files.length === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-teal-500 hover:bg-teal-400 text-slate-950 hover:shadow-lg hover:shadow-teal-500/15'
                  }`}>
                  {loading ? (
                    <><span className="animate-spin inline-block h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full"></span>Đang xử lý...</>
                  ) : (
                    <><span>⚡</span> Sinh báo cáo và tải xuống (ZIP)</>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-900">
            <HistoryPage />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 bg-slate-950/40">
        <p>© 2026 Hệ thống Đăng kiểm Tàu cá Việt Nam.</p>
      </footer>

      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
          loading={logoutLoading}
        />
      )}
    </div>
  );
}

// ─── ADMIN APP (Giao diện mới Sidebar dọc - Ảnh 1) ────────────────────────────
function AdminApp() {
  const { user, logout } = useAuth();
  const [route, setRoute] = useState("dashboard"); // 'dashboard' | 'upload' | 'vessels' | 'reports/generate' | 'reports/history' | 'admin/users' | 'admin/settings'

  // Áp dụng biến CSS của theme phong cách mới khi tải trang
  useEffect(() => {
    const p = {
      primary:    "#0b3d6b",
      accent:     "#0d7377",
      tint:       "#e6eef6",
      onPrimary:  "#ffffff",
      sidebarBg:  "#0a2e52",
      sidebarFg:  "#cfd9e6",
      sidebarHov: "rgba(255,255,255,.08)",
      sidebarAct: "rgba(255,255,255,.14)",
    };
    const root = document.documentElement;
    root.style.setProperty("--brand-primary",     p.primary);
    root.style.setProperty("--brand-accent",      p.accent);
    root.style.setProperty("--brand-tint",        p.tint);
    root.style.setProperty("--brand-on-primary",  p.onPrimary);
    root.style.setProperty("--sidebar-bg",        p.sidebarBg);
    root.style.setProperty("--sidebar-fg",        p.sidebarFg);
    root.style.setProperty("--sidebar-hov",       p.sidebarHov);
    root.style.setProperty("--sidebar-act",       p.sidebarAct);
    
    // Thiết lập màu nền và chữ mặc định cho giao diện mới
    root.style.setProperty("--surface-page",      "#f4f6fa");
    root.style.setProperty("--surface-card",      "#ffffff");
    root.style.setProperty("--surface-muted",     "#f8fafc");
    root.style.setProperty("--text-strong",       "#0f172a");
    root.style.setProperty("--text-body",         "#334155");
    root.style.setProperty("--text-soft",         "#64748b");
    root.style.setProperty("--text-mute",         "#94a3b8");
    root.style.setProperty("--border-soft",       "#e5e9f0");
    root.style.setProperty("--border-strong",     "#cbd5e1");
  }, []);

  const currentUser = useMemo(() => {
    if (!user) return { name: "Người dùng", initials: "ND" };
    const name = user.full_name || "Người dùng";
    const initials = name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
    return { name, initials };
  }, [user]);

  const onNav = (id) => {
    setRoute(id);
  };

  const handleLogout = async () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")) {
      await logout();
    }
  };

  const screenComponent = () => {
    const common = { density: "regular", statLayout: "stacked", role: user?.role || "staff", onNav };
    switch (route) {
      case "dashboard":         return <DashboardScreen {...common}/>;
      case "upload":            return <UploadScreen {...common}/>;
      case "vessels":           return <VesselsScreen {...common}/>;
      case "reports/generate":  return <ReportsGenerateScreen {...common}/>;
      case "reports/history":   return <ReportsHistoryScreen {...common}/>;
      case "admin/users":       return <AdminUsersScreen {...common}/>;
      case "admin/settings":    return <AdminSettingsScreen {...common}/>;
      default:                  return <DashboardScreen {...common}/>;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        active={route}
        onNav={onNav}
        onLogout={handleLogout}
        role={user?.role || "staff"}
        iconStyle="svg"
        currentUser={currentUser}
      />
      <main className="main">
        {screenComponent()}
      </main>
    </div>
  );
}

// ─── Auth shell: quyết định hiện trang nào ────────────────────────────────────
function AuthShell() {
  const { isLoggedIn, loading, user } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'

  // Đang kiểm tra token → hiện loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-teal-500 animate-spin" />
          <p className="text-slate-400 text-sm">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    if (authView === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
  }

  // Điều hướng dựa trên vai trò của người dùng
  if (user?.role === 'admin') {
    return <AdminApp />;
  } else {
    return <UserApp />;
  }
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AuthShell />
    </AuthProvider>
  );
}
