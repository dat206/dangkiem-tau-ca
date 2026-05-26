import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
  Anchor
} from 'lucide-react';
import styles from './MainLayout.module.css';
import { clsx } from 'clsx';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const NAV_ITEMS = [
    { path: '/dashboard', label: 'Tổng quan', icon: Home },
    { path: '/upload', label: 'Upload Hồ sơ', icon: UploadCloud },
    { path: '/vessels', label: 'Dữ liệu Tàu', icon: Database },
    { path: '/reports/generate', label: 'Xuất Báo cáo', icon: BarChart2 },
    { path: '/reports/history', label: 'Lịch sử Báo cáo', icon: History },
  ];

  const ADMIN_ITEMS = [
    { path: '/admin/settings', label: 'Cài đặt', icon: Settings },
    { path: '/admin/users', label: 'Người dùng', icon: Users },
  ];

  const getPageTitle = () => {
    const allItems = [...NAV_ITEMS, ...ADMIN_ITEMS];
    const match = allItems.find(item => location.pathname.startsWith(item.path));
    return match ? match.label : 'Hệ thống Đăng kiểm';
  };

  return (
    <div className={styles.layout}>
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
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          
          <div className={styles.navDivider}></div>
          
          {ADMIN_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                clsx(styles.navItem, isActive && styles.navItemActive)
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.avatar}>A</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>Admin Trần</span>
            <span className={styles.userRole}>Quản trị viên</span>
          </div>
          <button className={styles.logoutBtn} title="Đăng xuất">
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
            >
              <Menu size={24} />
            </button>
            <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
          </div>
          
          <div className={styles.headerRight}>
            <button className={styles.notificationBtn}>
              <Bell size={20} />
              <span className={styles.notificationBadge}></span>
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
