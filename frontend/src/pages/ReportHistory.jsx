import React from 'react';
import { Download, Filter, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';

const MOCK_HISTORY = [
  { id: 1, period: 'Quý I / 2026', date: '15/04/2026 · 09:32', creator: 'Nguyễn Thị B', provinces: '3 tỉnh', records: '139 bản ghi', files: '2 file Excel', status: 'available' },
  { id: 2, period: 'Quý IV / 2025', date: '10/01/2026 · 14:15', creator: 'Admin Trần', provinces: '15 tỉnh', records: '450 bản ghi', files: '2 file Excel', status: 'available' },
  { id: 3, period: 'Quý III / 2025', date: '05/10/2025 · 10:00', creator: 'Nguyễn Thị B', provinces: '15 tỉnh', records: '382 bản ghi', files: '2 file Excel', status: 'expired' },
];

const ReportHistory = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      <Card>
        <div style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-end', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ width: 150 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Năm báo cáo</label>
            <select style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--border)', padding: '0 8px' }}>
              <option>Tất cả</option>
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
          <div style={{ width: 150 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Quý</label>
            <select style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--border)', padding: '0 8px' }}>
              <option>Tất cả</option>
              <option>Quý I</option>
              <option>Quý II</option>
              <option>Quý III</option>
              <option>Quý IV</option>
            </select>
          </div>
          <div style={{ width: 200 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Người tạo (Admin)</label>
            <select style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--border)', padding: '0 8px' }}>
              <option>Tất cả</option>
              <option>Nguyễn Thị B</option>
              <option>Admin Trần</option>
            </select>
          </div>
          <Button icon={Filter} style={{ height: 36 }}>Lọc</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Kỳ báo cáo</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Người tạo</TableHead>
              <TableHead>Số tỉnh</TableHead>
              <TableHead>Số bản ghi</TableHead>
              <TableHead>Loại file</TableHead>
              <TableHead align="center">Tải lại</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_HISTORY.map((row, idx) => (
              <TableRow key={row.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell style={{ fontWeight: 600, color: 'var(--primary)' }}>{row.period}</TableCell>
                <TableCell style={{ color: 'var(--text-muted)' }}>{row.date}</TableCell>
                <TableCell>{row.creator}</TableCell>
                <TableCell>{row.provinces}</TableCell>
                <TableCell>{row.records}</TableCell>
                <TableCell>{row.files}</TableCell>
                <TableCell align="center">
                  {row.status === 'available' ? (
                    <Button variant="ghost" size="sm" icon={Download} title="Tải lại file ZIP">
                      Tải lại
                    </Button>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <RefreshCw size={12} /> Hết hạn
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      
    </div>
  );
};

export default ReportHistory;
