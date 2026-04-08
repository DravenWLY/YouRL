import { UserAccount, SignupRequest, LoginRequest, PasswordChangeRequest, ApiError } from '@/types';

const AUTH_STORAGE_KEY = 'youRL_auth';
const API_BASE = '/api/users';

export class AuthService {
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

  static async signup(username: string, password: string): Promise<UserAccount> {
    const request: SignupRequest = { username, password };
    
    const response = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw {
          message: `Signup failed: ${errorData.error}`,
          status: response.status,
        } as ApiError;
      } catch {
        throw {
          message: `Signup failed: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }
    }

    const user: UserAccount = await response.json();
    this.setStoredUser(user);
    return user;
  }

  static async login(username: string, password: string): Promise<UserAccount> {
    const request: LoginRequest = { username, password };
    
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw {
          message: `Login failed: ${errorData.error}`,
          status: response.status,
        } as ApiError;
      } catch {
        throw {
          message: `Login failed: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }
    }

    const user: UserAccount = await response.json();
    this.setStoredUser(user);
    return user;
  }

  static logout(): void {
    this.setStoredUser(null);
  }

  static async changePassword(username: string, oldPassword: string, newPassword: string): Promise<UserAccount> {
    const request: PasswordChangeRequest = { oldPassword, newPassword };
    
    const response = await fetch(`${API_BASE}/${username}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw {
          message: `Password change failed: ${errorData.error}`,
          status: response.status,
        } as ApiError;
      } catch {
        throw {
          message: `Password change failed: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }
    }

    const user: UserAccount = await response.json();
    // Update stored user if it's the current user
    const currentUser = this.getStoredUser();
    if (currentUser && currentUser.username === username) {
      this.setStoredUser(user);
    }
    return user;
  }

  static async upgradeMembership(username: string): Promise<UserAccount> {
    const response = await fetch(`${API_BASE}/${username}/upgrade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw {
          message: `Upgrade failed: ${errorData.error}`,
          status: response.status,
        } as ApiError;
      } catch {
        throw {
          message: `Upgrade failed: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }
    }

    const user: UserAccount = await response.json();
    // Update stored user if it's the current user
    const currentUser = this.getStoredUser();
    if (currentUser && currentUser.username === username) {
      this.setStoredUser(user);
    }
    return user;
  }

  static async deleteAccount(username: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${username}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw {
          message: `Account deletion failed: ${errorData.error}`,
          status: response.status,
        } as ApiError;
      } catch {
        throw {
          message: `Account deletion failed: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }
    }

    // Logout if it's the current user
    const currentUser = this.getStoredUser();
    if (currentUser && currentUser.username === username) {
      this.logout();
    }
  }

  static isAuthenticated(): boolean {
    return this.getStoredUser() !== null;
  }
}