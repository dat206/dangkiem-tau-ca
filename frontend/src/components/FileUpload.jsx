import { useState } from 'react';
import { reportApi } from '../api/reportApi';

export default function FileUpload() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);
  const [extractedData, setExtractedData] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      alert("Vui lòng chọn ít nhất một file .docx trước khi trích xuất!");
      return;
    }

    setLoading(true);
    setResultSummary(null);
    setExtractedData([]);

    try {
      const resData = await reportApi.uploadBatchReports(files);
      setResultSummary({
        total: resData.total,
        success: resData.success,
        failed: resData.failed,
        message: resData.message
      });
      setExtractedData(resData.data || []);
    } catch (error) {
      console.error("Lỗi trích xuất:", error);
      alert(`Đã có lỗi xảy ra: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSVResult = () => {
    if (extractedData.length === 0) return;
    const headers = ["Tên File", "Số Đăng Ký", "Mã Tỉnh", "Chiều Dài Lmax", "Hình Thức Kiểm Tra", "Cấp Tàu", "Trạng Thái"];
    const csvRows = [headers.join(",")];

    extractedData.forEach((row) => {
      const values = [
        `"${row.file_name || ''}"`,
        `"${row.so_dang_ky || ''}"`,
        `"${row.ma_tinh || ''}"`,
        `"${row.lmax || '0'}"`,
        `"${row.hinh_thuc_kiem_tra || ''}"`,
        `"${row.cap_tau || ''}"`,
        `"${row.status || ''}"`
      ];
      csvRows.push(values.join(","));
    });

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bao_cao_dang_kiem_tau_ca.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Hệ thống trích xuất thông tin tàu cá hàng loạt</h2>
      <p className="text-gray-600 mb-6">Đọc tự động dữ liệu từ các tệp văn bản kiểm định (.docx) và lưu vào hệ thống cơ sở dữ liệu</p>

      <form onSubmit={handleUploadSubmit} className="space-y-4 mb-8">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
          <input
            type="file"
            multiple
            accept=".docx"
            onChange={handleFileChange}
            className="hidden"
            id="file-select-input"
          />
          <label htmlFor="file-select-input" className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
            Bấm vào đây để chọn danh sách các file Word cần trích xuất
          </label>
          {files.length > 0 && (
            <p className="mt-2 text-sm text-green-600 font-semibold">Đã chọn thành công {files.length} file tài liệu.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || files.length === 0}
          className={`w-full py-3 px-4 rounded-md font-bold text-white transition-colors ${
            loading || files.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Hệ thống đang xử lý đa luồng dữ liệu...' : 'Bắt đầu trích xuất hàng loạt'}
        </button>
      </form>

      {resultSummary && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md flex justify-between items-center">
          <div>
            <h4 className="font-bold text-gray-800">{resultSummary.message}</h4>
            <p className="text-sm text-gray-600">Thành công: <span className="text-green-600 font-bold">{resultSummary.success}</span> | Thất bại: <span className="text-red-600 font-bold">{resultSummary.failed}</span></p>
          </div>
          <button
            onClick={downloadCSVResult}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Tải báo cáo tổng hợp (CSV)
          </button>
        </div>
      )}

      {extractedData.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 font-medium text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Tên file</th>
                <th className="px-4 py-3 text-left">Số đăng ký</th>
                <th className="px-4 py-3 text-left">Mã tỉnh</th>
                <th className="px-4 py-3 text-left">Lmax (m)</th>
                <th className="px-4 py-3 text-left">Hình thức kiểm tra</th>
                <th className="px-4 py-3 text-left">Cấp tàu</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-600">
              {extractedData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 truncate max-w-xs">{item.file_name}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{item.so_dang_ky || '---'}</td>
                  <td className="px-4 py-3">{item.ma_tinh || '---'}</td>
                  <td className="px-4 py-3">{item.lmax || '---'}</td>
                  <td className="px-4 py-3">{item.hinh_thuc_kiem_tra}</td>
                  <td className="px-4 py-3">{item.cap_tau}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                      item.status === 'Thành công' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
