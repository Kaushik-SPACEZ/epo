uimport React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { User as ApiUser, AuthResponse } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  user_type?: 'customer' | 'dealer';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (identifier: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, phone: string, password: string, userType?: 'customer' | 'dealer') => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Load user from storage on app start
    AsyncStorage.getItem('auth_user').then(val => {
      if (val) setUser(JSON.parse(val));
      setIsInitializing(false);
    }).catch(() => setIsInitializing(false));
  }, []);

  const signIn = async (identifier: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Determine if identifier is email or phone
      const isEmail = identifier.includes('@');
      const credentials = isEmail 
        ? { email: identifier, password }
        : { phone: identifier, password };

      const response = await api.auth.login(credentials);
      
      if (response.success && response.data) {
        const { user: apiUser, token, refresh_token } = response.data;
        
        // Store token
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('refresh_token', refresh_token);
        
        // Convert API user to local user format
        const localUser: User = {
          id: apiUser.user_id.toString(),
          name: apiUser.name,
          email: apiUser.email,
          phone: apiUser.phone,
          user_type: apiUser.user_type,
        };
        
        setUser(localUser);
        await AsyncStorage.setItem('auth_user', JSON.stringify(localUser));
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error: any) {
      console.error('[Auth] Login error:', error.response?.data || error.message);
      setIsLoading(false);
      return false;
    }
  };

  const signUp = async (
    name: string, 
    email: string, 
    phone: string, 
    password: string,
    userType: 'customer' | 'dealer' = 'customer'
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await api.auth.register({
        name,
        email,
        phone,
        password,
        user_type: userType,
      });
      
      if (response.success && response.data) {
        const { user: apiUser, token, refresh_token } = response.data;
        
        // Store token
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('refresh_token', refresh_token);
        
        // Convert API user to local user format
        const localUser: User = {
          id: apiUser.user_id.toString(),
          name: apiUser.name,
          email: apiUser.email,
          phone: apiUser.phone,
          user_type: apiUser.user_type,
        };
        
        setUser(localUser);
        await AsyncStorage.setItem('auth_user', JSON.stringify(localUser));
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error: any) {
      console.error('[Auth] Registration error:', error.response?.data || error.message);
      setIsLoading(false);
      throw error; // Re-throw error so auth.tsx can catch it
    }
  };

  const signOut = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.auth.logout(refreshToken);
      }
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    } finally {
      // Clear local data regardless of API call success
      setUser(null);
      await AsyncStorage.removeItem('auth_user');
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('refresh_token');
    }
  };

  if (isInitializing) return null;

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}