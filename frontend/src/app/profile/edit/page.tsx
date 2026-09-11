'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

export default function EditProfilePage() {
  const { user, isAuthenticated, isLoading, fetchUser } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'basic' | 'role'>('basic');

  const [basicForm, setBasicForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    website: '',
    city: '',
    state: '',
    country: 'India',
    instagram: '',
    twitter: '',
    linkedin: '',
    youtube: '',
  });

  const [artistForm, setArtistForm] = useState({
    headline: '',
    statement: '',
    artDimensions: [] as string[],
    skills: '',
    mediums: '',
    availableForCommission: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setBasicForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        website: user.website || '',
        city: user.location?.city || '',
        state: user.location?.state || '',
        country: user.location?.country || 'India',
        instagram: user.socialLinks?.instagram || '',
        twitter: user.socialLinks?.twitter || '',
        linkedin: user.socialLinks?.linkedin || '',
        youtube: user.socialLinks?.youtube || '',
      });

      // Fetch role profile
      if (user.role === 'artist') {
        api
          .get(`/api/users/${user.username}/artist-profile`)
          .then((res) => {
            const p = res.data.data;
            if (p) {
              setArtistForm({
                headline: p.headline || '',
                statement: p.statement || '',
                artDimensions: p.artDimensions || [],
                skills: p.skills?.join(', ') || '',
                mediums: p.mediums?.join(', ') || '',
                availableForCommission: p.availableForCommission || false,
              });
            }
          })
          .catch(() => {});
      }
    }
  }, [user]);

  const saveBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.patch(`/api/users/${user?.username}`, {
        firstName: basicForm.firstName,
        lastName: basicForm.lastName,
        bio: basicForm.bio,
        website: basicForm.website,
        location: {
          city: basicForm.city,
          state: basicForm.state,
          country: basicForm.country,
        },
        socialLinks: {
          instagram: basicForm.instagram,
          twitter: basicForm.twitter,
          linkedin: basicForm.linkedin,
          youtube: basicForm.youtube,
        },
      });
      await fetchUser();
      setMessage('Profile saved!');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const saveArtistProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put(`/api/users/${user?.username}/artist-profile`, {
        headline: artistForm.headline,
        statement: artistForm.statement,
        artDimensions: artistForm.artDimensions,
        skills: artistForm.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        mediums: artistForm.mediums
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        availableForCommission: artistForm.availableForCommission,
      });
      await fetchUser();
      setMessage('Artist profile saved!');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !user) return null;

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none text-sm';

  return (
    <>
      <main className="flex-1 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Edit Profile
          </h1>

          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.includes('Failed') || message.includes('failed')
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-green-50 text-green-600 border border-green-200'
              }`}
            >
              {message}
            </div>
          )}

          {/* Tabs */}
          {user.role === 'artist' && (
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTab('basic')}
                className={`flex-1 py-2 text-sm font-medium rounded-md ${
                  tab === 'basic'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Basic Info
              </button>
              <button
                onClick={() => setTab('role')}
                className={`flex-1 py-2 text-sm font-medium rounded-md ${
                  tab === 'role'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Artist Profile
              </button>
            </div>
          )}

          {tab === 'basic' && (
            <form
              onSubmit={saveBasic}
              className="bg-white rounded-xl border p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={basicForm.firstName}
                    onChange={(e) =>
                      setBasicForm({ ...basicForm, firstName: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={basicForm.lastName}
                    onChange={(e) =>
                      setBasicForm({ ...basicForm, lastName: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={basicForm.bio}
                  onChange={(e) =>
                    setBasicForm({ ...basicForm, bio: e.target.value })
                  }
                  maxLength={500}
                  rows={3}
                  className={inputClass}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={basicForm.website}
                  onChange={(e) =>
                    setBasicForm({ ...basicForm, website: e.target.value })
                  }
                  className={inputClass}
                  placeholder="https://"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={basicForm.city}
                    onChange={(e) =>
                      setBasicForm({ ...basicForm, city: e.target.value })
                    }
                    className={inputClass}
                    placeholder="Mumbai"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={basicForm.state}
                    onChange={(e) =>
                      setBasicForm({ ...basicForm, state: e.target.value })
                    }
                    className={inputClass}
                    placeholder="Maharashtra"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={basicForm.country}
                    onChange={(e) =>
                      setBasicForm({ ...basicForm, country: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <h3 className="text-sm font-semibold text-gray-700 pt-2">
                Social Links
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={basicForm.instagram}
                  onChange={(e) =>
                    setBasicForm({ ...basicForm, instagram: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Instagram URL"
                />
                <input
                  type="text"
                  value={basicForm.twitter}
                  onChange={(e) =>
                    setBasicForm({ ...basicForm, twitter: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Twitter/X URL"
                />
                <input
                  type="text"
                  value={basicForm.linkedin}
                  onChange={(e) =>
                    setBasicForm({ ...basicForm, linkedin: e.target.value })
                  }
                  className={inputClass}
                  placeholder="LinkedIn URL"
                />
                <input
                  type="text"
                  value={basicForm.youtube}
                  onChange={(e) =>
                    setBasicForm({ ...basicForm, youtube: e.target.value })
                  }
                  className={inputClass}
                  placeholder="YouTube URL"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-rose-500 text-white py-2.5 rounded-lg font-semibold hover:bg-rose-600 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}

          {tab === 'role' && user.role === 'artist' && (
            <form
              onSubmit={saveArtistProfile}
              className="bg-white rounded-xl border p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  value={artistForm.headline}
                  onChange={(e) =>
                    setArtistForm({ ...artistForm, headline: e.target.value })
                  }
                  maxLength={120}
                  className={inputClass}
                  placeholder="e.g. Contemporary painter from Jaipur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Art Dimensions
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: 'handicraft', label: 'Handicraft' },
                    { value: 'visual_art', label: 'Visual Art' },
                    { value: 'performing_arts', label: 'Performing Arts' },
                  ].map((dim) => (
                    <label
                      key={dim.value}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer ${
                        artistForm.artDimensions.includes(dim.value)
                          ? 'border-rose-500 bg-rose-50 text-rose-700'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={artistForm.artDimensions.includes(dim.value)}
                        onChange={(e) => {
                          setArtistForm({
                            ...artistForm,
                            artDimensions: e.target.checked
                              ? [...artistForm.artDimensions, dim.value]
                              : artistForm.artDimensions.filter(
                                  (d) => d !== dim.value,
                                ),
                          });
                        }}
                        className="sr-only"
                      />
                      {dim.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={artistForm.skills}
                  onChange={(e) =>
                    setArtistForm({ ...artistForm, skills: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Oil painting, Watercolor, Pottery"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mediums (comma separated)
                </label>
                <input
                  type="text"
                  value={artistForm.mediums}
                  onChange={(e) =>
                    setArtistForm({ ...artistForm, mediums: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Oil on canvas, Clay, Digital"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Artist Statement
                </label>
                <textarea
                  value={artistForm.statement}
                  onChange={(e) =>
                    setArtistForm({ ...artistForm, statement: e.target.value })
                  }
                  maxLength={2000}
                  rows={4}
                  className={inputClass}
                  placeholder="Describe your art practice..."
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={artistForm.availableForCommission}
                  onChange={(e) =>
                    setArtistForm({
                      ...artistForm,
                      availableForCommission: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                />
                <span className="text-sm text-gray-700">
                  Available for commission work
                </span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-rose-500 text-white py-2.5 rounded-lg font-semibold hover:bg-rose-600 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Artist Profile'}
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
