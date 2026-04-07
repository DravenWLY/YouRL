import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const AccountSettingsPage: React.FC = () => {
  const { user, changePassword, upgradeMembership, deleteAccount } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
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

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    setUpgradeError(null);

    try {
      await upgradeMembership();
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : 'Upgrade failed');
    } finally {
      setUpgradeLoading(false);
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
              <span className="text-gray-600">Username:</span>
              <span className="font-medium">{user?.username}</span>
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
                <p className="text-sm mt-1">You have access to all premium features.</p>
              </div>
              <div className="text-gray-600 text-sm">
                <p>Premium benefits include:</p>
                <ul className="mt-2 space-y-1 pl-5 list-disc">
                  <li>Advanced analytics</li>
                  <li>Custom short codes</li>
                  <li>Priority support</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                <p className="font-medium">Free Account</p>
                <p className="text-sm mt-1">Upgrade to premium for advanced features.</p>
              </div>
              <button
                onClick={handleUpgrade}
                disabled={upgradeLoading}
                className="btn-primary w-full"
              >
                {upgradeLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Upgrading...
                  </span>
                ) : (
                  'Upgrade to Premium'
                )}
              </button>
              {upgradeError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {upgradeError}
                </div>
              )}
              <div className="text-gray-600 text-sm">
                <p>Premium features include:</p>
                <ul className="mt-2 space-y-1 pl-5 list-disc">
                  <li>Advanced analytics dashboard</li>
                  <li>Custom short code creation</li>
                  <li>Priority customer support</li>
                  <li>Extended URL expiration options</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Security Card */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
          <div className="space-y-4">
            <div className="text-gray-600 text-sm">
              <p>Your password is stored securely. You can change it here.</p>
              <p className="mt-2">Note: In a production app, passwords would be hashed.</p>
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