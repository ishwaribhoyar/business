import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/authService.js';

export const ProtectedRoute: React.FC = () => {
  const isAuth = authService.isAuthenticated();

  if (!isAuth) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};
