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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
    this.state = {
      user: null,
      token: null,
      isAuthenticated: false,
    };
    this.clearStorage();
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
