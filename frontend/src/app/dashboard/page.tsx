'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <main className="flex-1 bg-cream">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="font-serif text-2xl font-bold text-navy mb-1">
            Welcome, {user.firstName}!
          </h1>
          <p className="text-muted mb-8">
            Here&apos;s your KalaCUBE dashboard
          </p>

          {/* Profile Completeness */}
          {user.profileCompleteness < 80 && (
            <div className="bg-yellow/15 border border-yellow/50 rounded-xl p-5 mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-navy">
                  Complete your profile
                </h3>
                <span className="text-sm font-semibold text-navy">
                  {user.profileCompleteness}%
                </span>
              </div>
              <div className="w-full bg-navy/10 rounded-full h-2 mb-3">
                <div
                  className="bg-yellow h-2 rounded-full transition-all"
                  style={{ width: `${user.profileCompleteness}%` }}
                />
              </div>
              <Link
                href="/profile/edit"
                className="text-sm font-semibold text-indigo hover:text-navy"
              >
                Complete now &rarr;
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href={`/profile/${user.username}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition"
            >
              <h3 className="font-semibold text-navy mb-1">
                View Profile
              </h3>
              <p className="text-sm text-gray-500">
                See how others see your profile
              </p>
            </Link>

            <Link
              href="/profile/edit"
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition"
            >
              <h3 className="font-semibold text-navy mb-1">
                Edit Profile
              </h3>
              <p className="text-sm text-gray-500">
                Update your info and {user.role === 'artist' ? 'portfolio' : 'details'}
              </p>
            </Link>

            <Link
              href="/explore"
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition"
            >
              <h3 className="font-semibold text-navy mb-1">
                Explore Artists
              </h3>
              <p className="text-sm text-gray-500">
                Discover artists across India
              </p>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
