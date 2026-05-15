import React from 'react';
import { Navigate } from 'react-router-dom';

const CustomerProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem('customerLoggedIn') === 'true';
  
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default CustomerProtectedRoute;
