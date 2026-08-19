'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTokens } from '@/lib/api';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!getTokens()) {
      router.replace('/login');
    }
  }, [router]);

  if (!getTokens()) return null;
  return <>{children}</>;
}
