'use client';

import { create } from 'zustand';
import { signIn, signInWithRedirect, signOut } from 'aws-amplify/auth';
import api from '@/lib/api';
import { getIdToken, configureAmplify } from '@/lib/amplify';
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
    let result;
    try {
      result = await signIn({ username: email, password });
    } catch (err) {
      // A valid Amplify session already exists (cookie storage under ssr:true;
      // our store was just out of sync). Don't sign out — that triggers an OAuth
      // redirect. Just hydrate from the existing session and proceed.
      if (
        (err as { name?: string })?.name === 'UserAlreadyAuthenticatedException'
      ) {
        await useAuthStore.getState().fetchUser();
        if (useAuthStore.getState().isAuthenticated) return;
      }
      throw err;
    }
    if (!result.isSignedIn) {
      // e.g. CONFIRM_SIGN_UP, NEW_PASSWORD_REQUIRED, MFA — surface for the UI.
      throw new Error(`ADDITIONAL_STEP:${result.nextStep.signInStep}`);
    }
    await useAuthStore.getState().fetchUser();
  },

  // One-tap style redirect to Cognito Hosted UI → Google. Works for signup OR
  // login: the account-linking Lambda connects it to the existing profile.
  loginWithGoogle: async () => {
    // Ensure Amplify's OAuth config is applied on this client before redirect
    // (guards against a first-click race where the module-load config hasn't
    // taken effect). Log the real error so failures are diagnosable.
    try {
      configureAmplify();
      await signInWithRedirect({ provider: 'Google' });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[google-signin] signInWithRedirect failed:', e);
      throw e;
    }
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
