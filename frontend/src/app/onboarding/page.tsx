'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

const DIMENSIONS = [
  { key: 'handicraft', label: 'Handicraft' },
  { key: 'visual_art', label: 'Visual Art' },
  { key: 'performing_arts', label: 'Performing Arts' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, fetchUser } = useAuthStore();
  const [form, setForm] = useState({
    username: '',
    firstName: '',
    lastName: '',
    headline: '',
    statement: '',
  });
  const [dims, setDims] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Prefill from the register step's stashed fields.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('pendingProfile');
      if (raw) {
        const p = JSON.parse(raw);
        setForm((f) => ({
          ...f,
          username: p.username || f.username,
          firstName: p.firstName || f.firstName,
          lastName: p.lastName || f.lastName,
        }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Route people who don't belong here.
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login');
    } else if (user && !user.isNewUser) {
      router.replace('/dashboard');
    } else {
      setReady(true);
    }
  }, [isLoading, isAuthenticated, user, router]);

  const toggleDim = (k: string) =>
    setDims((d) => (d.includes(k) ? d.filter((x) => x !== k) : [...d, k]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.username.trim().length < 3) {
      setError('Please choose a username (at least 3 characters).');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/auth/onboarding', {
        username: form.username.trim(),
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        artDimensions: dims,
        headline: form.headline.trim() || undefined,
        statement: form.statement.trim() || undefined,
      });
      localStorage.removeItem('pendingProfile');
      await fetchUser();
      router.replace('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Could not complete onboarding. Please try again.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#faf7f2] p-10 text-center text-neutral-600">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] px-4 py-12 text-neutral-900">
      <div className="mx-auto max-w-xl">
        <p className="text-xs uppercase tracking-[0.35em] text-[#202f9a]">Welcome</p>
        <h1 className="mt-2 font-serif text-4xl">Complete your artist profile</h1>
        <p className="mt-2 text-neutral-600">
          A few details so collectors and curators can find your work.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Username *</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-[#202f9a] focus:ring-2 focus:ring-[#202f9a]/30"
              placeholder="yourhandle"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">First name</label>
              <input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-[#202f9a] focus:ring-2 focus:ring-[#202f9a]/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Last name</label>
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-[#202f9a] focus:ring-2 focus:ring-[#202f9a]/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Your art dimensions</label>
            <div className="flex flex-wrap gap-2">
              {DIMENSIONS.map((d) => {
                const on = dims.includes(d.key);
                return (
                  <button
                    type="button"
                    key={d.key}
                    onClick={() => toggleDim(d.key)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      on
                        ? 'border-[#202f9a] bg-[#202f9a] text-white'
                        : 'border-neutral-300 text-neutral-700 hover:border-[#202f9a]'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Headline</label>
            <input
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              maxLength={120}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-[#202f9a] focus:ring-2 focus:ring-[#202f9a]/30"
              placeholder="e.g. Contemporary miniature painter from Jaipur"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">About your practice</label>
            <textarea
              value={form.statement}
              onChange={(e) => setForm({ ...form, statement: e.target.value })}
              maxLength={2000}
              rows={4}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-[#202f9a] focus:ring-2 focus:ring-[#202f9a]/30"
              placeholder="Tell your story…"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-[#0b1f52] py-3 text-sm font-semibold text-white transition hover:bg-[#202f9a] disabled:opacity-60"
          >
            {saving ? 'Setting up…' : 'Enter KalaCUBE'}
          </button>
        </form>
      </div>
    </main>
  );
}
