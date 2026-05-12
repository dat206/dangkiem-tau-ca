function App() {
  return (
    // Sử dụng Tailwind CSS v4 để styling (bg-blue-500 để test theo yêu cầu sếp)
    <div className="min-h-screen bg-blue-500 text-white p-10 font-sans">
      <h1 className="text-4xl font-bold mb-4">Hệ thống Đăng kiểm Tàu cá</h1>

      <p className="text-xl">Frontend React + Tailwind CSS đã hoạt động 🎉</p>

      <div className="mt-8 p-6 bg-blue-600 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 border-b border-blue-400 pb-2">Chức năng hệ thống</h2>

        <ul className="space-y-2 list-disc list-inside">
          <li>Upload DOCX</li>
          <li>Parse dữ liệu tự động</li>
          <li>Lưu trữ vào cơ sở dữ liệu</li>
          <li>Xuất báo cáo Excel</li>
        </ul>
      </div>

      <div className="mt-8 p-4 bg-white/10 backdrop-blur-md rounded-lg">
        <p className="italic">
          Tailwind CSS v4 is configured and ready!
        </p>
      </div>
    </div>
  )
}

export default App