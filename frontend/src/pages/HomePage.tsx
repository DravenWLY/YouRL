import React from 'react';
import { UrlShortenerForm } from '@/components/UrlShortenerForm';
import { ShortenResponse } from '@/types';

export const HomePage: React.FC = () => {
  const handleShortenSuccess = (response: ShortenResponse) => {
    console.log('URL shortened successfully:', response);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Shorten Your URLs Instantly
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          YouRL is a globally distributed URL shortener that provides fast, reliable links for your needs.
        </p>
      </div>

      <UrlShortenerForm onShortenSuccess={handleShortenSuccess} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
          <p className="text-gray-600">Redirection happens in milliseconds with our global edge network.</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Reliable</h3>
          <p className="text-gray-600">Built on Google Cloud BigTable for enterprise-grade reliability.</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
          <p className="text-gray-600">Track click counts and performance with detailed statistics.</p>
        </div>
      </div>
    </div>
  );
};