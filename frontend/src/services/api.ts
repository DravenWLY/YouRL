import { UrlData, ShortenRequest, ShortenResponse, ErrorResponse, ApiError } from '@/types';

const API_BASE = '/api';

export class ApiService {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      try {
        // Try to parse backend's error response
        const errorData: ErrorResponse = await response.json();
        console.error(`Backend error (${response.status}):`, errorData.error);
        throw {
          message: `Failed to shorten URL: ${errorData.error}`,
          status: response.status,
        } as ApiError;
      } catch {
        // Fallback to generic error if JSON parsing fails
        throw {
          message: `Failed to shorten URL: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }
    }
    return response.json();
  }

  static async shortenUrl(url: string): Promise<ShortenResponse> {
    const request: ShortenRequest = {
      longUrl: url,
      expiresAt: null,
      // Note: userId field skipped for now until auth is implemented
    };

    const response = await fetch(`${API_BASE}/shorten`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return this.handleResponse<ShortenResponse>(response);
  }

  static async getUrlStats(shortCode: string): Promise<UrlData> {
    const response = await fetch(`${API_BASE}/${shortCode}/stats`);
    if (!response.ok) {
      throw {
        message: 'URL statistics endpoint not implemented yet',
        status: response.status,
      } as ApiError;
    }
    return this.handleResponse<UrlData>(response);
  }

  static async getRecentUrls(): Promise<UrlData[]> {
    const response = await fetch(`${API_BASE}/recent`);
    if (!response.ok) {
      throw {
        message: 'Recent URLs endpoint not implemented yet',
        status: response.status,
      } as ApiError;
    }
    return this.handleResponse<UrlData[]>(response);
  }

  static redirectToShortUrl(shortId: string): void {
    window.location.href = `/${shortId}`;
  }
}
