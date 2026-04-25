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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const { signup, login, error: authError, clearError, loading } = useAuth();

  const isLogin = mode === 'login';
  const title = isLogin ? 'Log In' : 'Sign Up';
  const switchText = isLogin ? "Don't have an account?" : 'Already have an account?';
  const switchActionText = isLogin ? 'Sign Up' : 'Log In';

  const validateForm = (): boolean => {
    setFormError(null);
    clearError();

    if (!email.trim()) {
      setFormError('Email is required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Please enter a valid email address');
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
      const authenticatedUser = isLogin
        ? await login(email, password)
        : await signup(email, password);

      if (authenticatedUser) {
        onSuccess?.();
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setFormError(err instanceof Error ? err.message : isLogin ? 'Login failed' : 'Signup failed');
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
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@rice.edu"
            className="input-primary w-full"
            disabled={loading}
            autoComplete="email"
            inputMode="email"
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

        {displayError && (
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
    </div>
  );
};
