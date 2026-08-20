'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  AreaIntervencion,
  EtapaImagen,
  EstadoMaquina,
  MaquinaDto,
  TipoIntervencion,
} from '@retimax/shared-types';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { AudioNoteRecorder } from '@/components/AudioNoteRecorder';
import { EstadoPipeline } from '@/components/EstadoPipeline';
import { ImagePicker } from '@/components/ImagePicker';
import { apiFetch, imageUrl } from '@/lib/api';
import {
  AREA_LABELS,
  ESTADO_COLORS,
  ESTADO_LABELS,
  ETAPA_LABELS,
  groupImagenesPorEtapa,
  TIPO_INTERVENCION_LABELS,
} from '@/lib/labels';

function GaleriaFotos({ maquina }: { maquina: MaquinaDto }) {
  const imagenesPorEtapa = groupImagenesPorEtapa(maquina.imagenes ?? []);
  const entries = Object.entries(imagenesPorEtapa);
  if (!entries.length) {
    return <p className="text-[#6c757d] text-sm">Sin fotos registradas</p>;
  }
  return (
    <div className="space-y-4">
      {entries.map(([etapa, imgs]) => (
        <div key={etapa}>
          <h4 className="text-sm font-medium text-[#6c757d] mb-2">
            {ETAPA_LABELS[etapa] ?? etapa} ({imgs.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {imgs.map((img) => (
              <a key={img.id} href={imageUrl(img.url)} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl(img.thumbnailUrl)}
                  alt={etapa}
                  className="rounded-lg object-cover h-24 w-full hover:opacity-90"
                />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MaquinaDetailPage() {
  const params = useParams<{ id: string }>();
  const [maquina, setMaquina] = useState<MaquinaDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [fechaDespacho, setFechaDespacho] = useState('');
  const [fechaLlegadaEst, setFechaLlegadaEst] = useState('');
  const [fechaRecibida, setFechaRecibida] = useState('');

  const [recepcionDesc, setRecepcionDesc] = useState('');
  const [empleadoDiagnostico, setEmpleadoDiagnostico] = useState('');
  const [fotosLlegada, setFotosLlegada] = useState<File[]>([]);

  const [diagMecanica, setDiagMecanica] = useState('');
  const [diagElectrica, setDiagElectrica] = useState('');
  const [diagPintado, setDiagPintado] = useState('');
  const [diagMantenimiento, setDiagMantenimiento] = useState('');
  const [responsableDiag, setResponsableDiag] = useState('');
  const [requiereMantenimiento, setRequiereMantenimiento] = useState(true);

  const [precioUsd, setPrecioUsd] = useState('');
  const [tipoCambio, setTipoCambio] = useState('');
  const [precioBob, setPrecioBob] = useState('');

  const [tipo, setTipo] = useState<TipoIntervencion>(TipoIntervencion.TRABAJO_REALIZADO);
  const [area, setArea] = useState<AreaIntervencion>(AreaIntervencion.MECANICA);
  const [descripcion, setDescripcion] = useState('');
  const [responsable, setResponsable] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<MaquinaDto>(`/maquinas/${params.id}`);
      setMaquina(data);
      setRecepcionDesc(data.descripcionLlegada ?? '');
      setEmpleadoDiagnostico(data.empleadoDiagnostico ?? '');
      setFechaDespacho(data.fechaDespacho?.slice(0, 10) ?? '');
      setFechaLlegadaEst(data.fechaLlegadaEstimada?.slice(0, 10) ?? '');
      setFechaRecibida(data.fechaLlegadaReal?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
      setPrecioUsd(data.precioVentaUsd ?? '');
      setTipoCambio(data.tipoCambioUsado ?? '');
      setPrecioBob(data.precioVentaBob ?? '');
      if (data.empleadoDiagnostico) setResponsableDiag(data.empleadoDiagnostico);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function uploadPhotos(etapa: EtapaImagen, files: File[]) {
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      files.forEach((f) => form.append('files', f));
      form.append('etapa', etapa);
      await apiFetch(`/maquinas/${params.id}/imagenes/lote`, { method: 'POST', body: form });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir fotos');
      throw err;
    } finally {
      setUploading(false);
    }
  }

  async function handleTransito(e: FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const updated = await apiFetch<MaquinaDto>(`/maquinas/${params.id}/transito`, {
        method: 'POST',
        body: JSON.stringify({
          fechaDespacho,
          fechaLlegadaEstimada: fechaLlegadaEst || undefined,
        }),
      });
      setMaquina(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar tránsito');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmarRecibida() {
    setActionLoading(true);
    setError('');
    try {
      const updated = await apiFetch<MaquinaDto>(`/maquinas/${params.id}/recibida`, {
        method: 'POST',
        body: JSON.stringify({ fechaLlegadaReal: fechaRecibida || undefined }),
      });
      setMaquina(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar recibida');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRecepcion(e: FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('descripcionLlegada', recepcionDesc);
      form.append('empleadoDiagnostico', empleadoDiagnostico);
      if (fechaRecibida) form.append('fechaLlegadaReal', fechaRecibida);
      fotosLlegada.forEach((f) => form.append('files', f));
      const updated = await apiFetch<MaquinaDto>(`/maquinas/${params.id}/recepcion`, {
        method: 'POST',
        body: form,
      });
      setMaquina(updated);
      setFotosLlegada([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar recepción');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCompletarDiagnostico(e: FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const updated = await apiFetch<MaquinaDto>(`/maquinas/${params.id}/diagnostico/completar`, {
        method: 'POST',
        body: JSON.stringify({
          responsable: responsableDiag,
          mecanica: diagMecanica || undefined,
          electrica: diagElectrica || undefined,
          pintado: diagPintado || undefined,
          mantenimiento: diagMantenimiento || undefined,
          requiereMantenimiento,
        }),
      });
      setMaquina(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al completar diagnóstico');
    } finally {
      setActionLoading(false);
    }
  }

  async function savePrecio(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const updated = await apiFetch<MaquinaDto>(`/maquinas/${params.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          precioVentaUsd: precioUsd,
          tipoCambioUsado: tipoCambio,
          precioVentaBob: precioBob,
        }),
      });
      setMaquina(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar precio');
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

  async function avanzarEstado(nuevoEstado: EstadoMaquina) {
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

  const estado = maquina.estado;
  const acordada = maquina.descripcionAcordada ?? maquina.descripcionLlegada;

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
                <span className="text-[#6c757d]">Registrada por:</span> {maquina.creadoPor?.nombre}
              </p>
              {maquina.fechaDespacho && (
                <p>
                  <span className="text-[#6c757d]">Despacho:</span>{' '}
                  {new Date(maquina.fechaDespacho).toLocaleDateString('es-BO')}
                </p>
              )}
              {maquina.fechaLlegadaReal && (
                <p>
                  <span className="text-[#6c757d]">Llegada:</span>{' '}
                  {new Date(maquina.fechaLlegadaReal).toLocaleDateString('es-BO')}
                </p>
              )}
              {maquina.empleadoDiagnostico && (
                <p>
                  <span className="text-[#6c757d]">Diagnóstico asignado a:</span>{' '}
                  {maquina.empleadoDiagnostico}
                </p>
              )}
            </div>
          </div>

          <EstadoPipeline estadoActual={estado} />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {estado === EstadoMaquina.COMPRADA_ITALIA && (
            <div className="rounded-xl bg-white border p-6 space-y-4">
              <h3 className="font-semibold text-lg">Compra en Italia — registro inicial</h3>
              {acordada && (
                <div>
                  <p className="text-sm font-medium text-[#6c757d] mb-1">Qué debería traer (acordado)</p>
                  <p className="text-sm whitespace-pre-wrap">{acordada}</p>
                </div>
              )}
              <AudioNoteRecorder
                maquinaId={maquina.id}
                audioUrl={maquina.notaAudioUrl}
                onUploaded={() => load()}
              />
              <GaleriaFotos maquina={maquina} />
              <ImagePicker
                label="Agregar fotos de embarque"
                disabled={uploading}
                onUpload={(files) => uploadPhotos(EtapaImagen.EMBARQUE, files)}
                uploading={uploading}
              />
              <form onSubmit={handleTransito} className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-3">
                <p className="text-sm font-medium">Álvaro: confirmar despacho → En tránsito</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1">Fecha de salida / despacho *</label>
                    <input
                      type="date"
                      value={fechaDespacho}
                      onChange={(e) => setFechaDespacho(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Llegada estimada (opcional)</label>
                    <input
                      type="date"
                      value={fechaLlegadaEst}
                      onChange={(e) => setFechaLlegadaEst(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-[#1a1a1a] text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Guardando...' : 'Confirmar despacho — pasar a En tránsito'}
                </button>
              </form>
            </div>
          )}

          {estado === EstadoMaquina.EN_TRANSITO && (
            <div className="rounded-xl bg-white border p-6 space-y-4">
              <h3 className="font-semibold text-lg">En tránsito</h3>
              <p className="text-sm text-[#6c757d]">
                La máquina va en camino. Cuando llegue al taller, marca como recibida para que Cesia
                verifique contra lo acordado.
              </p>
              {acordada && (
                <div className="rounded-lg bg-gray-50 p-3 text-sm">
                  <p className="font-medium mb-1">Lo acordado en Italia:</p>
                  <p className="whitespace-pre-wrap">{acordada}</p>
                </div>
              )}
              {maquina.fechaDespacho && (
                <p className="text-sm">
                  Despachada el {new Date(maquina.fechaDespacho).toLocaleDateString('es-BO')}
                </p>
              )}
              <GaleriaFotos maquina={maquina} />
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-sm mb-1">Fecha de llegada al taller</label>
                  <input
                    type="date"
                    value={fechaRecibida}
                    onChange={(e) => setFechaRecibida(e.target.value)}
                    className="rounded-lg border px-3 py-2"
                  />
                </div>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmarRecibida}
                  className="rounded-lg bg-cyan-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading ? '...' : '✓ Marcar recibida en taller'}
                </button>
              </div>
            </div>
          )}

          {estado === EstadoMaquina.RECIBIDA && (
            <div className="rounded-xl bg-cyan-50 border-2 border-cyan-300 p-6 space-y-4">
              <h3 className="font-semibold text-lg">Recepción — Cesia verifica cómo llegó</h3>
              {acordada && (
                <div className="rounded-lg bg-white p-3 text-sm border">
                  <p className="font-medium mb-1">Lo que debería traer (Italia):</p>
                  <p className="whitespace-pre-wrap">{acordada}</p>
                </div>
              )}
              <form onSubmit={handleRecepcion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Cómo llegó realmente (breve descripción)
                  </label>
                  <textarea
                    value={recepcionDesc}
                    onChange={(e) => setRecepcionDesc(e.target.value)}
                    rows={3}
                    placeholder="Ej: Llegó con plato, sin garras. Bomba de agua dañada..."
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Asignar diagnóstico a (trabajador) *
                  </label>
                  <input
                    value={empleadoDiagnostico}
                    onChange={(e) => setEmpleadoDiagnostico(e.target.value)}
                    placeholder="Nombre del mecánico / electricista"
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                </div>
                <ImagePicker
                  label="Fotos de llegada (máx. 10)"
                  files={fotosLlegada}
                  onChange={setFotosLlegada}
                  disabled={actionLoading}
                />
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-[#1a1a1a] text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading
                    ? 'Guardando...'
                    : 'Confirmar recepción → pasar a Diagnóstico automáticamente'}
                </button>
              </form>
            </div>
          )}

          {estado === EstadoMaquina.EN_DIAGNOSTICO && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-6 space-y-4">
              <h3 className="font-semibold text-lg">Diagnóstico inicial</h3>
              <p className="text-sm text-[#6c757d]">
                El trabajador asignado ({maquina.empleadoDiagnostico ?? 'sin asignar'}) completa el
                informe. Si falta algo o hay trabajo → mantenimiento; si todo está bien → lista para
                venta.
              </p>
              {maquina.descripcionLlegada && (
                <div className="rounded-lg bg-white p-3 text-sm border">
                  <p className="font-medium mb-1">Notas de recepción:</p>
                  <p>{maquina.descripcionLlegada}</p>
                </div>
              )}
              <GaleriaFotos maquina={maquina} />
              <form onSubmit={handleCompletarDiagnostico} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Mecánica</label>
                    <textarea
                      value={diagMecanica}
                      onChange={(e) => setDiagMecanica(e.target.value)}
                      rows={3}
                      placeholder="Rodamientos, eje, lubricación..."
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Eléctrica</label>
                    <textarea
                      value={diagElectrica}
                      onChange={(e) => setDiagElectrica(e.target.value)}
                      rows={3}
                      placeholder="Motor, cableado, tablero..."
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pintado</label>
                    <textarea
                      value={diagPintado}
                      onChange={(e) => setDiagPintado(e.target.value)}
                      rows={3}
                      placeholder="Pintura, chapería..."
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Mantenimiento / piezas</label>
                    <textarea
                      value={diagMantenimiento}
                      onChange={(e) => setDiagMantenimiento(e.target.value)}
                      rows={3}
                      placeholder="Piezas faltantes, fabricación..."
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Responsable del diagnóstico *</label>
                  <input
                    value={responsableDiag}
                    onChange={(e) => setResponsableDiag(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={requiereMantenimiento}
                    onChange={(e) => setRequiereMantenimiento(e.target.checked)}
                  />
                  Requiere mantenimiento / reparación antes de vender
                </label>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-[#f5c842] px-4 py-2 font-semibold text-sm disabled:opacity-50"
                >
                  {actionLoading
                    ? 'Guardando...'
                    : requiereMantenimiento
                      ? 'Completar → pasar a Mantenimiento'
                      : 'Completar → pasar a Lista para venta'}
                </button>
              </form>
            </div>
          )}

          {estado === EstadoMaquina.EN_MANTENIMIENTO && (
            <div className="rounded-xl bg-white border p-6 space-y-4">
              <h3 className="font-semibold text-lg">Mantenimiento en curso</h3>
              <GaleriaFotos maquina={maquina} />
              <ImagePicker
                label="Fotos del trabajo"
                disabled={uploading}
                onUpload={(files) => uploadPhotos(EtapaImagen.OTRA, files)}
                uploading={uploading}
              />
              <form onSubmit={submitIntervencion} className="space-y-3 border-t pt-4">
                <p className="text-sm text-[#6c757d]">Registrar trabajo realizado (auditoría inmutable)</p>
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
                  placeholder="Descripción del trabajo..."
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2"
                  required
                />
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="rounded-lg bg-[#f5c842] px-4 py-2 font-semibold text-sm">
                    Registrar intervención
                  </button>
                  <button
                    type="button"
                    onClick={() => avanzarEstado(EstadoMaquina.LISTA_PARA_VENTA)}
                    className="rounded-lg bg-green-700 text-white px-4 py-2 text-sm font-semibold"
                  >
                    Trabajo terminado → Lista para venta
                  </button>
                </div>
              </form>
            </div>
          )}

          {(estado === EstadoMaquina.LISTA_PARA_VENTA ||
            estado === EstadoMaquina.RESERVADA ||
            estado === EstadoMaquina.VENDIDA) && (
            <>
              <div className="rounded-xl bg-green-50 border border-green-200 p-6">
                <h3 className="font-semibold text-lg mb-3">Precio de venta</h3>
                <form onSubmit={savePrecio} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    value={precioUsd}
                    onChange={(e) => setPrecioUsd(e.target.value)}
                    placeholder="Precio USD"
                    className="rounded-lg border px-3 py-2"
                  />
                  <input
                    value={tipoCambio}
                    onChange={(e) => setTipoCambio(e.target.value)}
                    placeholder="Tipo de cambio"
                    className="rounded-lg border px-3 py-2"
                  />
                  <input
                    value={precioBob}
                    onChange={(e) => setPrecioBob(e.target.value)}
                    placeholder="Precio BOB"
                    className="rounded-lg border px-3 py-2"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-3 rounded-lg bg-[#f5c842] px-4 py-2 font-semibold text-sm w-fit"
                  >
                    Guardar precio
                  </button>
                </form>
              </div>
              <div className="rounded-xl bg-white border p-6">
                <GaleriaFotos maquina={maquina} />
              </div>
            </>
          )}

          {maquina.intervenciones && maquina.intervenciones.length > 0 && (
            <div className="rounded-xl bg-white border p-6">
              <h3 className="font-semibold mb-4">Historial (auditoría)</h3>
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
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
