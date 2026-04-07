import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from './AuthForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required and user is not logged in
  if (requireAuth && !user) {
    // Show auth modal instead of redirecting
    return (
      <>
        {/* Blurred background */}
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40"></div>
        
        {/* Auth modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="relative">
            <button
              onClick={() => window.history.back()}
              className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <AuthForm 
              initialMode="login"
              onSuccess={() => {}}
              onCancel={() => window.history.back()}
            />
          </div>
        </div>

        {/* Show children content blurred in background */}
        <div className="blur-sm pointer-events-none">
          {children}
        </div>
      </>
    );
  }

  // If user is logged in but trying to access auth pages (login/signup)
  if (!requireAuth && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};