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
    return null;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
