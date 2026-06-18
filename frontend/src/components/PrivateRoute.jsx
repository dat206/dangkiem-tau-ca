import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Bảo vệ các route yêu cầu đăng nhập.
 * Nếu chưa đăng nhập → chuyển về /login.
 * Trong khi đang kiểm tra token → hiển thị loading nhẹ.
 */
const PrivateRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '14px',
        color: '#64748b',
        gap: '10px',
      }}>
        <span style={{
          width: 18, height: 18,
          border: '2px solid #e2e8f0',
          borderTopColor: '#0b3d6b',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          display: 'inline-block',
        }} />
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
