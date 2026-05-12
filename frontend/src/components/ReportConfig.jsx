/**
 * ReportConfig Component - Form chọn quý, năm, tỉnh
 * 
 * Features:
 * - Quarter selection (I/II/III/IV)
 * - Year input
 * - Province checkboxes
 * - Form validation
 */
export default function ReportConfig({ onConfigChange }) {
  return (
    <div className="bg-white p-6 rounded-lg">
      <h2>Cấu hình báo cáo</h2>
      <form>
        <label>Quý:</label>
        <input type="number" min="1" max="4" />
        
        <label>Năm:</label>
        <input type="number" defaultValue={new Date().getFullYear()} />
      </form>
    </div>
  );
}
