import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useAuthStore} from '../store/authStore';
import {authApi, LoginPayload} from '../services/authApi';
import type {UserProfile, TokenResponse} from '../types/api';

export function useAuth() {
  const queryClient = useQueryClient();
  const {
    user,
    role,
    isAuthenticated,
    isLoading,
    login: storeLogin,
    logout: storeLogout,
    setUser,
  } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginPayload) => authApi.login(credentials),
    onSuccess: async (data) => {
      await storeLogin(data.tokens, data.user);
      queryClient.clear();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch (err) {
        // Proceed with local logout regardless of server response
        console.warn('Backend logout failed, clearing local session:', err);
      }
    },
    onSettled: async () => {
      await storeLogout();
      queryClient.clear();
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });

  return {
    user,
    role,
    isAuthenticated,
    isLoading,
    setUser,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    isSubmittingForgot: forgotPasswordMutation.isPending,
    forgotPasswordError: forgotPasswordMutation.error,
  };
}
