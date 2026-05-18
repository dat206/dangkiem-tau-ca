import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  downloadBlob,
  downloadReportHistory,
  getReportHistory,
} from '../api/reportApi';

const PAGE_SIZE = 10;
const quarterOptions = [
  { value: '', label: 'Tất cả quý' },
  { value: '1', label: 'Quý I' },
  { value: '2', label: 'Quý II' },
  { value: '3', label: 'Quý III' },
  { value: '4', label: 'Quý IV' },
];

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function formatQuarterYear(report) {
  if (!report.quarter && !report.year) return '-';
  if (!report.quarter) return `${report.year}`;
  if (!report.year) return `Quý ${report.quarter}`;
  return `Quý ${report.quarter}/${report.year}`;
}

function formatProvinces(value) {
  if (Array.isArray(value)) return value.join(', ');
  return value || '-';
}

function buildDownloadName(report) {
  const quarter = report.quarter ? `q${report.quarter}` : 'all-quarters';
  const year = report.year || 'all-years';
  return `report_${quarter}_${year}_${report.id}.zip`;
}

export default function HistoryPage() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ quarter: '', year: '' });
  const [query, setQuery] = useState({ quarter: '', year: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  );

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const skip = (page - 1) * PAGE_SIZE;
      const data = await getReportHistory({
        skip,
        limit: PAGE_SIZE,
        quarter: query.quarter ? Number(query.quarter) : undefined,
        year: query.year ? Number(query.year) : undefined,
      });

      setReports(data.items || []);
      setTotal(data.total ?? data.items?.length ?? 0);
    } catch {
      setReports([]);
      setTotal(0);
      setError('Không tải được lịch sử báo cáo. Vui lòng kiểm tra API backend.');
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(() => {
      if (active) fetchReports();
    });

    return () => {
      active = false;
    };
  }, [fetchReports]);

  function handleSubmit(event) {
    event.preventDefault();
    setPage(1);
    setQuery(filters);
  }

  function handleReset() {
    const emptyFilters = { quarter: '', year: '' };
    setFilters(emptyFilters);
    setQuery(emptyFilters);
    setPage(1);
  }

  async function handleDownload(report) {
    setDownloadingId(report.id);
    setError('');

    try {
      const blob = await downloadReportHistory(report.id);
      downloadBlob(blob, buildDownloadName(report));
    } catch {
      setError('Không tải được báo cáo cũ. File có thể chưa tồn tại trên server.');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Đăng kiểm tàu cá
          </p>
          <h1 className="text-2xl font-bold text-slate-950">Lịch sử báo cáo</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <form
          onSubmit={handleSubmit}
          className="mb-5 grid gap-3 border-b border-slate-200 bg-white p-4 sm:grid-cols-[180px_180px_auto] sm:items-end"
        >
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Quý
            <select
              value={filters.quarter}
              onChange={(event) => setFilters({ ...filters, quarter: event.target.value })}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            >
              {quarterOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Năm
            <input
              type="number"
              min="2000"
              max="2100"
              value={filters.year}
              onChange={(event) => setFilters({ ...filters, year: event.target.value })}
              placeholder="Tất cả"
              className="h-10 rounded-md border border-slate-300 px-3 text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={loading}
            >
              Lọc
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Xóa lọc
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-medium text-slate-700">
              {loading ? 'Đang tải...' : `${total} báo cáo`}
            </p>
            <button
              type="button"
              onClick={fetchReports}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              disabled={loading}
            >
              Tải lại
            </button>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-16 px-4 py-3">STT</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3">Quý/Năm</th>
                  <th className="px-4 py-3">Số file DOCX</th>
                  <th className="px-4 py-3">Tỉnh</th>
                  <th className="px-4 py-3 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report, index) => (
                  <tr key={report.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-4 py-3">{formatDate(report.created_at)}</td>
                    <td className="px-4 py-3">{formatQuarterYear(report)}</td>
                    <td className="px-4 py-3">{report.file_count ?? 0}</td>
                    <td className="max-w-xs px-4 py-3 text-slate-600">
                      {formatProvinces(report.provinces)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownload(report)}
                        disabled={report.has_file === false || downloadingId === report.id}
                        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {downloadingId === report.id ? 'Đang tải' : 'Tải'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {reports.map((report, index) => (
              <article key={report.id} className="grid gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      #{(page - 1) * PAGE_SIZE + index + 1}
                    </p>
                    <p className="font-semibold text-slate-950">
                      {formatQuarterYear(report)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload(report)}
                    disabled={report.has_file === false || downloadingId === report.id}
                    className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {downloadingId === report.id ? 'Đang tải' : 'Tải'}
                  </button>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Ngày tạo</dt>
                    <dd className="font-medium">{formatDate(report.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Số file DOCX</dt>
                    <dd className="font-medium">{report.file_count ?? 0}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-500">Tỉnh</dt>
                    <dd className="font-medium">{formatProvinces(report.provinces)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          {!loading && reports.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-slate-500">
              Không có báo cáo nào khớp bộ lọc.
            </div>
          )}
        </section>

        <nav className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Trang {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || loading}
              className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages || loading}
              className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300"
            >
              Sau
            </button>
          </div>
        </nav>
      </main>
    </div>
  );
}
