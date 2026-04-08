'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    store.fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}
