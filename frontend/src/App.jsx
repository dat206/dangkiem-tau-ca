<<<<<<< Updated upstream
export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-black bg-opacity-50 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-blue-400">🐟 Hệ thống Đăng kiểm Tàu cá</h1>
          <p className="text-slate-400 mt-1">Tự động xuất báo cáo từ file DOCX</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Status */}
        <section className="mb-8">
          <div className="bg-green-900 bg-opacity-20 border border-green-500 rounded-lg p-6">
            <p className="text-green-400 font-semibold">✅ Frontend React đã hoạt động</p>
            <p className="text-slate-300 mt-2">Đang chờ Backend API...</p>
          </div>
        </section>

        {/* Features Grid */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-blue-300">📋 Chức năng hệ thống</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "📤", title: "Upload DOCX", desc: "Kéo thả nhiều file" },
              { icon: "🔍", title: "Parse Dữ liệu", desc: "Trích xuất tự động" },
              { icon: "💾", title: "Lưu Database", desc: "PostgreSQL" },
              { icon: "📊", title: "Xuất Excel", desc: "2 file báo cáo" }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="bg-slate-800 hover:bg-slate-700 transition border border-slate-700 rounded-lg p-6 text-center"
              >
                <p className="text-3xl mb-2">{item.icon}</p>
                <h3 className="font-bold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Next Steps */}
        <section className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-8">
          <h3 className="text-xl font-bold mb-4 text-blue-300">🚀 Các bước tiếp theo</h3>
          <ol className="space-y-3 text-slate-300">
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">1.</span>
              <span>Thiết kế giao diện tải file và cấu hình báo cáo</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">2.</span>
              <span>Kết nối API backend (POST /api/generate-report)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">3.</span>
              <span>Xử lý upload file và hiển thị tiến độ</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">4.</span>
              <span>Deploy lên Vercel</span>
            </li>
          </ol>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black bg-opacity-50 border-t border-slate-700 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-400">
          <p>© 2024 Hệ thống Đăng kiểm Tàu cá | Built with React + FastAPI</p>
        </div>
      </footer>
    </div>
  )
}
=======
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Vessels from './pages/Vessels';
import ReportGenerate from './pages/ReportGenerate';
import ReportHistory from './pages/ReportHistory';
import AdminUsers from './pages/AdminUsers';
import AdminSettings from './pages/AdminSettings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="vessels" element={<Vessels />} />
          <Route path="reports/generate" element={<ReportGenerate />} />
          <Route path="reports/history" element={<ReportHistory />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
>>>>>>> Stashed changes
