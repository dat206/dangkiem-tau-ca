import { useState } from 'react';
import { Plus, Edit2, Lock, Unlock, Trash2, X } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

const MOCK_USERS = [
  { id: 1, name: 'Admin Trần', email: 'admin@dangkiem.vn', role: 'Admin', lastLogin: '10 phút trước', status: 'active' },
  { id: 2, name: 'Nguyễn Thị B', email: 'nhanvien1@dangkiem.vn', role: 'Staff', lastLogin: '1 giờ trước', status: 'active' },
  { id: 3, name: 'Lê Văn C', email: 'nhanvien2@dangkiem.vn', role: 'Staff', lastLogin: '3 ngày trước', status: 'locked' },
];

const AdminUsers = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card>
        <CardHeader 
          title="Quản lý Người dùng" 
          subtitle="Tạo và quản lý tài khoản truy cập hệ thống"
          action={
            <Button icon={Plus} onClick={() => setShowModal(true)}>
              Thêm người dùng
            </Button>
          }
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Họ tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Lần đăng nhập cuối</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_USERS.map((user) => (
              <TableRow key={user.id}>
                <TableCell style={{ fontWeight: 600 }}>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'Admin' ? 'purple' : 'info'}>
                    {user.role === 'Admin' ? 'Admin' : 'Nhân viên'}
                  </Badge>
                </TableCell>
                <TableCell style={{ color: 'var(--text-muted)' }}>{user.lastLogin}</TableCell>
                <TableCell>
                  <Badge variant={user.status === 'active' ? 'success' : 'error'}>
                    {user.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ color: 'var(--text-muted)', padding: 4 }} title="Chỉnh sửa">
                      <Edit2 size={16} />
                    </button>
                    {user.status === 'active' ? (
                      <button style={{ color: 'var(--warning)', padding: 4 }} title="Khóa tài khoản">
                        <Lock size={16} />
                      </button>
                    ) : (
                      <button style={{ color: 'var(--success)', padding: 4 }} title="Mở khóa">
                        <Unlock size={16} />
                      </button>
                    )}
                    <button style={{ color: 'var(--error)', padding: 4 }} title="Xóa tài khoản">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: 480, overflow: 'hidden', animation: 'fadeIn 0.2s' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Thêm Người dùng</h3>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Họ tên" placeholder="VD: Nguyễn Văn A" />
              <Input label="Email / Tên đăng nhập" placeholder="email@dangkiem.vn" />
              <Input label="Mật khẩu khởi tạo" type="password" placeholder="••••••••" />
              
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Vai trò</label>
                <select style={{ width: '100%', height: 40, borderRadius: 6, border: '1px solid var(--border)', padding: '0 12px' }}>
                  <option>Nhân viên</option>
                  <option>Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <input type="checkbox" id="active" defaultChecked style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                <label htmlFor="active" style={{ fontSize: 14, fontWeight: 500 }}>Tài khoản đang hoạt động</label>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: 'var(--surface-hover)' }}>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
              <Button>Lưu tài khoản</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
