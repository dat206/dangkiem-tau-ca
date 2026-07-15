import { useState, useEffect } from 'react';
import { Plus, Edit2, Lock, Unlock, Trash2, X } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { userApi } from '../api/userApi';

const formatDateTime = (value) => {
  if (!value) return 'Chưa từng đăng nhập';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (e) {
    console.error(e);
    return value;
  }
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [isActive, setIsActive] = useState(true);

  // Field errors
  const [fieldErrors, setFieldErrors] = useState({});

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => {
        if (curr.message === message) {
          return { type: '', message: '' };
        }
        return curr;
      });
    }, 5000);
  };

  const handleRefreshUsers = async () => {
    try {
      const data = await userApi.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      showNotification('error', 'Không tải được danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await userApi.getUsers();
        if (active) {
          setUsers(data);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setNotification({ type: 'error', message: 'Không tải được danh sách người dùng.' });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('staff');
    setIsActive(true);
    setFieldErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFullName(user.full_name || '');
    setEmail(user.email || '');
    setPassword('');
    setRole(user.role || 'staff');
    setIsActive(user.is_active !== undefined ? user.is_active : true);
    setFieldErrors({});
    setShowModal(true);
  };

  const handleToggleActive = async (user) => {
    try {
      const updatedStatus = !user.is_active;
      await userApi.updateUser(user.id, { is_active: updatedStatus });
      showNotification('success', `Đã ${updatedStatus ? 'mở khóa' : 'khóa'} tài khoản thành công!`);
      setLoading(true);
      await handleRefreshUsers();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || 'Lỗi khi cập nhật trạng thái tài khoản.';
      showNotification('error', errorMsg);
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user.full_name}"?`)) {
      try {
        await userApi.deleteUser(user.id);
        showNotification('success', 'Xóa tài khoản thành công!');
        setLoading(true);
        await handleRefreshUsers();
      } catch (err) {
        console.error(err);
        const errorMsg = err.response?.data?.detail || 'Lỗi khi xóa tài khoản.';
        showNotification('error', errorMsg);
      }
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!fullName || fullName.trim().length < 2) {
      errors.fullName = 'Họ tên phải từ 2 ký tự trở lên';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!editingUser && (!password || password.length < 6)) {
      errors.password = 'Mật khẩu phải từ 6 ký tự trở lên';
    } else if (editingUser && password && password.length < 6) {
      errors.password = 'Mật khẩu mới phải từ 6 ký tự trở lên';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        const payload = {
          full_name: fullName.trim(),
          email: email.trim(),
          role: role,
          is_active: isActive,
        };
        if (password) {
          payload.password = password;
        }
        await userApi.updateUser(editingUser.id, payload);
        showNotification('success', 'Cập nhật tài khoản thành công!');
      } else {
        const payload = {
          full_name: fullName.trim(),
          email: email.trim(),
          password: password,
          role: role,
        };
        await userApi.createUser(payload);
        showNotification('success', 'Thêm tài khoản thành công!');
      }
      setShowModal(false);
      setLoading(true);
      await handleRefreshUsers();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || 'Lỗi khi lưu thông tin tài khoản.';
      showNotification('error', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Alert Notification */}
      {notification.message && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: notification.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${notification.type === 'success' ? 'var(--success)' : 'var(--error)'}`,
          color: notification.type === 'success' ? 'var(--success)' : 'var(--error)',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'fadeIn 0.2s ease',
        }}>
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification({ type: '', message: '' })} 
            style={{ color: 'inherit', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 'bold' }}
          >
            ×
          </button>
        </div>
      )}

      <Card>
        <CardHeader 
          title="Quản lý Người dùng" 
          subtitle="Tạo và quản lý tài khoản truy cập hệ thống"
          action={
            <Button icon={Plus} onClick={handleOpenAddModal}>
              Thêm người dùng
            </Button>
          }
        />
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)' }}>Đang tải danh sách người dùng...</span>
          </div>
        ) : (
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
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell style={{ fontWeight: 600 }}>{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'purple' : 'info'}>
                      {user.role === 'admin' ? 'Admin' : 'Nhân viên'}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ color: 'var(--text-muted)' }}>{formatDateTime(user.last_login)}</TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'success' : 'error'}>
                      {user.is_active ? 'Hoạt động' : 'Bị khóa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        onClick={() => handleOpenEditModal(user)}
                        style={{ color: 'var(--text-muted)', padding: 4, cursor: 'pointer', background: 'none', border: 'none' }} 
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleToggleActive(user)}
                        style={{ color: user.is_active ? 'var(--warning)' : 'var(--success)', padding: 4, cursor: 'pointer', background: 'none', border: 'none' }} 
                        title={user.is_active ? "Khóa tài khoản" : "Mở khóa"}
                      >
                        {user.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user)}
                        style={{ color: 'var(--error)', padding: 4, cursor: 'pointer', background: 'none', border: 'none' }} 
                        title="Xóa tài khoản"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: 480, overflow: 'hidden', animation: 'fadeIn 0.2s' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                {editingUser ? 'Chỉnh sửa Người dùng' : 'Thêm Người dùng'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Input 
                  label="Họ tên" 
                  placeholder="VD: Nguyễn Văn A" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  error={fieldErrors.fullName}
                />
                <Input 
                  label="Email / Tên đăng nhập" 
                  placeholder="email@dangkiem.vn" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={fieldErrors.email}
                />
                <Input 
                  label={editingUser ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu khởi tạo"} 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={fieldErrors.password}
                />
                
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Vai trò</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ width: '100%', height: 40, borderRadius: 6, border: '1px solid var(--border)', padding: '0 12px', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
                  >
                    <option value="staff">Nhân viên</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {editingUser && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <input 
                      type="checkbox" 
                      id="active" 
                      checked={isActive} 
                      onChange={(e) => setIsActive(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} 
                    />
                    <label htmlFor="active" style={{ fontSize: 14, fontWeight: 500 }}>Tài khoản đang hoạt động</label>
                  </div>
                )}
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: 'var(--surface-hover)' }}>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
                <Button type="submit" loading={isSubmitting}>Lưu tài khoản</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
