'use client';

import { Suspense } from 'react';
import MaquinasPage from './MaquinasList';

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8 text-[#6c757d]">Cargando...</p>}>
      <MaquinasPage />
    </Suspense>
  );
}
