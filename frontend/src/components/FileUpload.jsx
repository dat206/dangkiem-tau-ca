import { useEffect, useMemo, useState } from 'react';
import { reportApi } from '../api/reportApi';
import ProcessingPanel from './ProcessingPanel';

function isFailedRow(row) {
  return Boolean(row.error_msg) || !row.ok;
}

function normalizeFailedFiles(rows) {
  return rows.filter(isFailedRow).map((row) => ({
    name: row.file_name || 'Khong xac dinh',
    message: row.error_msg || row.message || 'File khong xu ly duoc.',
  }));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function downloadExcelTable(headers, rows, filename) {
  const table = `
    <html>
      <head><meta charset="UTF-8" /></head>
      <body>
        <table border="1">
          <thead>
            <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows
              .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
  const blob = new Blob([table], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function FileUpload() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('idle');
  const [processedFiles, setProcessedFiles] = useState(0);
  const [resultSummary, setResultSummary] = useState(null);
  const [extractedData, setExtractedData] = useState([]);
  const [failedFiles, setFailedFiles] = useState([]);

  const loading = status === 'loading';
  const downloadFiles = useMemo(
    () => [
      { id: 'summary', name: 'Bang_ke_tong_hop.xls', label: 'Tai bang ke tong hop' },
      { id: 'errors', name: 'Danh_sach_file_loi.xls', label: 'Tai danh sach file loi' },
    ],
    [],
  );

  useEffect(() => {
    if (!loading || files.length === 0) return undefined;

    const intervalId = window.setInterval(() => {
      setProcessedFiles((current) => Math.min(files.length - 1, current + 1));
    }, 500);

    return () => window.clearInterval(intervalId);
  }, [files.length, loading]);

  function resetResultState() {
    setStatus('idle');
    setProcessedFiles(0);
    setResultSummary(null);
    setExtractedData([]);
    setFailedFiles([]);
  }

  function handleFileChange(event) {
    if (!event.target.files) return;

    setFiles(Array.from(event.target.files));
    resetResultState();
  }

  async function submitFiles(event) {
    event?.preventDefault();

    if (files.length === 0) {
      window.alert('Vui long chon it nhat mot file .docx truoc khi trich xuat!');
      return;
    }

    setStatus('loading');
    setProcessedFiles(0);
    setResultSummary(null);
    setExtractedData([]);
    setFailedFiles([]);

    try {
      const resData = await reportApi.uploadBatchReports(files);
      const rows = resData.data || [];
      const errors = normalizeFailedFiles(rows);
      const success = Number(resData.success ?? rows.filter((row) => !isFailedRow(row)).length);
      const total = Number(resData.total ?? rows.length ?? files.length);

      setProcessedFiles(total);
      setResultSummary({
        total,
        success,
        failed: Number(resData.failed ?? errors.length),
        message: resData.message || 'Xu ly hoan tat.',
      });
      setExtractedData(rows);
      setFailedFiles(errors);

      if (success > 0 && errors.length > 0) {
        setStatus('partial');
      } else if (errors.length > 0 || success === 0) {
        setStatus('error');
      } else {
        setStatus('success');
      }
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Khong ket noi duoc backend.';
      setProcessedFiles(files.length);
      setResultSummary({
        total: files.length,
        success: 0,
        failed: files.length,
        message,
      });
      setFailedFiles(files.map((file) => ({ name: file.name, message })));
      setStatus('error');
    }
  }

  function handleDownload(file) {
    if (file.id === 'errors') {
      downloadExcelTable(
        ['Ten file', 'Message'],
        failedFiles.map((item) => [item.name, item.message]),
        file.name,
      );
      return;
    }

    downloadExcelTable(
      ['Ten file', 'So dang ky', 'Ma tinh', 'Lmax', 'Hinh thuc kiem tra', 'Cap tau', 'Trang thai'],
      extractedData.map((row) => [
        row.file_name || '',
        row.so_dang_ky || '',
        row.ma_tinh || '',
        row.lmax || '',
        row.hinh_thuc_kiem_tra || '',
        row.cap_tau || '',
        row.status || '',
      ]),
      file.name,
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900">
      <main className="mx-auto grid max-w-7xl gap-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">
            He thong trich xuat thong tin tau ca hang loat
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Chon nhieu file DOCX de test loading, success, partial success va error state.
          </p>

          <form onSubmit={submitFiles} className="mt-5 space-y-4">
            <div className="rounded-lg border-2 border-dashed border-slate-300 p-6 text-center transition hover:border-blue-500">
              <input
                type="file"
                multiple
                accept=".docx"
                onChange={handleFileChange}
                className="hidden"
                id="file-select-input"
              />
              <label htmlFor="file-select-input" className="cursor-pointer font-semibold text-blue-700 hover:text-blue-800">
                Bam vao day de chon danh sach file Word can trich xuat
              </label>
              {files.length > 0 && (
                <p className="mt-2 text-sm font-semibold text-green-700">
                  Da chon {files.length} file tai lieu.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || files.length === 0}
              className={`w-full rounded-md px-4 py-3 font-bold text-white transition ${
                loading || files.length === 0
                  ? 'cursor-not-allowed bg-slate-400'
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              {loading ? 'He thong dang xu ly...' : 'Bat dau trich xuat hang loat'}
            </button>
          </form>
        </section>

        <ProcessingPanel
          status={status}
          totalFiles={resultSummary?.total ?? files.length}
          processedFiles={processedFiles}
          successCount={resultSummary?.success ?? 0}
          failedFiles={failedFiles}
          downloadFiles={downloadFiles}
          onDownload={handleDownload}
          onRetry={submitFiles}
        />

        {extractedData.length > 0 && (
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="font-bold text-slate-950">Du lieu trich xuat</h2>
              {resultSummary && <p className="mt-1 text-sm text-slate-600">{resultSummary.message}</p>}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left font-semibold text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Ten file</th>
                    <th className="px-4 py-3">So dang ky</th>
                    <th className="px-4 py-3">Ma tinh</th>
                    <th className="px-4 py-3">Lmax (m)</th>
                    <th className="px-4 py-3">Hinh thuc kiem tra</th>
                    <th className="px-4 py-3">Cap tau</th>
                    <th className="px-4 py-3">Trang thai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {extractedData.map((item, index) => (
                    <tr key={`${item.file_name}-${index}`} className="hover:bg-slate-50">
                      <td className="max-w-xs truncate px-4 py-3">{item.file_name}</td>
                      <td className="px-4 py-3 font-semibold text-slate-950">{item.so_dang_ky || '---'}</td>
                      <td className="px-4 py-3">{item.ma_tinh || '---'}</td>
                      <td className="px-4 py-3">{item.lmax || '---'}</td>
                      <td className="px-4 py-3">{item.hinh_thuc_kiem_tra}</td>
                      <td className="px-4 py-3">{item.cap_tau}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs font-bold ${
                            isFailedRow(item)
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
