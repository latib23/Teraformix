
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { auth } from '../../lib/auth';

const RequireAuth = () => {
  const location = useLocation();
  const isAuthenticated = auth.isAuthenticated();
  const userRole = auth.getUserRole();

  useEffect(() => {
    const onAuthError = () => {
      auth.logout();
    };
    window.addEventListener('auth-error', onAuthError);
    return () => window.removeEventListener('auth-error', onAuthError);
  }, []);

  const allowedRoles = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'SALESPERSON', 'BLOG_MANAGER'];
  if (!isAuthenticated || !allowedRoles.includes(userRole as string)) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
