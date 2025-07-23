import { queryClient } from "./queryClient";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  balance: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

class AuthManager {
  private state: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
  };

  private listeners: Array<(state: AuthState) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        this.state = {
          token,
          user: JSON.parse(user),
          isAuthenticated: true,
        };
      } catch (error) {
        this.logout();
      }
    }
  }

  private saveToStorage() {
    if (this.state.token && this.state.user) {
      localStorage.setItem('token', this.state.token);
      localStorage.setItem('user', JSON.stringify(this.state.user));
    }
  }

  private clearStorage() {
    // Clear all auth-related localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear any other auth-related items that might exist
    localStorage.removeItem('authState');
    localStorage.removeItem('userSession');
    
    // Clear sessionStorage as well
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('authState');
    sessionStorage.removeItem('userSession');
    
    // Clear any cached auth data
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.warn('Could not clear storage:', error);
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getState(): AuthState {
    return { ...this.state };
  }

  login(token: string, user: User) {
    this.state = {
      token,
      user,
      isAuthenticated: true,
    };
    this.saveToStorage();
    this.notify();
  }

  logout() {
    // Reset the authentication state
    this.state = {
      user: null,
      token: null,
      isAuthenticated: false,
    };
    
    // Clear all storage
    this.clearStorage();
    
    // Clear TanStack Query cache
    queryClient.clear();
    queryClient.invalidateQueries();
    queryClient.removeQueries();
    
    // Clear any cached queries from TanStack Query
    if (typeof window !== 'undefined') {
      try {
        // Clear browser cache for the current domain
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
        
        // Force page reload after a brief delay to ensure clean state
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      } catch (error) {
        console.warn('Could not clear caches:', error);
        // Fallback to simple redirect
        window.location.href = '/';
      }
    }
    
    // Notify listeners
    this.notify();
  }

  getAuthHeader(): Record<string, string> {
    if (this.state.token) {
      return { Authorization: `Bearer ${this.state.token}` };
    }
    return {};
  }
}

export const authManager = new AuthManager();
