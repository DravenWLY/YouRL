import React, { useState } from 'react';
import { ApiService } from '@/services/api';
import { ShortenResponse } from '@/types';

interface UrlShortenerFormProps {
  onShortenSuccess?: (response: ShortenResponse) => void;
}

export const UrlShortenerForm: React.FC<UrlShortenerFormProps> = ({ onShortenSuccess }) => {
  const [url, setUrl] = useState('');
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

    setLoading(true);

    try {
      const response = await ApiService.shortenUrl(url);
      setResult(response);
      onShortenSuccess?.(response);
      setUrl('');
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
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        <p>Your shortened URLs will redirect to their original destination.</p>
      </div>
    </div>
  );
};
