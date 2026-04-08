'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-gray-900">
            kala<span className="text-rose-500">CUBE</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-8">
          {sent ? (
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">Check your email</h2>
              <p className="text-gray-500 text-sm">
                If an account exists with that email, we&apos;ve sent a password
                reset link.
              </p>
              <Link
                href="/auth/login"
                className="mt-4 inline-block text-rose-500 font-medium"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-2">Reset your password</h2>
              <p className="text-gray-500 text-sm mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  placeholder="you@example.com"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-rose-500 text-white py-2.5 rounded-lg font-semibold hover:bg-rose-600 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
