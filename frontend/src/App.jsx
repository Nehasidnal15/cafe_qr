import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout & Protection
import CustomerProtectedRoute from './components/CustomerProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

// Pages
import CustomerLogin from './pages/customer/Login';
import CustomerMenu from './pages/customer/Menu';
import CustomerCart from './pages/customer/Cart';
import CustomerPreference from './pages/customer/Preference';
import CustomerOrderConfirmation from './pages/customer/OrderConfirmation';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import ForgotPassword from './pages/admin/ForgotPassword';

const BackgroundController = () => {
  const location = useLocation();
  useEffect(() => {
    const isCustomerRoute = !location.pathname.startsWith('/admin');
    if (isCustomerRoute) {
      document.body.classList.add('customer-mode');
    } else {
      document.body.classList.remove('customer-mode');
    }
  }, [location]);
  return null;
};

function App() {
  return (
    <Router>
      <Toaster position="bottom-center" />
      <BackgroundController />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

        {/* Protected Customer Routes */}
        <Route path="/preference" element={<CustomerProtectedRoute><CustomerPreference /></CustomerProtectedRoute>} />
        <Route path="/menu" element={<CustomerProtectedRoute><CustomerMenu /></CustomerProtectedRoute>} />
        <Route path="/cart" element={<CustomerProtectedRoute><CustomerCart /></CustomerProtectedRoute>} />
        <Route path="/order-confirmation" element={<CustomerProtectedRoute><CustomerOrderConfirmation /></CustomerProtectedRoute>} />

        {/* Protected Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/orders" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/menu" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/analytics" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/qrcodes" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
