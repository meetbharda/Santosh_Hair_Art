import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import PortfolioPage from './pages/PortfolioPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import BookingPage from './pages/BookingPage';
import BookingLookupPage from './pages/BookingLookupPage';
import AuthPage from './pages/AuthPage';
import CustomerDashboardPage from './pages/CustomerDashboardPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminAppointmentsPage from './pages/admin/AdminAppointmentsPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminSchedulePage from './pages/admin/AdminSchedulePage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminEnquiriesPage from './pages/admin/AdminEnquiriesPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Customer Website Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="portfolio" element={<PortfolioPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="book" element={<BookingPage />} />
              <Route path="lookup" element={<BookingLookupPage />} />
              <Route path="auth" element={<AuthPage />} />
              <Route path="portal" element={<CustomerDashboardPage />} />
            </Route>

            {/* Secure Admin Portal Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="appointments" element={<AdminAppointmentsPage />} />
              <Route path="services" element={<AdminServicesPage />} />
              <Route path="schedule" element={<AdminSchedulePage />} />
              <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="enquiries" element={<AdminEnquiriesPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
