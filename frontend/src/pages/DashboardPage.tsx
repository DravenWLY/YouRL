import React from 'react';
import { useCurrentUser } from '@/contexts/AuthContext';

export const DashboardPage: React.FC = () => {
  const user = useCurrentUser();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Your Dashboard
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Welcome back, {user?.username}! Manage your shortened URLs and account settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Summary Card */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
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

        {/* Quick Stats Card */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-primary-600">0</div>
              <div className="text-gray-600 mt-1">URLs Created</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-primary-600">0</div>
              <div className="text-gray-600 mt-1">Total Clicks</div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/"
              className="block w-full text-center btn-primary"
            >
              Shorten New URL
            </a>
            <a
              href="/settings"
              className="block w-full text-center btn-secondary"
            >
              Account Settings
            </a>
            {!user?.isPaid && (
              <a
                href="/upgrade"
                className="block w-full text-center bg-yellow-100 text-yellow-800 hover:bg-yellow-200 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Upgrade to Premium
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Empty State for URLs */}
      <div className="card">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No URLs Yet</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Your shortened URLs will appear here once you create them. The dashboard feature is coming soon!
          </p>
          <div className="space-y-3 max-w-sm mx-auto">
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
              <p className="font-medium">Coming Soon:</p>
              <ul className="mt-2 space-y-1">
                <li>• View all your shortened URLs</li>
                <li>• See click statistics for each URL</li>
                <li>• Manage URL expiration dates</li>
                <li>• Delete or deactivate URLs</li>
              </ul>
            </div>
            <a
              href="/"
              className="block w-full btn-primary"
            >
              Create Your First Short URL
            </a>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">About Your Dashboard</h3>
          <div className="space-y-3 text-gray-600">
            <p>
              This is your personal dashboard where you'll be able to manage all your shortened URLs.
              Once the backend API is fully implemented, you'll see:
            </p>
            <ul className="space-y-2 pl-5 list-disc">
              <li>All URLs you've created</li>
              <li>Click statistics for each URL</li>
              <li>Expiration dates and status</li>
              <li>Options to edit or delete URLs</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Create Short URLs</h4>
                <p className="text-gray-600 text-sm mt-1">Use the homepage to shorten any URL</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Share Everywhere</h4>
                <p className="text-gray-600 text-sm mt-1">Use your short URLs in social media, emails, etc.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Track Performance</h4>
                <p className="text-gray-600 text-sm mt-1">Coming soon: See how many clicks each URL gets</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};