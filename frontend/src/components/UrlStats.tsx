import React, { useState, useEffect } from 'react';
import { ApiService } from '@/services/api';
import { UrlData } from '@/types';

interface UrlStatsProps {
  shortCode: string;
}

export const UrlStats: React.FC<UrlStatsProps> = ({ shortCode }) => {
  const [stats, setStats] = useState<UrlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await ApiService.getUrlStats(shortCode);
        setStats(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load URL statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [shortCode]);

  if (loading) {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card max-w-2xl mx-auto">
        <p className="text-gray-600">No statistics available for this URL.</p>
      </div>
    );
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">URL Statistics</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Short Code</h3>
          <p className="text-lg font-mono bg-gray-100 px-3 py-2 rounded">{stats.shortCode}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">Original URL</h3>
          <p className="text-lg break-all">{stats.originalUrl}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Clicks</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.clickCount || 0}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Created</h3>
            <p className="text-lg">
              {stats.createdAt ? new Date(stats.createdAt).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <a
            href={ApiService.getShortUrl(stats.shortCode)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
          >
            Visit Short URL
          </a>
        </div>
      </div>
    </div>
  );
};