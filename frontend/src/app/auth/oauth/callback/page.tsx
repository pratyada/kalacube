'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hub } from 'aws-amplify/utils';
import { useAuthStore } from '@/stores/authStore';

function OAuthCallbackContent() {
  const router = useRouter();
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    let done = false;
    const finish = async () => {
      if (done) return;
      done = true;
      await fetchUser();
      router.push('/dashboard');
    };

    // Amplify emits this once it exchanges the ?code= for tokens.
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect') finish();
      if (payload.event === 'signInWithRedirect_failure')
        router.push('/auth/login?error=oauth');
    });

    // Fallback: if the session is already established, proceed.
    fetchUser().then(() => {
      const { isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated) finish();
    });

    return unsubscribe;
  }, [fetchUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Signing you in...</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
