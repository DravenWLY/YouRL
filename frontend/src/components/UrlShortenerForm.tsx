import React, { useState } from 'react';
import { ApiService } from '@/services/api';
import { AnonymousUrlService } from '@/services/anonymousUrls';
import { useCurrentUser } from '@/contexts/AuthContext';
import { ShortenResponse } from '@/types';

interface UrlShortenerFormProps {
  onShortenSuccess?: (response: ShortenResponse) => void;
}

export const UrlShortenerForm: React.FC<UrlShortenerFormProps> = ({ onShortenSuccess }) => {
  const user = useCurrentUser();
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShortenResponse | null>(null);

  const validateUrl = (input: string): boolean => {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL (include http:// or https://)');
      return;
    }

    if (customCode.trim() && !/^[A-Za-z0-9_-]{4,24}$/.test(customCode.trim())) {
      setError('Custom short code must be 4-24 characters using letters, numbers, hyphens, or underscores.');
      return;
    }

    setLoading(true);

    try {
      const response = await ApiService.shortenUrl(url, user?.userId, customCode.trim() || null);
      if (!user) {
        AnonymousUrlService.add(response.shortId);
      }
      setResult(response);
      onShortenSuccess?.(response);
      setUrl('');
      setCustomCode('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to shorten URL. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.shortUrl);
      alert('Copied to clipboard!');
    }
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shorten Your URL</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your long URL
          </label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/very-long-url-path"
            className="input-primary"
            disabled={loading}
          />
        </div>

        {user?.isPaid && (
          <div>
            <label htmlFor="customCode" className="block text-sm font-medium text-gray-700 mb-2">
              Custom short code (Premium)
            </label>
            <input
              id="customCode"
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="your-brand"
              className="input-primary"
              disabled={loading}
              autoComplete="off"
            />
            <p className="mt-2 text-xs text-gray-500">
              Optional. Use 4-24 letters, numbers, hyphens, or underscores to create a branded short URL.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Shortening...' : 'Shorten URL'}
        </button>
      </form>

      {result && (
        <div className="mt-8 p-4 bg-primary-50 rounded-lg border border-primary-200">
          <h3 className="text-lg font-semibold text-primary-900 mb-2">Your shortened URL:</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={result.shortUrl}
              readOnly
              className="input-primary bg-white flex-1"
            />
            <button
              onClick={handleCopy}
              className="btn-secondary whitespace-nowrap"
            >
              Copy
            </button>
          </div>
<p className="text-sm text-gray-600 mt-2">
             Short ID: <code className="font-mono bg-gray-100 px-2 py-1 rounded">{result.shortId}</code>
           </p>
          {user ? (
            <p className="text-sm text-green-700 mt-3">
              Saved to your dashboard.
            </p>
          ) : (
            <p className="text-sm text-amber-700 mt-3">
              This short link was created anonymously. Log in to save future links to your dashboard.
            </p>
          )}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        <p>Your shortened URLs will redirect to their original destination.</p>
        {user && (
          <p className="mt-2 text-primary-600">
            ✓ This URL will be associated with your account ({user.email})
          </p>
        )}
        {!user && (
          <p className="mt-2">
            You can shorten links without an account. Log in if you want to save and manage them later.
          </p>
        )}
        {user && !user.isPaid && (
          <p className="mt-2 text-amber-700">
            Upgrade to Premium to create custom short codes and unlock detailed click analytics.
          </p>
        )}
      </div>
    </div>
  );
};
