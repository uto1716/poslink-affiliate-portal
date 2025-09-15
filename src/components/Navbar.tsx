import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'navbar-link active' : 'navbar-link';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          アフィリエイトポータル
        </Link>
        {user && (
          <div className="navbar-menu">
            <Link to="/dashboard" className={isActive('/dashboard')}>
              ダッシュボード
            </Link>
            <Link to="/companies" className={isActive('/companies')}>
              提携企業
            </Link>
            <Link to="/links" className={isActive('/links')}>
              マイリンク
            </Link>
            <Link to="/reports" className={isActive('/reports')}>
              レポート
            </Link>
            <span className="navbar-link">
              {user.username}
            </span>
            <button onClick={handleLogout} className="btn btn-danger">
              ログアウト
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;