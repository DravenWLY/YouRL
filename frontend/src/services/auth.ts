import { UserAccount, SignupRequest, LoginRequest, PasswordChangeRequest, ApiError, PremiumCheckoutRequest } from '@/types';

import { USER_API_BASE as API_BASE } from '@/services/config';

const AUTH_STORAGE_KEY = 'youRL_auth';

export class AuthService {
  private static buildApiError(message: string, status: number): ApiError {
    const error = new Error(message) as ApiError;
    error.status = status;
    return error;
  }

  private static async parseError(response: Response, defaultPrefix: string): Promise<never> {
    let message = `${defaultPrefix}: ${response.statusText}`;
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const errorData = await response.json().catch(() => null) as { error?: string } | null;
      if (errorData?.error) {
        message = `${defaultPrefix}: ${errorData.error}`;
      }
    }

    throw this.buildApiError(message, response.status);
  }

  private static getStoredUser(): UserAccount | null {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private static setStoredUser(user: UserAccount | null): void {
    if (user) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  static getCurrentUser(): UserAccount | null {
    return this.getStoredUser();
  }

  static async signup(email: string, password: string): Promise<UserAccount> {
    const request: SignupRequest = { email, password };
    
    const response = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      await this.parseError(response, 'Signup failed');
    }

    const user: UserAccount = await response.json();
    this.setStoredUser(user);
    return user;
  }

  static async login(email: string, password: string): Promise<UserAccount> {
    const request: LoginRequest = { email, password };
    
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      await this.parseError(response, 'Login failed');
    }

    const user: UserAccount = await response.json();
    this.setStoredUser(user);
    return user;
  }

  static logout(): void {
    this.setStoredUser(null);
  }

  static async changePassword(email: string, oldPassword: string, newPassword: string): Promise<UserAccount> {
    const request: PasswordChangeRequest = { oldPassword, newPassword };
    
    const response = await fetch(`${API_BASE}/${encodeURIComponent(email)}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      await this.parseError(response, 'Password change failed');
    }

    const user: UserAccount = await response.json();
    // Update stored user if it's the current user
    const currentUser = this.getStoredUser();
    if (currentUser && currentUser.email === email) {
      this.setStoredUser(user);
    }
    return user;
  }

  static async checkoutPremium(email: string, request: PremiumCheckoutRequest): Promise<UserAccount> {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(email)}/subscription/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      await this.parseError(response, 'Checkout failed');
    }

    const user: UserAccount = await response.json();
    const currentUser = this.getStoredUser();
    if (currentUser && currentUser.email === email) {
      this.setStoredUser(user);
    }
    return user;
  }

  static async cancelPremium(email: string): Promise<UserAccount> {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(email)}/subscription/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      await this.parseError(response, 'Cancellation failed');
    }

    const user: UserAccount = await response.json();
    const currentUser = this.getStoredUser();
    if (currentUser && currentUser.email === email) {
      this.setStoredUser(user);
    }
    return user;
  }

  static async deleteAccount(email: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      await this.parseError(response, 'Account deletion failed');
    }

    // Logout if it's the current user
    const currentUser = this.getStoredUser();
    if (currentUser && currentUser.email === email) {
      this.logout();
    }
  }

  static isAuthenticated(): boolean {
    return this.getStoredUser() !== null;
  }
}
