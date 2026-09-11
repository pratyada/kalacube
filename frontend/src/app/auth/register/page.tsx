'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp, confirmSignUp } from 'aws-amplify/auth';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

const ROLES = [
  {
    value: 'artist',
    label: 'Artist',
    desc: 'Showcase your work, build your portfolio, and grow your audience.',
  },
  {
    value: 'user',
    label: 'Guest',
    desc: 'Explore art, discover artists, and follow the work you love.',
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { loginWithEmail } = useAuthStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<'artist' | 'user'>('artist');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
  });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const field =
    'w-full rounded-lg border border-neutral-300 px-3 py-2.5 outline-none focus:border-[#202f9a] focus:ring-2 focus:ring-[#202f9a]/25';

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp({
        username: form.email,
        password: form.password,
        options: {
          userAttributes: {
            email: form.email,
            given_name: form.firstName,
            family_name: form.lastName,
          },
        },
      });
      setStep(3); // email confirmation code
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmSignUp({ username: form.email, confirmationCode: code });
      // Auto sign in, then create the Mongo profile in one step — no separate
      // onboarding screen.
      await loginWithEmail(form.email, form.password);
      await api.post('/api/auth/onboarding', {
        username: form.username,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        role,
      });
      await useAuthStore.getState().fetchUser();
      router.push('/dashboard');
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Invalid confirmation code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex justify-center" aria-label="KalaCUBE — Art Lives Here">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-primary.png" alt="KalaCUBE" width={547} height={451} className="h-16 w-auto" />
          </Link>
          <p className="mt-3 text-muted">
            {step === 1
              ? 'Join KalaCUBE'
              : step === 2
                ? 'Create your account'
                : 'Confirm your email'}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm sm:p-8">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="mb-1 text-center text-sm text-neutral-500">
                How do you want to join?
              </p>
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => {
                    setRole(r.value as 'artist' | 'user');
                    setStep(2);
                  }}
                  className="w-full rounded-xl border border-neutral-200 p-4 text-left transition hover:border-[#202f9a] hover:bg-[#eef1ff]"
                >
                  <div className="font-semibold text-neutral-900">{r.label}</div>
                  <div className="mt-0.5 text-sm text-neutral-500">{r.desc}</div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-neutral-500 hover:text-neutral-800"
              >
                &larr; {ROLES.find((r) => r.value === role)?.label}
              </button>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                  placeholder="First name"
                  className={field}
                />
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Last name"
                  className={field}
                />
              </div>

              <input
                type="text"
                value={form.username}
                onChange={(e) =>
                  setForm({
                    ...form,
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                  })
                }
                required
                placeholder="Choose a username"
                className={field}
              />

              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="you@example.com"
                className={field}
              />

              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
                placeholder="Password (min 8 characters)"
                className={field}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#0b1f52] py-2.5 font-semibold text-white transition hover:bg-[#202f9a] disabled:opacity-50"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <p className="text-sm text-neutral-600">
                We sent a 6-digit code to{' '}
                <span className="font-medium">{form.email}</span>. Enter it to
                finish — we&apos;ll set everything up for you.
              </p>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                placeholder="Confirmation code"
                className={field}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#0b1f52] py-2.5 font-semibold text-white transition hover:bg-[#202f9a] disabled:opacity-50"
              >
                {loading ? 'Setting up…' : 'Confirm & enter KalaCUBE'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-[#202f9a] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
