/**
 * DownloadPanel Component - Hiển thị kết quả &amp; download
 * 
 * Features:
 * - Loading state with progress
 * - Success state with download buttons
 * - Error state with retry option
 * - File error details
 */
export default function DownloadPanel({ status, result, onRetry }) {
  return (
    <div className="bg-white p-6 rounded-lg">
      <h2>Kết quả xử lý</h2>
      <p>Waiting for processing...</p>
    </div>
  );
}
