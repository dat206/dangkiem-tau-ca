export default function FileUpload() {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 group transition-all hover:shadow-md">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tải hồ sơ lên</h2>
          <p className="text-slate-500 text-sm">Hỗ trợ định dạng .docx (tối đa 50 file)</p>
        </div>
      </div>
      
      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-200 transition-colors cursor-pointer relative overflow-hidden">
        <input
          type="file"
          accept=".docx"
          multiple
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <div className="text-center">
          <p className="text-slate-600 font-medium mb-1">Kéo thả file vào đây hoặc click để chọn</p>
          <p className="text-slate-400 text-xs">Các hồ sơ đăng kiểm sẽ được xử lý tự động</p>
        </div>
      </div>
    </div>
  );
}
