import { useState } from 'react';
import ReportConfig from './components/ReportConfig';
import FileUpload from './components/FileUpload';
import DownloadPanel from './components/DownloadPanel';
import { Toaster, toast } from 'react-hot-toast';

function App() {
  // Issue #015: Quản lý cấu hình báo cáo tại component cha
  const [config, setConfig] = useState(null);

  // Issue #015: Xử lý khi người dùng nhấn xác nhận cấu hình
  const handleConfigSubmit = (data) => {
    setConfig(data);
    toast.success(`Đã cấu hình báo cáo Quý ${data.quarter}/${data.year} cho ${data.provinces.length} tỉnh!`, {
      style: {
        borderRadius: '12px',
        background: '#1e293b',
        color: '#fff',
      },
    });
    console.log('Report Configuration:', data);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12 font-sans selection:bg-blue-100">
      <Toaster position="top-right" />
      
      <header className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
          Hệ thống Đăng kiểm Tàu cá
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Công cụ tự động hóa xử lý hồ sơ và xuất báo cáo đăng kiểm chuyên nghiệp.
        </p>
      </header>

      <main className="max-w-4xl mx-auto space-y-8">
        {/* Bước 1: Cấu hình báo cáo */}
        <section className="relative">
          <div className="absolute -left-12 top-2 hidden lg:flex flex-col items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg">1</span>
            <div className="w-px h-full bg-slate-200 min-h-[100px]"></div>
          </div>
          <ReportConfig onSubmit={handleConfigSubmit} />
        </section>

        {config && (
          <>
            {/* Hiển thị cấu hình hiện tại (Subtle) */}
            <section className="bg-slate-100/50 p-4 rounded-xl border border-slate-200/50 flex flex-wrap gap-6 items-center animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Đang cấu hình:</span>
              </div>
              <p className="text-slate-700 font-medium text-sm">
                Quý {config.quarter}, {config.year} • {config.provinces.length} tỉnh thành
              </p>
            </section>

            {/* Bước 2: Tải lên hồ sơ */}
            <section className="relative animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
              <div className="absolute -left-12 top-2 hidden lg:flex flex-col items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg">2</span>
                <div className="w-px h-full bg-slate-200 min-h-[100px]"></div>
              </div>
              <FileUpload />
            </section>

            {/* Bước 3: Kết quả xử lý */}
            <section className="relative animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              <div className="absolute -left-12 top-2 hidden lg:flex flex-col items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg">3</span>
              </div>
              <DownloadPanel />
            </section>
          </>
        )}
      </main>

      <footer className="mt-20 py-8 border-t border-slate-100 text-center text-slate-400 text-sm">
        <p>&copy; 2026 Hệ thống Đăng kiểm Tàu cá. Chuyên nghiệp - Hiệu quả - Bảo mật.</p>
      </footer>
    </div>
  );
}

export default App;