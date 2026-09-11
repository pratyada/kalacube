'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/auth';

// Brand category coding: Visual Art = Orange, Handicraft = Teal, Performing = Magenta.
const DIMENSION_PILL: Record<string, string> = {
  visual_art: 'bg-orange/10 text-orange-deep',
  handicraft: 'bg-teal/10 text-teal-deep',
  performing_arts: 'bg-magenta/10 text-magenta',
};
const dimPill = (d: string) => DIMENSION_PILL[d] || 'bg-indigo/5 text-indigo';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<{
    user: User;
    roleProfile: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/api/users/${username}`)
      .then((res) => setProfile(res.data.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Profile not found</p>
        </div>
      </>
    );
  }

  const { user, roleProfile } = profile;
  const isOwner = currentUser?.username === user.username;

  return (
    <>
      <main className="flex-1 bg-cream">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Profile Card */}
          <div className="bg-white rounded-xl border overflow-hidden">
            {/* Cover */}
            <div className="h-32 bg-gradient-to-r from-navy via-indigo to-teal" />

            <div className="px-6 pb-6 -mt-12">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-white border-4 border-white flex items-center justify-center text-3xl font-bold text-rose-500 bg-rose-50">
                {user.avatar?.url ? (
                  <img
                    src={user.avatar.url}
                    alt={user.firstName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.firstName?.[0]?.toUpperCase()
                )}
              </div>

              <div className="mt-3 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-gray-500">@{user.username}</p>
                  <span className="inline-block mt-1 text-xs font-medium bg-rose-100 text-rose-600 px-2 py-0.5 rounded">
                    {user.role}
                  </span>
                </div>
                {isOwner && (
                  <Link
                    href="/profile/edit"
                    className="text-sm font-medium text-rose-500 border border-rose-200 px-4 py-1.5 rounded-lg hover:bg-rose-50"
                  >
                    Edit Profile
                  </Link>
                )}
              </div>

              {user.bio && (
                <p className="mt-4 text-gray-600 text-sm">{user.bio}</p>
              )}

              {user.location?.city && (
                <p className="mt-2 text-gray-400 text-sm">
                  {[user.location.city, user.location.state, user.location.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}

              {/* Profile Completeness (owner only) */}
              {isOwner && user.profileCompleteness < 100 && (
                <div className="mt-4 bg-yellow/15 border border-yellow/50 rounded-lg p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-navy font-semibold">
                      Profile completeness
                    </span>
                    <span className="text-navy">
                      {user.profileCompleteness}%
                    </span>
                  </div>
                  <div className="w-full bg-navy/10 rounded-full h-1.5">
                    <div
                      className="bg-yellow h-1.5 rounded-full"
                      style={{ width: `${user.profileCompleteness}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Role-specific info */}
          {roleProfile && (
            <div className="bg-white rounded-xl border mt-6 p-6">
              {user.role === 'artist' && (
                <>
                  <h2 className="text-lg font-semibold mb-4">
                    Artist Profile
                  </h2>
                  {roleProfile.headline && (
                    <p className="text-gray-700 font-medium mb-2">
                      {roleProfile.headline}
                    </p>
                  )}
                  {roleProfile.statement && (
                    <p className="text-gray-500 text-sm mb-4">
                      {roleProfile.statement}
                    </p>
                  )}
                  {roleProfile.artDimensions?.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-600">
                        Art Dimensions:{' '}
                      </span>
                      {roleProfile.artDimensions.map((d: string) => (
                        <span
                          key={d}
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded mr-1 ${dimPill(d)}`}
                        >
                          {d.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                  {roleProfile.skills?.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-600">
                        Skills:{' '}
                      </span>
                      {roleProfile.skills.map((s: string) => (
                        <span
                          key={s}
                          className="inline-block text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded mr-1"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {roleProfile.availableForCommission && (
                    <p className="text-sm text-green-600 font-medium">
                      Available for commission
                    </p>
                  )}
                </>
              )}

              {user.role === 'curator' && (
                <>
                  <h2 className="text-lg font-semibold mb-4">
                    Curator Profile
                  </h2>
                  {roleProfile.headline && (
                    <p className="text-gray-700 font-medium mb-2">
                      {roleProfile.headline}
                    </p>
                  )}
                  {roleProfile.expertise?.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-600">
                        Expertise:{' '}
                      </span>
                      {roleProfile.expertise.map((e: string) => (
                        <span
                          key={e}
                          className="inline-block text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded mr-1"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}

              {user.role === 'art-space' && (
                <>
                  <h2 className="text-lg font-semibold mb-4">
                    {roleProfile.spaceName || 'Art Space'}
                  </h2>
                  {roleProfile.description && (
                    <p className="text-gray-500 text-sm mb-3">
                      {roleProfile.description}
                    </p>
                  )}
                  {roleProfile.spaceType && (
                    <p className="text-sm text-gray-600 mb-2">
                      Type: {roleProfile.spaceType}
                    </p>
                  )}
                  {roleProfile.address?.city && (
                    <p className="text-sm text-gray-500">
                      {[
                        roleProfile.address.street,
                        roleProfile.address.city,
                        roleProfile.address.state,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
