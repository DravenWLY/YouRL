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
  userId?: string | null;
}

// Backend DTO: ShortenResponse.java
export interface ShortenResponse {
  shortId: string;
  shortUrl: string; // Full URL provided by backend
  longUrl: string;
  userId?: string | null;
  createdAt: string; // ISO date string
}

// Backend DTO: ErrorResponse.java
export interface ErrorResponse {
  error: string;
}

export interface ApiError extends Error {
  status: number;
}

// Backend DTO: UserAccount.java
export interface UserAccount {
  username: string;
  userId: string;
  isPaid: boolean;
}

export interface UserUrlSummary {
  shortId: string;
  shortUrl: string;
  longUrl: string;
  createdAt: string;
  clickCount: number;
  lastAccessTs?: string | null;
  active: boolean;
}

export interface ClaimUrlsRequest {
  userId: string;
  shortIds: string[];
}

export interface ClaimUrlsResponse {
  claimedCount: number;
}

// Backend DTO: AuthRequests.java records
export interface SignupRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface PasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
}

// Authentication state
export interface AuthState {
  user: UserAccount | null;
  loading: boolean;
  error: string | null;
}
