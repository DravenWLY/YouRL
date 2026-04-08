import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AuthService } from '@/services/auth';
import { UserAccount, AuthState } from '@/types';

interface AuthContextType {
  user: UserAccount | null;
  loading: boolean;
  error: string | null;
  signup: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  upgradeMembership: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useCurrentUser = (): UserAccount | null => {
  const { user } = useAuth();
  return user;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Initialize auth state from sessionStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const user = AuthService.getCurrentUser();
        setAuthState({
          user,
          loading: false,
          error: null,
        });
      } catch {
        setAuthState({
          user: null,
          loading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    initializeAuth();
  }, []);

  const signup = async (username: string, password: string): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const user = await AuthService.signup(username, password);
      setAuthState({
        user,
        loading: false,
        error: null,
      });
    } catch (err) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Signup failed',
      }));
      throw err;
    }
  };

  const login = async (username: string, password: string): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const user = await AuthService.login(username, password);
      setAuthState({
        user,
        loading: false,
        error: null,
      });
    } catch (err) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Login failed',
      }));
      throw err;
    }
  };

  const logout = (): void => {
    AuthService.logout();
    setAuthState({
      user: null,
      loading: false,
      error: null,
    });
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    if (!authState.user) {
      throw new Error('User must be logged in to change password');
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const user = await AuthService.changePassword(authState.user.username, oldPassword, newPassword);
      setAuthState(prev => ({
        ...prev,
        user,
        loading: false,
        error: null,
      }));
    } catch (err) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Password change failed',
      }));
      throw err;
    }
  };

  const upgradeMembership = async (): Promise<void> => {
    if (!authState.user) {
      throw new Error('User must be logged in to upgrade membership');
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const user = await AuthService.upgradeMembership(authState.user.username);
      setAuthState(prev => ({
        ...prev,
        user,
        loading: false,
        error: null,
      }));
    } catch (err) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Upgrade failed',
      }));
      throw err;
    }
  };

  const deleteAccount = async (): Promise<void> => {
    if (!authState.user) {
      throw new Error('User must be logged in to delete account');
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await AuthService.deleteAccount(authState.user.username);
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (err) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Account deletion failed',
      }));
      throw err;
    }
  };

  const clearError = (): void => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const value: AuthContextType = {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signup,
    login,
    logout,
    changePassword,
    upgradeMembership,
    deleteAccount,
    clearError,
  };

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};