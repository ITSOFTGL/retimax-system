'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { EstadoMaquina, MaquinaDto } from '@retimax/shared-types';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { apiFetch, imageUrl } from '@/lib/api';
import { ESTADO_COLORS, ESTADO_LABELS } from '@/lib/labels';

export default function MaquinasList() {
  const searchParams = useSearchParams();
  const estadoFilter = searchParams.get('estado') as EstadoMaquina | null;
  const [maquinas, setMaquinas] = useState<MaquinaDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = estadoFilter ? `?estado=${estadoFilter}` : '';
    apiFetch<MaquinaDto[]>(`/maquinas${query}`)
      .then(setMaquinas)
      .finally(() => setLoading(false));
  }, [estadoFilter]);

  return (
    <AuthGuard adminOnly>
      <AppShell>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Máquinas</h2>
              {estadoFilter && (
                <p className="text-[#6c757d]">Filtrado: {ESTADO_LABELS[estadoFilter]}</p>
              )}
            </div>
            <Link
              href="/maquinas/nueva"
              className="rounded-lg bg-[#f5c842] px-5 py-2.5 font-semibold text-[#1a1a1a]"
            >
              + Registrar máquina
            </Link>
          </div>

          {loading ? (
            <p className="text-[#6c757d]">Cargando...</p>
          ) : maquinas.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center border">
              <p className="text-[#6c757d]">No hay máquinas registradas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {maquinas.map((m) => {
                const thumb = m.imagenes?.[0]?.thumbnailUrl;
                return (
                  <Link
                    key={m.id}
                    href={`/maquinas/${m.id}`}
                    className="rounded-xl bg-white border overflow-hidden hover:shadow-md transition"
                  >
                    <div className="h-40 bg-gray-100 flex items-center justify-center">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl(thumb)}
                          alt={m.nombre}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[#6c757d] text-sm">Sin imagen</span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{m.nombre}</h3>
                        <span
                          className={`shrink-0 text-xs text-white px-2 py-1 rounded-full ${ESTADO_COLORS[m.estado]}`}
                        >
                          {ESTADO_LABELS[m.estado]}
                        </span>
                      </div>
                      <p className="text-sm text-[#6c757d] mt-1">{m.tipo}</p>
                      <p className="text-xs text-[#6c757d] mt-2">
                        {m.proveedor?.nombre ?? '—'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
