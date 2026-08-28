'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Rol } from '@retimax/shared-types';
import { getTokens, getUser } from '@/lib/api';

export function AuthGuard({
  children,
  adminOnly,
  empleadoOnly,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
  empleadoOnly?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!getTokens()) {
      router.replace('/login');
      return;
    }
    const user = getUser<{ rol: Rol }>();
    if (adminOnly && user?.rol !== Rol.ADMIN) {
      router.replace('/mis-trabajos');
      return;
    }
    if (empleadoOnly && user?.rol !== Rol.EMPLEADO) {
      router.replace('/dashboard');
    }
  }, [router, adminOnly, empleadoOnly]);

  if (!getTokens()) return null;
  return <>{children}</>;
}
