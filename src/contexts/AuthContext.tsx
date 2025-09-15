import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

axios.defaults.baseURL = 'http://localhost:3001/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // トークンがあるがユーザー情報がない場合、ユーザー情報を設定
      const storedUser = localStorage.getItem('user');
      if (storedUser && !user) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          // パースエラーの場合はトークンを削除
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        }
      }
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [token, user]);

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { username, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setToken(token);
      setUser(user);
    } catch (error: any) {
      throw error.response?.data?.error || 'ログインに失敗しました';
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await axios.post('/auth/register', { username, email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setToken(token);
      setUser(user);
    } catch (error: any) {
      throw error.response?.data?.error || '登録に失敗しました';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};