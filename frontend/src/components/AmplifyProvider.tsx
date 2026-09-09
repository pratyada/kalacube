'use client';

// Importing this module runs configureAmplify() as a side effect.
import '@/lib/amplify';

export default function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
