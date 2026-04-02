export interface UrlData {
  id?: string;
  originalUrl: string;
  shortCode: string;
  createdAt?: string;
  clickCount?: number;
}

export interface ShortenUrlRequest {
  url: string;
}

export interface ShortenUrlResponse {
  shortCode: string;
  shortUrl: string;
}

export interface ApiError {
  message: string;
  status: number;
}
