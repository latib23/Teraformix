import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { auth } from '../../lib/auth';

const RequireSalesAuth = () => {
  const location = useLocation();
  const isAuthenticated = auth.isAuthenticated();
  const userRole = auth.getUserRole();

  if (!isAuthenticated || userRole !== 'SALESPERSON') {
    auth.logout();
    return <Navigate to="/salesteam/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireSalesAuth;