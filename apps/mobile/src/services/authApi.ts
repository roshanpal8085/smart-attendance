import {apiClient} from './api';
import type {TokenResponse, UserProfile} from '../types/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  tokens: TokenResponse;
  user: UserProfile;
}

export const authApi = {
  login: async (credentials: LoginPayload): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  forgotPassword: async (email: string): Promise<{message: string}> => {
    const response = await apiClient.post<{message: string}>('/auth/forgot-password', {
      email,
    });
    return response.data;
  },

  getMe: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/auth/me');
    return response.data;
  },
};
