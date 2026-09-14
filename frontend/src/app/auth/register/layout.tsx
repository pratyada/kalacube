import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create your account',
  description: 'Create your KalaCUBE account to showcase your work and connect with India’s art community.',
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
