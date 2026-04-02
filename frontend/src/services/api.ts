import { UrlData, ShortenUrlRequest, ShortenUrlResponse, ApiError } from '@/types';

const API_BASE = '/api';

export class ApiService {
  private static handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw {
        message: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      } as ApiError;
    }
    return response.json();
  }

  static async shortenUrl(url: string): Promise<ShortenUrlResponse> {
    const response = await fetch(`${API_BASE}/shorten`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url } as ShortenUrlRequest),
    });

    return this.handleResponse<ShortenUrlResponse>(response);
  }

  static async getUrlStats(shortCode: string): Promise<UrlData> {
    const response = await fetch(`${API_BASE}/${shortCode}/stats`);
    return this.handleResponse<UrlData>(response);
  }

  static async getRecentUrls(): Promise<UrlData[]> {
    const response = await fetch(`${API_BASE}/recent`);
    return this.handleResponse<UrlData[]>(response);
  }

  static getShortUrl(shortCode: string): string {
    return `${window.location.origin}/${shortCode}`;
  }

  static redirectToShortUrl(shortCode: string): void {
    window.location.href = `/${shortCode}`;
  }
}
