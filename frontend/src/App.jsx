import { useEffect, useMemo, useState } from 'react';
import FileUpload from './components/FileUpload';
import HistoryPage from './components/HistoryPage';
import {
  downloadBlob,
  generateReport,
  generateReportFromDb,
  getExportOptions,
} from './api/reportApi';

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

const OUTPUT_TYPES = [
  { code: 'registry', title: 'Bảng kê tổng hợp' },
  { code: 'summary', title: 'Báo cáo quý theo tỉnh' },
];

function DatabaseReportSection({ quarter, year, onGenerated }) {
  const [options, setOptions] = useState({ total: 0, provinces: [] });
  const [selectedProvinces, setSelectedProvinces] = useState([]);
  const [fileTypes, setFileTypes] = useState(['registry', 'summary']);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    Promise.resolve().then(() => {
      if (!active) return;
      setLoadingOptions(true);
      setError('');

      getExportOptions({ quarter, year })
        .then((data) => {
          if (!active) return;
          setOptions(data);
          setSelectedProvinces((current) => {
            const validCodes = new Set((data.provinces || []).map((item) => item.code));
            const kept = current.filter((code) => validCodes.has(code));
            if (kept.length > 0) return kept;
            return (data.provinces || [])
              .filter((item) => item.count > 0)
              .slice(0, 3)
              .map((item) => item.code);
          });
        })
        .catch(() => {
          if (!active) return;
          setOptions({ total: 0, provinces: [] });
          setSelectedProvinces([]);
          setError('Không tải được dữ liệu tổng hợp từ CSDL.');
        })
        .finally(() => {
          if (active) setLoadingOptions(false);
        });
    });

    return () => {
      active = false;
    };
  }, [quarter, year]);

  const selectedCount = useMemo(() => {
    return (options.provinces || [])
      .filter((province) => selectedProvinces.includes(province.code))
      .reduce((total, province) => total + (province.count || 0), 0);
  }, [options.provinces, selectedProvinces]);

  function toggleProvince(code) {
    setSelectedProvinces((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  }

  function toggleFileType(code) {
    setFileTypes((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  }

  async function handleGenerateFromDb() {
    if (selectedProvinces.length === 0) {
      setError('Vui lòng chọn ít nhất một tỉnh.');
      return;
    }
    if (fileTypes.length === 0) {
      setError('Vui lòng chọn ít nhất một loại file Excel.');
      return;
    }

    setGenerating(true);
    setError('');
    setMessage('');

    try {
      const blob = await generateReportFromDb({
        quarter,
        year,
        provinces: selectedProvinces,
        fileTypes,
        createdBy: 'Nguyen Thi Binh',
      });
      downloadBlob(blob, `report_q${quarter}_${year}.zip`);
      setMessage('Đã tạo báo cáo từ CSDL và tải xuống file ZIP.');
      onGenerated?.();
    } catch (err) {
      setError(err.response?.data?.detail || 'Không tạo được báo cáo từ CSDL.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mt-8 border-t border-slate-800 pt-8">
      <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
        <span>🗄️</span> Xuất báo cáo từ dữ liệu CSDL
      </h3>
      <p className="text-slate-400 text-sm mb-5">
        Không cần upload lại DOCX. Hệ thống lấy dữ liệu đã lưu, lọc theo quý/năm/tỉnh và lưu vào lịch sử báo cáo.
      </p>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-5">
        <div className="rounded-lg bg-slate-950/70 border border-slate-800 px-4 py-3 text-sm text-slate-300">
          Kỳ đang chọn: <strong className="text-teal-300">Quý {quarter}/{year}</strong>
          {options.period_start && (
            <>
              {' '}({options.period_start} - {options.period_end})
            </>
          )}
          {' · '}
          <strong className="text-teal-300">{loadingOptions ? '...' : options.total}</strong> bản ghi trong CSDL
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="text-sm font-bold text-slate-200">
              Chọn tỉnh trong CSDL ({selectedProvinces.length} đã chọn)
            </label>
            <div className="flex gap-3 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedProvinces((options.provinces || []).map((item) => item.code))}
                className="text-teal-300 hover:text-teal-200"
              >
                Chọn tất cả
              </button>
              <button
                type="button"
                onClick={() => setSelectedProvinces([])}
                className="text-slate-400 hover:text-white"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(options.provinces || []).map((province) => {
              const checked = selectedProvinces.includes(province.code);
              return (
                <button
                  key={province.code}
                  type="button"
                  onClick={() => toggleProvince(province.code)}
                  className={`flex items-center justify-between gap-2 rounded-lg border p-2 text-left text-sm font-semibold transition-all ${
                    checked
                      ? 'bg-teal-500/10 border-teal-500 text-teal-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span>{province.name}</span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-200">{province.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-200 mb-3">
            Loại file Excel cần tạo
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {OUTPUT_TYPES.map((type) => {
              const checked = fileTypes.includes(type.code);
              return (
                <button
                  key={type.code}
                  type="button"
                  onClick={() => toggleFileType(type.code)}
                  className={`rounded-lg border p-3 text-left text-sm font-bold ${
                    checked
                      ? 'bg-teal-500/10 border-teal-500 text-teal-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {checked ? '✓ ' : ''}{type.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg bg-slate-950/70 border border-slate-800 px-4 py-3 text-sm font-bold text-slate-200">
          Sẽ tổng hợp <span className="text-teal-300">{selectedCount}</span> bản ghi
        </div>

        {message && (
          <div className="p-4 bg-teal-950/80 border border-teal-500/50 rounded-xl text-teal-300 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-950/80 border border-red-500/50 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGenerateFromDb}
          disabled={generating || selectedCount === 0}
          className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-base ${
            generating || selectedCount === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-teal-500 hover:bg-teal-400 text-slate-950 hover:shadow-lg hover:shadow-teal-500/15'
          }`}
        >
          {generating ? 'Đang tạo báo cáo từ CSDL...' : 'Tạo báo cáo từ CSDL & tải xuống'}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'generate', 'history'
  const [historyVersion, setHistoryVersion] = useState(0);

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
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleProvinceToggle = (code) => {
    setSelectedProvinces((prev) =>
      prev.includes(code)
        ? prev.filter((p) => p !== code)
        : [...prev, code]
    );
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      alert("Vui lòng chọn ít nhất một file .docx để sinh báo cáo!");
      return;
    }
    if (selectedProvinces.length === 0) {
      alert("Vui lòng chọn ít nhất một tỉnh thành!");
      return;
    }

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    setDownloadBlobData(null);

    try {
      const config = {
        quarter: Number(quarter),
        year: Number(year),
        provinces: selectedProvinces,
      };

      const blob = await generateReport(files, config);
      const filename = `report_q${quarter}_${year}.zip`;

      setDownloadBlobData(blob);
      setDownloadFilename(filename);
      setSuccessMsg(`Sinh báo cáo thành công! Tệp ZIP đã sẵn sàng tải xuống.`);
      setHistoryVersion((value) => value + 1);

      downloadBlob(blob, filename);
    } catch (error) {
      console.error("Lỗi sinh báo cáo:", error);
      setErrorMsg(`Đã xảy ra lỗi khi tạo báo cáo: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = () => {
    if (downloadBlobData && downloadFilename) {
      downloadBlob(downloadBlobData, downloadFilename);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-teal-500/20">
              🐟
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                Hệ Thống Đăng Kiểm Tàu Cá
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-400">
                Tự động xuất báo cáo chất lượng cao
              </p>
            </div>
          </div>

          <nav className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'upload'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Trích xuất dữ liệu
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'generate'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tạo báo cáo quý
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'history'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lịch sử xuất bản
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'upload' && (
          <div className="animate-fadeIn">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <FileUpload />
            </div>
          </div>
        )}

        {activeTab === 'generate' && (
          <div className="animate-fadeIn max-w-3xl mx-auto">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                <span>📊</span> Cấu hình & Sinh báo cáo quý tự động
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Chọn danh sách file văn bản Word (.docx), cài đặt quý, năm và các tỉnh cần báo cáo. Hệ thống sẽ trích xuất dữ liệu, tổng hợp và trả về tệp ZIP chứa cả 2 file Excel báo cáo hoàn chỉnh.
              </p>

              <form onSubmit={handleGenerateSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-200">
                    1. Chọn danh sách file văn bản (.docx)
                  </label>
                  <div className="border-2 border-dashed border-slate-700 hover:border-teal-500 bg-slate-900/40 hover:bg-slate-900/60 rounded-xl p-8 text-center transition-all cursor-pointer relative group">
                    <input
                      type="file"
                      multiple
                      accept=".docx"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="generate-file-input"
                    />
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">📂</span>
                      <span className="text-teal-400 group-hover:text-teal-300 font-bold">
                        Bấm vào đây để chọn tệp tài liệu kiểm định
                      </span>
                      <span className="text-slate-500 text-xs mt-1">Chấp nhận nhiều tệp .docx</span>
                    </div>
                  </div>
                  {files.length > 0 && (
                    <div className="mt-2 p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-sm flex items-center justify-between">
                      <span className="text-green-400 font-semibold">✓ Đã chọn {files.length} file tài liệu.</span>
                      <button
                        type="button"
                        onClick={() => setFiles([])}
                        className="text-xs text-red-400 hover:underline font-bold"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-200">
                      2. Chọn Quý báo cáo
                    </label>
                    <select
                      value={quarter}
                      onChange={(e) => setQuarter(Number(e.target.value))}
                      className="w-full h-11 bg-slate-900 border border-slate-800 rounded-lg px-3 text-white font-semibold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value={1}>Quý I (Tháng 1-3)</option>
                      <option value={2}>Quý II (Tháng 4-6)</option>
                      <option value={3}>Quý III (Tháng 7-9)</option>
                      <option value={4}>Quý IV (Tháng 10-12)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-200">
                      3. Chọn Năm báo cáo
                    </label>
                    <input
                      type="number"
                      min="2000"
                      max="2100"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full h-11 bg-slate-900 border border-slate-800 rounded-lg px-3 text-white font-semibold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-200">
                    4. Lọc theo tỉnh / thành phố ({selectedProvinces.length} đã chọn)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                    {PROVINCES_LIST.map((prov) => {
                      const isChecked = selectedProvinces.includes(prov.code);
                      return (
                        <button
                          key={prov.code}
                          type="button"
                          onClick={() => handleProvinceToggle(prov.code)}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-left text-sm font-semibold transition-all ${
                            isChecked
                              ? 'bg-teal-500/10 border-teal-500 text-teal-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <span className={`h-4 w-4 rounded flex items-center justify-center text-[10px] ${
                            isChecked ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 border border-slate-700'
                          }`}>
                            {isChecked && '✓'}
                          </span>
                          {prov.name} ({prov.code})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {successMsg && (
                  <div className="p-4 bg-teal-950/80 border border-teal-500/50 rounded-xl flex items-center justify-between text-teal-300 text-sm">
                    <span>{successMsg}</span>
                    <button
                      type="button"
                      onClick={triggerDownload}
                      className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                    >
                      Tải ngay
                    </button>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-4 bg-red-950/80 border border-red-500/50 rounded-xl text-red-400 text-sm">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || files.length === 0}
                  className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-base ${
                    loading || files.length === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-teal-500 hover:bg-teal-400 text-slate-950 hover:shadow-lg hover:shadow-teal-500/15'
                  }`}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin inline-block h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full"></span>
                      Đang xử lý đa luồng & kết xuất báo cáo...
                    </>
                  ) : (
                    <>
                      <span>⚡</span> Sinh báo cáo và tải xuống (ZIP)
                    </>
                  )}
                </button>
              </form>

              <DatabaseReportSection
                quarter={quarter}
                year={year}
                onGenerated={() => setHistoryVersion((value) => value + 1)}
              />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-fadeIn">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-900">
              <HistoryPage version={historyVersion} />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 bg-slate-950/40">
        <p>© 2026 Hệ thống Đăng kiểm Tàu cá Việt Nam. Phát triển bởi Đội ngũ Antigravity.</p>
      </footer>
    </div>
  );
}
