import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';

const PrivateRoute: React.FC = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">読み込み中...</div>;
  }

  return token ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;