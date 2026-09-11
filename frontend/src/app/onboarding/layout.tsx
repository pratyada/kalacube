import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Set up your profile',
  description: 'Complete your KalaCUBE artist profile to start showcasing your work.',
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
