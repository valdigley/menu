export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
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