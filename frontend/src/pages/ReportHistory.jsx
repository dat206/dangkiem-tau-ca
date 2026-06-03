import React, { useEffect, useState } from 'react';
import { Download, Filter, RefreshCw, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import {
  deleteReportHistory,
  downloadBlob,
  downloadReportHistory,
  getReportCreators,
  getReportHistory,
} from '../api/reportApi';

const formatDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const ReportHistory = () => {
  const [filters, setFilters] = useState({ year: '', quarter: '', created_by: '' });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [items, setItems] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = () => {
    setLoading(true);
    setError('');

    const params = Object.fromEntries(
      Object.entries(appliedFilters).filter(([, value]) => value !== ''),
    );

    getReportHistory(params)
      .then((data) => setItems(data.items || []))
      .catch((err) => setError(err.response?.data?.detail || 'Không tải được lịch sử báo cáo.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHistory();
  }, [appliedFilters]);

  useEffect(() => {
    getReportCreators()
      .then((data) => setCreators(data.items || []))
      .catch(() => setCreators([]));
  }, []);

  const handleDownload = async (row) => {
    try {
      const blob = await downloadReportHistory(row.id);
      downloadBlob(blob, `report_q${row.quarter}_${row.year}.zip`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Không tải được file báo cáo.');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Xóa lịch sử báo cáo này?')) return;

    try {
      await deleteReportHistory(row.id);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.detail || 'Không xóa được lịch sử báo cáo.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card>
        <div style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-end', borderBottom: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
          <div style={{ width: 150 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Năm báo cáo</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters((current) => ({ ...current, year: e.target.value }))}
              style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--border)', padding: '0 8px' }}
            >
              <option value="">Tất cả</option>
              {[2026, 2025, 2024, 2023].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div style={{ width: 150 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Quý</label>
            <select
              value={filters.quarter}
              onChange={(e) => setFilters((current) => ({ ...current, quarter: e.target.value }))}
              style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--border)', padding: '0 8px' }}
            >
              <option value="">Tất cả</option>
              {[1, 2, 3, 4].map((quarter) => (
                <option key={quarter} value={quarter}>Quý {quarter}</option>
              ))}
            </select>
          </div>
          <div style={{ width: 220 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Người tạo</label>
            <select
              value={filters.created_by}
              onChange={(e) => setFilters((current) => ({ ...current, created_by: e.target.value }))}
              style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--border)', padding: '0 8px' }}
            >
              <option value="">Tất cả</option>
              {creators.map((creator) => (
                <option key={creator} value={creator}>{creator}</option>
              ))}
            </select>
          </div>
          <Button icon={Filter} style={{ height: 36 }} onClick={() => setAppliedFilters(filters)}>Lọc</Button>
          <Button variant="ghost" icon={RefreshCw} style={{ height: 36 }} loading={loading} onClick={loadHistory}>Tải lại</Button>
        </div>

        {error && (
          <div style={{ padding: '12px 20px', color: 'var(--error)', borderBottom: '1px solid var(--border-light)' }}>
            {error}
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Kỳ báo cáo</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Người tạo</TableHead>
              <TableHead>Tỉnh</TableHead>
              <TableHead>Số bản ghi</TableHead>
              <TableHead>Loại file</TableHead>
              <TableHead align="center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row, idx) => (
              <TableRow key={row.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell style={{ fontWeight: 600, color: 'var(--primary)' }}>Quý {row.quarter} / {row.year}</TableCell>
                <TableCell style={{ color: 'var(--text-muted)' }}>{formatDate(row.created_at)}</TableCell>
                <TableCell>{row.created_by}</TableCell>
                <TableCell>{row.provinces}</TableCell>
                <TableCell>{row.record_count}</TableCell>
                <TableCell>{row.file_type_label || `${row.file_count} file Excel`}</TableCell>
                <TableCell align="center">
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                    <Button variant="ghost" size="sm" icon={Download} disabled={!row.has_file} onClick={() => handleDownload(row)}>
                      Tải
                    </Button>
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(row)}>
                      Xóa
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                  Chưa có lịch sử báo cáo phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ReportHistory;
