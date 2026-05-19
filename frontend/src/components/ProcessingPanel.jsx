const DEFAULT_DOWNLOAD_FILES = [
  { id: 'summary', name: 'Bang_ke_tong_hop.xls', label: 'Tai bang ke tong hop' },
  { id: 'errors', name: 'Danh_sach_file_loi.xls', label: 'Tai danh sach file loi' },
];

const STATUS_TEXT = {
  idle: 'Chua xu ly',
  loading: 'Dang xu ly',
  success: 'Hoan tat',
  error: 'Co loi',
  partial: 'Hoan tat mot phan',
};

function clampPercent(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export default function ProcessingPanel({
  status = 'idle',
  totalFiles = 0,
  processedFiles = 0,
  successCount = 0,
  failedFiles = [],
  downloadFiles = DEFAULT_DOWNLOAD_FILES,
  onDownload,
  onRetry,
}) {
  const hasErrors = failedFiles.length > 0;
  const safeTotal = Math.max(totalFiles, processedFiles, successCount + failedFiles.length);
  const isLoading = status === 'loading';
  const isPartial = status === 'partial' || (status === 'success' && successCount > 0 && hasErrors);
  const isError = status === 'error' || (!isLoading && hasErrors && successCount === 0);
  const isSuccess = status === 'success' && !hasErrors;
  const visibleStatus = isPartial ? 'partial' : isError ? 'error' : isSuccess ? 'success' : status;
  const progressPercent = safeTotal > 0 ? clampPercent((processedFiles / safeTotal) * 100) : 0;

  function handleDownload(file) {
    if (onDownload) {
      onDownload(file);
      return;
    }

    if (!file?.url) return;

    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Tien trinh xu ly
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            {STATUS_TEXT[visibleStatus] || STATUS_TEXT.idle}
          </h2>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
            isSuccess
              ? 'bg-green-100 text-green-700'
              : isPartial
                ? 'bg-amber-100 text-amber-800'
                : isError
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
          }`}
        >
          {successCount} thanh cong / {failedFiles.length} loi
        </span>
      </div>

      {isLoading && (
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            <div>
              <p className="font-semibold text-slate-950">
                Dang xu ly {processedFiles}/{safeTotal} files...
              </p>
              <p className="text-sm text-slate-500">
                Vui long giu trang nay mo cho den khi hoan tat.
              </p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
              <span>Tien do</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {(isSuccess || isPartial) && (
        <div className="mt-5 space-y-5">
          <div
            className={`rounded-md border p-4 ${
              isPartial
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-green-200 bg-green-50 text-green-800'
            }`}
          >
            <p className="font-semibold">
              {isPartial
                ? `Da xu ly thanh cong ${successCount}/${safeTotal} file. ${failedFiles.length} file can kiem tra lai.`
                : `Da xu ly thanh cong ${successCount}/${safeTotal} file.`}
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-base font-bold text-slate-950">File ket qua</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {downloadFiles.slice(0, 2).map((file) => (
                <button
                  key={file.id || file.name}
                  type="button"
                  onClick={() => handleDownload(file)}
                  className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-left font-semibold text-blue-800 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="block">{file.label || 'Tai file Excel'}</span>
                  <span className="mt-1 block text-sm font-normal text-blue-700">{file.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {(isError || isPartial) && (
        <div className="mt-5 space-y-4">
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <h3 className="font-bold text-red-800">File loi</h3>
            {failedFiles.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {failedFiles.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="rounded border border-red-100 bg-white p-3">
                    <p className="font-semibold text-slate-950">{file.name}</p>
                    <p className="mt-1 text-sm text-red-700">{file.message}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-red-700">Khong co chi tiet file loi.</p>
            )}
          </div>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Xu ly lai
            </button>
          )}
        </div>
      )}

      {visibleStatus === 'idle' && (
        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4 text-slate-600">
          Chon file DOCX va nhan xu ly de bat dau.
        </div>
      )}
    </section>
  );
}
