import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'login' | 'signup';

interface AuthFormProps {
  initialMode?: AuthMode;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ 
  initialMode = 'login', 
  onSuccess,
  onCancel 
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const { signup, login, error: authError, clearError, loading } = useAuth();

  const isLogin = mode === 'login';
  const title = isLogin ? 'Log In' : 'Sign Up';
  const switchText = isLogin ? "Don't have an account?" : "Already have an account?";
  const switchActionText = isLogin ? 'Sign Up' : 'Log In';

  const validateForm = (): boolean => {
    setFormError(null);
    clearError();

    if (!username.trim()) {
      setFormError('Username is required');
      return false;
    }

    if (!password) {
      setFormError('Password is required');
      return false;
    }

    if (!isLogin) {
      if (password.length < 6) {
        setFormError('Password must be at least 6 characters');
        return false;
      }

      if (password !== confirmPassword) {
        setFormError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await signup(username, password);
      }
      onSuccess?.();
    } catch (err) {
      // Error is already handled by auth context
      console.error('Authentication error:', err);
    }
  };

  const handleSwitchMode = () => {
    setMode(isLogin ? 'signup' : 'login');
    setFormError(null);
    clearError();
    setConfirmPassword('');
  };

  const displayError = authError || formError;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-gray-600 mt-2">
          {isLogin ? 'Welcome back to YouRL' : 'Create your YouRL account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="input-primary w-full"
            disabled={loading}
            autoComplete="username"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="input-primary w-full"
            disabled={loading}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
        </div>

        {!isLogin && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="input-primary w-full"
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
        )}

        {(displayError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {displayError}
          </div>
        )}

        <div className="flex flex-col space-y-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                {isLogin ? 'Logging in...' : 'Creating account...'}
              </span>
            ) : (
              title
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary w-full"
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>

        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-gray-600">
            {switchText}{' '}
            <button
              type="button"
              onClick={handleSwitchMode}
              className="text-primary-600 hover:text-primary-800 font-medium"
              disabled={loading}
            >
              {switchActionText}
            </button>
          </p>
        </div>
      </form>

      {isLogin && (
        <div className="mt-6 text-sm text-gray-500">
          <p>Demo credentials (if you want to test):</p>
          <p className="font-mono mt-1">Username: testuser</p>
          <p className="font-mono">Password: testpass</p>
        </div>
      )}
    </div>
  );
};