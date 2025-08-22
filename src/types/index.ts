export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  icon: string;
  path: string;
  color: string;
  description: string;
}

export interface Theme {
  mode: 'light' | 'dark';
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}