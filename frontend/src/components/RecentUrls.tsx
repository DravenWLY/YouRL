import React, { useState, useEffect } from 'react';
import { ApiService } from '@/services/api';
import { UrlData } from '@/types';

export const RecentUrls: React.FC = () => {
  const [urls, setUrls] = useState<UrlData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentUrls = async () => {
      try {
        const data = await ApiService.getRecentUrls();
        setUrls(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load recent URLs');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentUrls();
  }, []);

  if (loading) {
    return (
      <div className="card max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (urls.length === 0) {
    return (
      <div className="card max-w-4xl mx-auto">
        <p className="text-gray-600">No URLs have been shortened yet.</p>
      </div>
    );
  }

  return (
    <div className="card max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Recently Shortened URLs</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Short Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Original URL
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clicks
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {urls.map((url) => (
              <tr key={url.shortCode} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <a
                    href={ApiService.getShortUrl(url.shortCode)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-primary-600 hover:text-primary-800"
                  >
                    {url.shortCode}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-900 truncate max-w-xs">
                    {url.originalUrl}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {url.clickCount || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {url.createdAt ? new Date(url.createdAt).toLocaleDateString() : 'Unknown'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};