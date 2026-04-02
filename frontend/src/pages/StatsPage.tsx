import React, { useState } from 'react';
import { UrlStats } from '@/components/UrlStats';

export const StatsPage: React.FC = () => {
  const [shortCode, setShortCode] = useState('');
  const [searchCode, setSearchCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shortCode.trim()) {
      setSearchCode(shortCode.trim());
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          URL Statistics
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Enter a short code to view detailed analytics for your shortened URL.
        </p>
      </div>

      <div className="card max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="shortCode" className="block text-sm font-medium text-gray-700 mb-2">
              Enter Short Code
            </label>
            <input
              id="shortCode"
              type="text"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
              placeholder="abc123"
              className="input-primary"
            />
            <p className="text-sm text-gray-500 mt-2">
              The short code is the unique identifier in your shortened URL (e.g., https://yourl.com/abc123)
            </p>
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
          >
            View Statistics
          </button>
        </form>
      </div>

      {searchCode && <UrlStats shortCode={searchCode} />}

      <div className="card max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What You'll See</h3>
        <ul className="space-y-3 text-gray-600">
          <li className="flex items-start">
            <svg className="w-5 h-5 text-primary-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Total number of clicks on your shortened URL</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-primary-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Original destination URL</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-primary-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Creation date and time</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-primary-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Direct link to visit your shortened URL</span>
          </li>
        </ul>
      </div>
    </div>
  );
};