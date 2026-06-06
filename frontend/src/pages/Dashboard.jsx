import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Anchor, UploadCloud, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import styles from './Dashboard.module.css';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');

const PIE_COLORS = ['#0b3d6b', '#0d7377', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];
const ICONS = [Anchor, UploadCloud, Calendar];
const COLORS = ['iconBlue', 'iconTeal', 'iconPurple'];

const inspectionBadgeVariant = (type) => {
  if (type === 'HN') return 'info';
  if (type === 'TĐ') return 'purple';
  if (type === 'ĐK') return 'success';
  if (type === 'GS') return 'teal';
  return 'warning';
};

const EmptyChart = ({ children }) => (
  <div className={styles.emptyChart}>{children}</div>
);

const Dashboard = () => {
  const [data, setData] = useState({
    stats: [],
    barData: [],
    pieData: [],
    recentUploads: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/api/vessels/dashboard-stats`);
        if (!res.ok) {
          throw new Error(`API trả về ${res.status}`);
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message || 'Không tải được dữ liệu tổng quan.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className={styles.stateText}>Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className={styles.stateText}>Không tải được dữ liệu tổng quan: {error}</div>;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.statsGrid}>
        {data.stats.map((stat, idx) => {
          const Icon = ICONS[idx % ICONS.length];
          const color = COLORS[idx % COLORS.length];
          return (
            <Card key={stat.label}>
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
                    <span>{stat.subtitle}</span>
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className={styles.chartsGrid}>
        <Card>
          <CardHeader title="Số tàu theo tỉnh (Top 6)" />
          <CardContent>
            <div className={styles.chartContainer}>
              {data.barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.barData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0' }}
                      formatter={(value) => [`${value} tàu`, 'Số lượng']}
                    />
                    <Bar dataKey="count" name="Số tàu" fill="#0d7377" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart>Chưa có dữ liệu tỉnh.</EmptyChart>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Phân loại theo hình thức KT" />
          <CardContent>
            <div className={styles.chartContainer}>
              {data.pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={96}
                      paddingAngle={2}
                    >
                      {data.pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0' }}
                      formatter={(value) => [`${value} tàu`, 'Số lượng']}
                    />
                    <Legend verticalAlign="bottom" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart>Chưa có dữ liệu hình thức kiểm tra.</EmptyChart>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Tài liệu tải lên gần đây"
          action={<Link to="/vessels" className={styles.viewAllLink}>Xem tất cả</Link>}
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
                  <Badge variant={inspectionBadgeVariant(row.type)}>{row.type}</Badge>
                </TableCell>
                <TableCell style={{ color: 'var(--text-muted)' }}>{row.time}</TableCell>
                <TableCell>
                  <Badge variant="success">Thành công</Badge>
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
