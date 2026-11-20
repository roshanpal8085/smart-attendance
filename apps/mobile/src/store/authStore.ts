import {create} from 'zustand';
import {saveTokens, getTokens, clearTokens, LocalStorage} from '../utils/storage';
import {STORAGE_KEYS} from '../utils/constants';
import type {UserProfile, TokenResponse, UserRole} from '../types/api';

export interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: TokenResponse, user: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  updateTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: UserProfile) => void;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (tokens: TokenResponse, user: UserProfile) => {
    // 1. Securely persist tokens to Keychain
    await saveTokens(tokens.access_token, tokens.refresh_token);

    // 2. Cache user profile in MMKV for fast hydration
    LocalStorage.setObject(STORAGE_KEYS.USER_PROFILE, user);
    LocalStorage.setString(STORAGE_KEYS.LAST_ROLE, user.role);

    set({
      user,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      role: user.role,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    // Clear Keychain credentials and cached profile
    await clearTokens();
    LocalStorage.remove(STORAGE_KEYS.USER_PROFILE);
    LocalStorage.remove(STORAGE_KEYS.LAST_ROLE);

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  updateTokens: async (accessToken: string, refreshToken: string) => {
    await saveTokens(accessToken, refreshToken);
    set({
      accessToken,
      refreshToken,
    });
  },

  setUser: (user: UserProfile) => {
    LocalStorage.setObject(STORAGE_KEYS.USER_PROFILE, user);
    set({
      user,
      role: user.role,
    });
  },

  loadFromStorage: async () => {
    try {
      set({isLoading: true});
      const storedTokens = await getTokens();
      const cachedUser = LocalStorage.getObject<UserProfile>(STORAGE_KEYS.USER_PROFILE);

      if (storedTokens?.accessToken && cachedUser) {
        set({
          user: cachedUser,
          accessToken: storedTokens.accessToken,
          refreshToken: storedTokens.refreshToken,
          role: cachedUser.role,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error loading credentials from storage:', error);
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
