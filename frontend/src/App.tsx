import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { HomePage } from '@/pages/HomePage';

import { DashboardPage } from '@/pages/DashboardPage';
import { AccountSettingsPage } from '@/pages/AccountSettingsPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route path="/dashboard" element={
              <ProtectedRoute requireAuth>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requireAuth>
                <AccountSettingsPage />
              </ProtectedRoute>
            } />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
};

export default App;
