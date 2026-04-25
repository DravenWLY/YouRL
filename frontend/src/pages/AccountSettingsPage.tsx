import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const AccountSettingsPage: React.FC = () => {
  const { user, changePassword, cancelPremium, deleteAccount } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const validatePasswordChange = (): boolean => {
    setPasswordError(null);

    if (!oldPassword) {
      setPasswordError('Current password is required');
      return false;
    }

    if (!newPassword) {
      setPasswordError('New password is required');
      return false;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return false;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return false;
    }

    return true;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordChange()) {
      return;
    }

    try {
      await changePassword(oldPassword, newPassword);
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      
      // Reset success message after 3 seconds
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Password change failed');
    }
  };

  const handleCancelPremium = async () => {
    setBillingLoading(true);
    setBillingError(null);
    setBillingMessage(null);

    try {
      await cancelPremium();
      setBillingMessage('Auto-renew is now off. Premium stays active until the current billing period ends.');
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteError('Please confirm account deletion');
      return;
    }

    try {
      await deleteAccount();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Account deletion failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Account Settings
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Manage your account settings, password, and membership.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Info Card */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium break-all text-right">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">User ID:</span>
              <span className="font-mono text-sm">{user?.userId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Membership:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${user?.isPaid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {user?.isPaid ? 'Premium' : 'Free'}
              </span>
            </div>
          </div>
        </div>

        {/* Membership Card */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership Status</h3>
          {user?.isPaid ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <p className="font-medium">Premium Member</p>
                <p className="text-sm mt-1">
                  {user?.subscriptionStatus === 'canceling'
                    ? 'Your subscription will not renew after the current billing period.'
                    : 'You have access to all premium features.'}
                </p>
              </div>
              <div className="text-gray-600 text-sm">
                <p>Premium benefits include:</p>
                <ul className="mt-2 space-y-1 pl-5 list-disc">
                  <li>Detailed dashboard analytics</li>
                  <li>Custom short code creation</li>
                  <li>Branded, easier-to-share short links</li>
                </ul>
              </div>
              <div className="text-gray-600 text-sm">
                <p><strong>Plan:</strong> {user?.premiumPlan === 'annual' ? 'Premium Annual' : 'Premium Monthly'}</p>
                {user?.currentPeriodEnd && (
                  <p className="mt-1"><strong>Current period end:</strong> {new Date(user.currentPeriodEnd).toLocaleDateString()}</p>
                )}
                <p className="mt-1"><strong>Auto renew:</strong> {user?.autoRenew ? 'On' : 'Off'}</p>
              </div>
              {user?.autoRenew && (
                <button
                  onClick={handleCancelPremium}
                  disabled={billingLoading}
                  className="btn-secondary w-full"
                >
                  {billingLoading ? 'Updating...' : 'Cancel Auto-Renew'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                <p className="font-medium">Free Account</p>
                <p className="text-sm mt-1">Choose a plan and complete test checkout to unlock premium features.</p>
              </div>
              <Link to="/billing" className="btn-primary w-full text-center block">
                Choose a Premium Plan
              </Link>
              <div className="text-gray-600 text-sm">
                <p>Premium features include:</p>
                <ul className="mt-2 space-y-1 pl-5 list-disc">
                  <li>Detailed analytics dashboard</li>
                  <li>Custom short code creation</li>
                  <li>Branded short links for easier sharing</li>
                </ul>
              </div>
            </div>
          )}
          {billingError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-4">
              {billingError}
            </div>
          )}
          {billingMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mt-4">
              {billingMessage}
            </div>
          )}
        </div>

        {/* Security Card */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
          <div className="space-y-4">
            <div className="text-gray-600 text-sm">
              <p>This prototype uses simplified account handling for local development.</p>
              <p className="mt-2">Password storage and authentication still need production hardening before any real deployment.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                className="input-primary w-full"
                autoComplete="current-password"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="input-primary w-full"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                className="input-primary w-full"
                autoComplete="new-password"
              />
            </div>
          </div>

          {passwordError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              Password changed successfully!
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
          >
            Change Password
          </button>
        </form>
      </div>

      {/* Account Deletion */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Deletion</h3>
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Warning: Account Deletion</p>
            <p className="text-sm mt-1">
              Deleting your account will remove all your data including shortened URLs.
              This action cannot be undone.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="deleteConfirm"
              checked={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded"
            />
            <label htmlFor="deleteConfirm" className="text-gray-700">
              I understand that account deletion is permanent and irreversible
            </label>
          </div>

          {deleteError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {deleteError}
            </div>
          )}

            <button
              onClick={handleDeleteAccount}
              disabled={!deleteConfirm}
              className={`max-w-xs mx-auto block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                deleteConfirm
                  ? 'text-red-700 bg-red-50 hover:text-red-600 hover:bg-red-100 cursor-pointer'
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
              }`}
            >
              Delete Account
            </button>
        </div>
      </div>
    </div>
  );
};
