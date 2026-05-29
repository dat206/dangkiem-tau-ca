import React, { useState, useEffect } from 'react';
import { Anchor, UploadCloud, Calendar, FileText, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import styles from './Dashboard.module.css';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
const ICONS = [Anchor, UploadCloud, Calendar, FileText];
const COLORS = ['iconBlue', 'iconTeal', 'iconPurple', 'iconOrange'];

const Dashboard = () => {
  const [data, setData] = useState({
    stats: [],
    barData: [],
    pieData: [],
    recentUploads: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/vessels/dashboard-stats');
        if (!res.ok) {
          throw new Error('API Error');
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div style={{ padding: 24, color: 'var(--text-muted)' }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div className={styles.dashboard}>
      
      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        {data.stats.map((stat, idx) => {
          const Icon = ICONS[idx % ICONS.length];
          const color = COLORS[idx % COLORS.length];
          return (
            <Card key={idx}>
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles[color]}`}>
                  <Icon size={24} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statTrend}>
                    {stat.trend === 'up' && <ArrowUp size={14} className={styles.trendUp} />}
                    {stat.trend === 'down' && <ArrowDown size={14} className={styles.trendDown} />}
                    <span style={{ color: 'var(--text-muted)' }}>{stat.subtitle}</span>
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        <Card>
          <CardHeader title="Số tàu theo tỉnh (Top 6)" />
          <CardContent>
            <div className={styles.chartContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              (Đang nâng cấp biểu đồ)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Phân loại theo hình thức KT" />
          <CardContent>
            <div className={styles.chartContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              (Đang nâng cấp biểu đồ)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Uploads Table */}
      <Card>
        <CardHeader 
          title="Tài liệu tải lên gần đây" 
          action={<a href="/upload" style={{ fontSize: 14, fontWeight: 500 }}>Xem tất cả →</a>} 
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>STT</TableHead>
              <TableHead>Tên file</TableHead>
              <TableHead>Số đăng ký</TableHead>
              <TableHead>Chủ tàu</TableHead>
              <TableHead>Tỉnh</TableHead>
              <TableHead>Hình thức KT</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.recentUploads.map((row, idx) => (
              <TableRow key={row.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell style={{ fontWeight: 500 }}>{row.file}</TableCell>
                <TableCell>{row.reg}</TableCell>
                <TableCell>{row.owner}</TableCell>
                <TableCell>{row.prov}</TableCell>
                <TableCell>
                  <Badge variant={row.type === 'HN' ? 'info' : row.type === 'TĐ' ? 'purple' : row.type === 'ĐK' ? 'success' : 'warning'}>
                    {row.type}
                  </Badge>
                </TableCell>
                <TableCell style={{ color: 'var(--text-muted)' }}>{row.time}</TableCell>
                <TableCell>
                  {row.status === 'success' && <Badge variant="success">Thành công</Badge>}
                  {row.status === 'error' && <Badge variant="error">Lỗi parse</Badge>}
                  {row.status === 'duplicate' && <Badge variant="warning">Trùng lặp</Badge>}
                </TableCell>
              </TableRow>
            ))}
            {data.recentUploads.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  Chưa có dữ liệu.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      
    </div>
  );
};

export default Dashboard;
