import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerLayout } from './layouts/CustomerLayout.js';
import { AdminLayout } from './layouts/AdminLayout.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';

// Customer Pages
import { HomePage } from './customer/HomePage.js';
import { ProductsPage } from './customer/ProductsPage.js';
import { ProductDetailPage } from './customer/ProductDetailPage.js';
import { QuoteOrderPage } from './customer/QuoteOrderPage.js';
import { HowItWorksPage } from './customer/HowItWorksPage.js';
import { AboutPage } from './customer/AboutPage.js';
import { ContactPage } from './customer/ContactPage.js';
import { PrivacyPolicyPage } from './customer/PrivacyPolicyPage.js';
import { TermsPage } from './customer/TermsPage.js';

// Admin Pages
import { AdminLoginPage } from './admin/AdminLoginPage.js';
import { AdminDashboardPage } from './admin/AdminDashboardPage.js';
import { OrdersPage } from './admin/OrdersPage.js';
import { CustomersPage } from './admin/CustomersPage.js';
import { SuppliersPage } from './admin/SuppliersPage.js';
import { TrucksPage } from './admin/TrucksPage.js';
import { QuotationsPage } from './admin/QuotationsPage.js';
import { PaymentsPage } from './admin/PaymentsPage.js';
import { ReportsPage } from './admin/ReportsPage.js';
import { SettingsPage } from './admin/SettingsPage.js';

import { ScrollToTop } from './components/ScrollToTop.js';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Customer Public Routes */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/get-quote" element={<QuoteOrderPage />} />
          <Route path="/order" element={<QuoteOrderPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Route>

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Protected Operations / Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/orders" element={<OrdersPage />} />
            <Route path="/admin/customers" element={<CustomersPage />} />
            <Route path="/admin/suppliers" element={<SuppliersPage />} />
            <Route path="/admin/trucks" element={<TrucksPage />} />
            <Route path="/admin/quotations" element={<QuotationsPage />} />
            <Route path="/admin/payments" element={<PaymentsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Unmatched Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
