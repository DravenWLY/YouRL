export interface UrlData {
  id?: string;
  originalUrl: string;
  shortCode: string;
  createdAt?: string;
  clickCount?: number;
}

// Backend DTO: ShortenRequest.java
export interface ShortenRequest {
  longUrl: string;
  expiresAt?: string | null; // ISO date string or null
  // Note: userId field exists in backend but we'll skip for now until auth is implemented
}

// Backend DTO: ShortenResponse.java
export interface ShortenResponse {
  shortId: string;
  shortUrl: string; // Full URL provided by backend
  longUrl: string;
  userId?: string | null;
  createdAt: string; // ISO date string
  expiresAt?: string | null; // ISO date string or null
}

// Backend DTO: ErrorResponse.java
export interface ErrorResponse {
  error: string;
}

export interface ApiError {
  message: string;
  status: number;
}
