import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  UploadCloud,
  Database,
  BarChart2,
  History,
  Settings,
  Users,
  LogOut,
  Bell,
  Menu,
  Anchor,
} from 'lucide-react';
import styles from './MainLayout.module.css';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const NAV_ITEMS = [
    { path: '/dashboard', label: 'Tổng quan', icon: Home },
    { path: '/upload', label: 'Upload Hồ sơ', icon: UploadCloud },
    { path: '/vessels', label: 'Dữ liệu Tàu', icon: Database },
    { path: '/reports/generate', label: 'Xuất Báo cáo', icon: BarChart2 },
    { path: '/reports/history', label: 'Lịch sử Báo cáo', icon: History },
  ];

  const ADMIN_ITEMS = [
    { path: '/admin/settings', label: 'Cài đặt', icon: Settings },
    { path: '/admin/users', label: 'Người dùng', icon: Users, adminOnly: true },
  ];

  const getPageTitle = () => {
    const visibleAdminItems = ADMIN_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin');
    const allItems = [...NAV_ITEMS, ...visibleAdminItems];
    const match = allItems.find((item) => location.pathname.startsWith(item.path));
    return match ? match.label : 'Hệ thống Đăng kiểm';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  /** Avatar initials from full name */
  const getInitials = (name) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const roleLabel = user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên';

  return (
    <div className={styles.layout}>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(styles.sidebar, sidebarOpen && styles.sidebarOpen)}>
        <div className={styles.sidebarHeader}>
          <Anchor className={styles.logoIcon} size={24} />
          <span className={styles.logoText}>Đăng kiểm Tàu cá</span>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(styles.navItem, isActive && styles.navItemActive)
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className={styles.navDivider} />

          {ADMIN_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin').map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(styles.navItem, isActive && styles.navItemActive)
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className={styles.sidebarFooter}>
          <div className={styles.avatar}>
            {getInitials(user?.full_name)}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.full_name || 'Admin'}</span>
            <span className={styles.userRole}>{roleLabel}</span>
          </div>
          <button
            className={styles.logoutBtn}
            title="Đăng xuất"
            onClick={handleLogout}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.menuBtn}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Mở menu"
            >
              <Menu size={24} />
            </button>
            <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
          </div>

          <div className={styles.headerRight}>
            <button className={styles.notificationBtn} aria-label="Thông báo">
              <Bell size={20} />
              <span className={styles.notificationBadge} />
            </button>
          </div>
        </header>

        <div className={styles.pageContainer}>
          <div className={styles.pageContent}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
