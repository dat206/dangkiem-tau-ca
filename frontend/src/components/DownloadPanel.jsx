export default function DownloadPanel() {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 group transition-all hover:shadow-md">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Kết quả xử lý</h2>
          <p className="text-slate-500 text-sm">Báo cáo tổng hợp theo mẫu quy định</p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
           <svg className="w-8 h-8 text-slate-300 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
           </svg>
        </div>
        <div className="space-y-1">
          <p className="text-slate-600 font-medium">Đang chờ tải hồ sơ...</p>
          <p className="text-slate-400 text-sm">Hệ thống sẽ tự động tổng hợp báo cáo sau khi hoàn tất phân tích</p>
        </div>
        
        <button disabled className="mt-4 px-8 py-3 bg-slate-200 text-slate-400 font-bold rounded-xl cursor-not-allowed transition-all">
          Tải xuống Báo cáo (.xlsx)
        </button>
      </div>
    </div>
  );
}
