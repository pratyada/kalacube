'use client';

// Importing this module runs configureAmplify() as a side effect.
import '@/lib/amplify';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export default function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetchUser = useAuthStore((s) => s.fetchUser);

  // Hydrate auth state from any existing Amplify session (cookie storage) on
  // first load, so the app reflects a logged-in user without re-authenticating.
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return <>{children}</>;
}
