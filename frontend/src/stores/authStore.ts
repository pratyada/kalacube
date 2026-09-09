'use client';

import { create } from 'zustand';
import { signIn, signInWithRedirect, signOut } from 'aws-amplify/auth';
import api from '@/lib/api';
import { getIdToken } from '@/lib/amplify';
import type { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  loginWithEmail: async (email, password) => {
    const { isSignedIn, nextStep } = await signIn({
      username: email,
      password,
    });
    if (!isSignedIn) {
      // e.g. CONFIRM_SIGN_UP, NEW_PASSWORD_REQUIRED, MFA — surface for the UI.
      throw new Error(`ADDITIONAL_STEP:${nextStep.signInStep}`);
    }
    await useAuthStore.getState().fetchUser();
  },

  // One-tap style redirect to Cognito Hosted UI → Google. Works for signup OR
  // login: the account-linking Lambda connects it to the existing profile.
  loginWithGoogle: async () => {
    await signInWithRedirect({ provider: 'Google' });
  },

  logout: async () => {
    try {
      await signOut();
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  fetchUser: async () => {
    try {
      const token = await getIdToken();
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const { data } = await api.get('/api/auth/me');
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
