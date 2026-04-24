import {
  ShortenRequest,
  ShortenResponse,
  ErrorResponse,
  ApiError,
  UserUrlSummary,
  ClaimUrlsRequest,
  ClaimUrlsResponse,
} from '@/types';

import { API_BASE, BACKEND_ORIGIN } from '@/services/config';

export class ApiService {
  private static buildApiError(message: string, status: number): ApiError {
    const error = new Error(message) as ApiError;
    error.status = status;
    return error;
  }

  private static async handleResponse<T>(response: Response, defaultPrefix: string): Promise<T> {
    if (!response.ok) {
      let message = `${defaultPrefix}: ${response.statusText}`;
      const contentType = response.headers.get('content-type') ?? '';

      if (contentType.includes('application/json')) {
        const errorData = await response.json().catch(() => null) as ErrorResponse | null;
        if (errorData?.error) {
          message = `${defaultPrefix}: ${errorData.error}`;
        }
      }

      throw this.buildApiError(message, response.status);
    }
    return response.json();
  }

  static async shortenUrl(url: string, userId?: string | null, customCode?: string | null): Promise<ShortenResponse> {
    const request: ShortenRequest = {
      longUrl: url,
      userId: userId,
      customCode: customCode,
    };

    const response = await fetch(`${API_BASE}/shorten`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return this.handleResponse<ShortenResponse>(response, 'Failed to shorten URL');
  }

  static async getUserUrls(userId: string): Promise<UserUrlSummary[]> {
    const response = await fetch(`${API_BASE}/urls?userId=${encodeURIComponent(userId)}`);
    return this.handleResponse<UserUrlSummary[]>(response, 'Failed to load dashboard URLs');
  }

  static async claimAnonymousUrls(userId: string, shortIds: string[]): Promise<ClaimUrlsResponse> {
    const request: ClaimUrlsRequest = { userId, shortIds };
    const response = await fetch(`${API_BASE}/urls/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return this.handleResponse<ClaimUrlsResponse>(response, 'Failed to claim anonymous URLs');
  }

  static redirectToShortUrl(shortId: string): void {
    window.location.href = `${BACKEND_ORIGIN}/${shortId}`;
  }
}
