'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginPayload } from '@/types/api';
import { apiLogin, apiLogout, apiGetMe } from '@/lib/api';
import {
  getStoredUser,
  setStoredUser,
  setTokens,
  clearTokens,
  isAuthenticated,
} from '@/lib/auth';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const stored = getStoredUser();
      if (stored) {
        setUser(stored);
      }
      if (isAuthenticated()) {
        try {
          const freshUser = await apiGetMe();
          setUser(freshUser);
          setStoredUser(freshUser);
        } catch {
          // If stored token works, keep stored user
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const response = await apiLogin(payload);
        setTokens(response.access_token, response.refresh_token);
        setUser(response.user);
        setStoredUser(response.user);
        router.push('/dashboard');
        return response.user;
      } catch (err: unknown) {
        let msg = 'Failed to sign in. Please verify your credentials.';
        if (err && typeof err === 'object' && 'response' in err) {
          const resp = (err as { response?: { data?: { detail?: string; message?: string } } }).response;
          if (resp?.data?.detail) msg = resp.data.detail;
          else if (resp?.data?.message) msg = resp.data.message;
        }
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      clearTokens();
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  return {
    user,
    isAuthenticated: !!user || isAuthenticated(),
    isLoading,
    isSubmitting,
    error,
    login,
    logout,
    setError,
  };
}
