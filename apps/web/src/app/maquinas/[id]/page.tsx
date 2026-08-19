'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  AreaIntervencion,
  EtapaImagen,
  MaquinaDto,
  TipoIntervencion,
} from '@retimax/shared-types';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { apiFetch, imageUrl } from '@/lib/api';
import {
  AREA_LABELS,
  ESTADO_COLORS,
  ESTADO_LABELS,
  NEXT_ESTADOS,
  TIPO_INTERVENCION_LABELS,
} from '@/lib/labels';

export default function MaquinaDetailPage() {
  const params = useParams<{ id: string }>();
  const [maquina, setMaquina] = useState<MaquinaDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [tipo, setTipo] = useState<TipoIntervencion>('DIAGNOSTICO_INICIAL');
  const [area, setArea] = useState<AreaIntervencion>('MECANICA');
  const [descripcion, setDescripcion] = useState('');
  const [responsable, setResponsable] = useState('');
  const [etapa, setEtapa] = useState<EtapaImagen>('EMBARQUE');
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<MaquinaDto>(`/maquinas/${params.id}`);
      setMaquina(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function changeEstado(nuevoEstado: string) {
    setError('');
    try {
      const updated = await apiFetch<MaquinaDto>(`/maquinas/${params.id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      setMaquina(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  }

  async function submitIntervencion(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await apiFetch(`/maquinas/${params.id}/intervenciones`, {
        method: 'POST',
        body: JSON.stringify({ tipo, area, descripcion, responsable }),
      });
      setDescripcion('');
      setResponsable('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar intervención');
    }
  }

  async function uploadImage(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('etapa', etapa);
      await apiFetch(`/maquinas/${params.id}/imagenes`, { method: 'POST', body: form });
      setFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen');
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <AppShell>
          <p className="text-[#6c757d]">Cargando...</p>
        </AppShell>
      </AuthGuard>
    );
  }

  if (!maquina) return null;

  const nextEstados = NEXT_ESTADOS[maquina.estado] ?? [];

  return (
    <AuthGuard>
      <AppShell>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="rounded-xl bg-white border p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{maquina.nombre}</h2>
                <p className="text-[#6c757d]">{maquina.tipo}</p>
              </div>
              <span
                className={`text-sm text-white px-3 py-1 rounded-full ${ESTADO_COLORS[maquina.estado]}`}
              >
                {ESTADO_LABELS[maquina.estado]}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <p>
                <span className="text-[#6c757d]">Proveedor:</span> {maquina.proveedor?.nombre}
              </p>
              <p>
                <span className="text-[#6c757d]">Registrada por:</span>{' '}
                {maquina.creadoPor?.nombre}
              </p>
              {maquina.descripcionLlegada && (
                <p className="md:col-span-2">
                  <span className="text-[#6c757d]">Descripción llegada:</span>{' '}
                  {maquina.descripcionLlegada}
                </p>
              )}
            </div>
            {nextEstados.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {nextEstados.map((estado) => (
                  <button
                    key={estado}
                    onClick={() => changeEstado(estado)}
                    className="rounded-lg bg-[#1a1a1a] text-white px-4 py-2 text-sm hover:bg-black"
                  >
                    → {ESTADO_LABELS[estado]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl bg-white border p-6">
              <h3 className="font-semibold mb-4">Subir imagen</h3>
              <form onSubmit={uploadImage} className="space-y-3">
                <select
                  value={etapa}
                  onChange={(e) => setEtapa(e.target.value as EtapaImagen)}
                  className="w-full rounded-lg border px-3 py-2"
                >
                  <option value="EMBARQUE">Embarque</option>
                  <option value="LLEGADA">Llegada</option>
                  <option value="OTRA">Otra</option>
                </select>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm"
                />
                <button
                  type="submit"
                  disabled={!file}
                  className="rounded-lg bg-[#f5c842] px-4 py-2 font-semibold text-sm disabled:opacity-50"
                >
                  Subir
                </button>
              </form>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {maquina.imagenes?.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img.id}
                    src={imageUrl(img.thumbnailUrl)}
                    alt={img.etapa}
                    className="rounded-lg object-cover h-24 w-full"
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white border p-6">
              <h3 className="font-semibold mb-4">Nueva intervención</h3>
              <form onSubmit={submitIntervencion} className="space-y-3">
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoIntervencion)}
                  className="w-full rounded-lg border px-3 py-2"
                >
                  {Object.entries(TIPO_INTERVENCION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value as AreaIntervencion)}
                  className="w-full rounded-lg border px-3 py-2"
                >
                  {Object.entries(AREA_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <input
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  placeholder="Responsable (trabajador)"
                  className="w-full rounded-lg border px-3 py-2"
                  required
                />
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción"
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2"
                  required
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#f5c842] px-4 py-2 font-semibold text-sm"
                >
                  Registrar (inmutable)
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-xl bg-white border p-6">
            <h3 className="font-semibold mb-4">Historial de intervenciones (auditoría)</h3>
            {!maquina.intervenciones?.length ? (
              <p className="text-[#6c757d] text-sm">Sin intervenciones registradas</p>
            ) : (
              <div className="space-y-4">
                {maquina.intervenciones.map((i) => (
                  <div key={i.id} className="border-l-4 border-[#f5c842] pl-4 py-1">
                    <div className="flex flex-wrap gap-2 text-xs text-[#6c757d]">
                      <span>{new Date(i.createdAt).toLocaleString('es-BO')}</span>
                      <span>•</span>
                      <span>{TIPO_INTERVENCION_LABELS[i.tipo]}</span>
                      <span>•</span>
                      <span>{AREA_LABELS[i.area]}</span>
                    </div>
                    <p className="mt-1">{i.descripcion}</p>
                    <p className="text-sm text-[#6c757d] mt-1">
                      Responsable: {i.responsable} — Registrado por: {i.registradoPor.nombre}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
