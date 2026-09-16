'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import ShareArtistPage from '@/components/ShareArtistPage';

const DIMENSIONS = [
  { key: 'visual_art', label: 'Visual Art', color: 'var(--orange)' },
  { key: 'handicraft', label: 'Handicraft', color: 'var(--teal)' },
  { key: 'performing_arts', label: 'Performing Arts', color: 'var(--magenta)' },
];

type Step = 0 | 1 | 2;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, fetchUser } = useAuthStore();

  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [dims, setDims] = useState<string[]>([]);
  const [headline, setHeadline] = useState('');
  const [statement, setStatement] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Route people who don't belong here; prefill from any existing artist profile.
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace('/auth/login');
      return;
    }
    if (user.isNewUser) {
      // Verified Cognito user without a Mongo profile — shouldn't happen after
      // register, but send them back to finish sign-up cleanly.
      router.replace('/auth/register');
      return;
    }
    if (user.role !== 'artist') {
      router.replace('/dashboard');
      return;
    }
    setReady(true);
    api
      .get(`/api/users/${user.username}/artist-profile`)
      .then((res) => {
        const p = res.data?.data;
        if (p) {
          setDims(p.artDimensions || []);
          setHeadline(p.headline || '');
          setStatement(p.statement || '');
        }
      })
      .catch(() => {});
  }, [isLoading, isAuthenticated, user, router]);

  const username = user?.username || '';

  const toggleDim = (k: string) =>
    setDims((d) => (d.includes(k) ? d.filter((x) => x !== k) : [...d, k]));

  const saveDims = async () => {
    if (!username || dims.length === 0) return;
    await api.put(`/api/users/${username}/artist-profile`, {
      artDimensions: dims,
    });
  };

  const saveAbout = async () => {
    if (!username) return;
    const h = headline.trim();
    const s = statement.trim();
    if (!h && !s) return;
    await api.put(`/api/users/${username}/artist-profile`, {
      headline: h || undefined,
      statement: s || undefined,
    });
    // Mirror the statement to the user bio so profile completeness reflects it.
    if (s) {
      await api.patch(`/api/users/${username}`, { bio: s });
    }
  };

  const advance = async (persist: () => Promise<void>) => {
    setError('');
    setSaving(true);
    try {
      await persist();
      await fetchUser();
      setStep((s) => (s + 1) as Step);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message || 'Could not save. Please try again.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  const progress = useMemo(() => ((step + 1) / 3) * 100, [step]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream text-muted">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-10 text-navy-deep">
      <div className="mx-auto w-full max-w-xl">
        {/* Header + progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo">
              {step === 2 ? 'You’re live' : `Step ${step + 1} of 3`}
            </p>
            {step < 2 && (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted transition hover:text-navy"
              >
                Skip for now →
              </Link>
            )}
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-navy/10">
            <motion.div
              className="h-full rounded-full bg-yellow"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1 — Art dimensions */}
          {step === 0 && (
            <motion.section
              key="dims"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="font-serif text-3xl sm:text-4xl">
                What kind of art do you make?
              </h1>
              <p className="mt-2 text-muted">
                Pick one or more. This helps collectors and curators find you.
              </p>

              <div className="mt-6 grid gap-3">
                {DIMENSIONS.map((d) => {
                  const on = dims.includes(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => toggleDim(d.key)}
                      aria-pressed={on}
                      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition ${
                        on
                          ? 'border-[color:var(--navy)] bg-white shadow-sm'
                          : 'border-line bg-white/60 hover:border-navy/40'
                      }`}
                    >
                      <span
                        className="h-4 w-4 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="font-semibold text-navy">{d.label}</span>
                      <span className="ml-auto">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border text-white transition ${
                            on
                              ? 'border-navy bg-navy'
                              : 'border-line bg-transparent'
                          }`}
                        >
                          {on ? '✓' : ''}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => advance(saveDims)}
                  className="flex-1 rounded-full bg-navy py-3 text-sm font-semibold text-white transition hover:bg-indigo disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Continue'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setStep(1)}
                  className="rounded-full px-4 py-3 text-sm font-medium text-muted transition hover:text-navy"
                >
                  Do this later
                </button>
              </div>
            </motion.section>
          )}

          {/* STEP 2 — Headline + statement */}
          {step === 1 && (
            <motion.section
              key="about"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="font-serif text-3xl sm:text-4xl">
                Introduce your practice
              </h1>
              <p className="mt-2 text-muted">
                A one-line headline and a short statement bring your page to
                life. You can refine these anytime.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="headline"
                    className="mb-1 block text-sm font-medium text-navy"
                  >
                    Headline
                  </label>
                  <input
                    id="headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    maxLength={120}
                    placeholder="e.g. Contemporary miniature painter from Jaipur"
                    className="w-full rounded-lg border border-line bg-white px-3 py-2.5 outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/25"
                  />
                </div>

                <div>
                  <label
                    htmlFor="statement"
                    className="mb-1 block text-sm font-medium text-navy"
                  >
                    About your practice
                  </label>
                  <textarea
                    id="statement"
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    maxLength={2000}
                    rows={5}
                    placeholder="Tell your story — your materials, themes, and what drives your work…"
                    className="w-full rounded-lg border border-line bg-white px-3 py-2.5 outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/25"
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="rounded-full px-4 py-3 text-sm font-medium text-muted transition hover:text-navy"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => advance(saveAbout)}
                  className="flex-1 rounded-full bg-navy py-3 text-sm font-semibold text-white transition hover:bg-indigo disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Continue'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setStep(2)}
                  className="rounded-full px-4 py-3 text-sm font-medium text-muted transition hover:text-navy"
                >
                  Skip
                </button>
              </div>
            </motion.section>
          )}

          {/* STEP 3 — Live! */}
          {step === 2 && (
            <motion.section
              key="live"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-2xl border border-line bg-navy p-6 text-white sm:p-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow text-2xl text-navy"
                aria-hidden
              >
                ✓
              </motion.div>
              <h1 className="mt-4 text-center font-serif text-3xl sm:text-4xl">
                Your page is live!
              </h1>
              <p className="mt-2 text-center text-white/70">
                Share your KalaCUBE page with the world — then add your first
                artwork to make it shine.
              </p>

              <div className="mt-6">
                <ShareArtistPage username={username} variant="navy" />
              </div>

              <Link
                href="/dashboard/upload"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-yellow bg-yellow px-4 py-3 text-sm font-semibold text-navy transition hover:bg-yellow-deep"
              >
                Upload your first artwork
              </Link>

              <Link
                href="/dashboard"
                className="mt-3 block text-center text-sm font-medium text-white/70 transition hover:text-white"
              >
                Go to my dashboard →
              </Link>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
