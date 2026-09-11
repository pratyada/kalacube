'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp, confirmSignUp } from 'aws-amplify/auth';
import { useAuthStore } from '@/stores/authStore';

const ROLES = [
  {
    value: 'artist',
    label: 'Artist',
    desc: 'Showcase your art and connect with the community',
  },
  {
    value: 'curator',
    label: 'Curator',
    desc: 'Discover and promote talented artists',
  },
  {
    value: 'art-space',
    label: 'Art Space',
    desc: 'List your gallery and host exhibitions',
  },
  {
    value: 'user',
    label: 'Art Enthusiast',
    desc: 'Explore art, attend events, and follow artists',
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { loginWithGoogle } = useAuthStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    dob: '',
    phone: '',
  });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const stashProfile = () => {
    // Non-Cognito profile fields — used to seed the Mongo profile at onboarding.
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'pendingProfile',
        JSON.stringify({
          role,
          username: form.username,
          dob: form.dob,
          phone: form.phone,
          firstName: form.firstName,
          lastName: form.lastName,
        }),
      );
    }
  };

  const handleGoogle = async () => {
    setError('');
    stashProfile();
    try {
      await loginWithGoogle();
    } catch {
      setError('Could not start Google sign-up. Please try again.');
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const dob = new Date(form.dob);
    const age = Math.floor(
      (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    );
    if (age < 18) {
      setError('You must be at least 18 years old to join kalaCUBE');
      return;
    }

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
      stashProfile();
      setStep(3); // email confirmation code
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
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
      router.push('/auth/login');
    } catch (err: any) {
      setError(err?.message || 'Invalid confirmation code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center" aria-label="KalaCUBE — Art Lives Here">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-primary.png" alt="KalaCUBE" width={547} height={451} className="h-16 w-auto" />
          </Link>
          <p className="text-muted mt-3">
            {step === 1
              ? 'Choose your role'
              : step === 2
                ? 'Create your account'
                : 'Confirm your email'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => {
                    setRole(r.value);
                    setStep(2);
                  }}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 transition"
                >
                  <div className="font-semibold text-gray-900">{r.label}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
                  <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
                </svg>
                Sign up with Google
              </button>

              <div className="my-6 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    or use your email
                  </span>
                </div>
              </div>

              <form onSubmit={handleEmailSignup} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  &larr; Change role (
                  {ROLES.find((r) => r.value === role)?.label})
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    required
                    placeholder="First name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  />
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    required
                    placeholder="Last name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  />
                </div>

                <input
                  type="text"
                  value={form.username}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      username: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, ''),
                    })
                  }
                  required
                  placeholder="username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />

                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />

                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />

                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  minLength={8}
                  placeholder="Password (min 8 characters)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-rose-500 text-white py-2.5 rounded-lg font-semibold hover:bg-rose-600 transition disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <p className="text-sm text-gray-600">
                We sent a confirmation code to{' '}
                <span className="font-medium">{form.email}</span>. Enter it
                below to finish creating your account.
              </p>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                placeholder="Confirmation code"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-500 text-white py-2.5 rounded-lg font-semibold hover:bg-rose-600 transition disabled:opacity-50"
              >
                {loading ? 'Confirming...' : 'Confirm & Continue'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="text-rose-500 font-medium hover:text-rose-600"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
