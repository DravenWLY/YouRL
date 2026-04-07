import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { HomePage } from '@/pages/HomePage';
import { StatsPage } from '@/pages/StatsPage';
import { RecentPage } from '@/pages/RecentPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AccountSettingsPage } from '@/pages/AccountSettingsPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute requireAuth>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/stats" element={
              <ProtectedRoute requireAuth>
                <StatsPage />
              </ProtectedRoute>
            } />
            <Route path="/recent" element={
              <ProtectedRoute requireAuth>
                <RecentPage />
              </ProtectedRoute>
            } />
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