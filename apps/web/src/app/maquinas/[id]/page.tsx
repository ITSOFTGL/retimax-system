'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  AreaIntervencion,
  EmpleadoDto,
  EstadoIntervencion,
  EstadoMaquina,
  EtapaImagen,
  MaquinaDto,
  ProveedorDto,
  TipoIntervencion,
} from '@retimax/shared-types';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { AudioNoteRecorder } from '@/components/AudioNoteRecorder';
import { EstadoPipeline } from '@/components/EstadoPipeline';
import { PhotoGallery } from '@/components/PhotoGallery';
import { ImagePicker } from '@/components/ImagePicker';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/dates';
import { maquinaSubtitulo, maquinaTitulo } from '@/lib/maquina-display';
import {
  AREA_LABELS,
  ESTADO_COLORS,
  ESTADO_LABELS,
  TIPO_INTERVENCION_LABELS,
} from '@/lib/labels';

const PIPELINE: EstadoMaquina[] = [
  EstadoMaquina.COMPRADA_ITALIA,
  EstadoMaquina.EN_TRANSITO,
  EstadoMaquina.RECIBIDA,
  EstadoMaquina.EN_DIAGNOSTICO,
  EstadoMaquina.EN_MANTENIMIENTO,
  EstadoMaquina.LISTA_PARA_VENTA,
  EstadoMaquina.RESERVADA,
  EstadoMaquina.VENDIDA,
];

function estadoAnteriorDe(estado: EstadoMaquina): EstadoMaquina | null {
  const i = PIPELINE.indexOf(estado);
  return i > 0 ? PIPELINE[i - 1] : null;
}

export default function MaquinaDetailPage() {
  const params = useParams<{ id: string }>();
  const [maquina, setMaquina] = useState<MaquinaDto | null>(null);
  const [empleados, setEmpleados] = useState<EmpleadoDto[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorDto[]>([]);
  const [editing, setEditing] = useState(false);
  const [volverAtras, setVolverAtras] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [editNombre, setEditNombre] = useState('');
  const [editTipo, setEditTipo] = useState('');
  const [editMarca, setEditMarca] = useState('');
  const [editModelo, setEditModelo] = useState('');
  const [editAnio, setEditAnio] = useState('');
  const [editProveedorId, setEditProveedorId] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');

  const [fechaDespacho, setFechaDespacho] = useState('');
  const [fechaLlegadaEst, setFechaLlegadaEst] = useState('');
  const [fechaRecibida, setFechaRecibida] = useState('');
  const [recepcionDesc, setRecepcionDesc] = useState('');
  const [fotosLlegada, setFotosLlegada] = useState<File[]>([]);

  const [diagMecanica, setDiagMecanica] = useState('');
  const [diagElectrica, setDiagElectrica] = useState('');
  const [diagPintado, setDiagPintado] = useState('');
  const [diagMantenimiento, setDiagMantenimiento] = useState('');
  const [diagMecanicaResp, setDiagMecanicaResp] = useState('');
  const [diagElectricaResp, setDiagElectricaResp] = useState('');
  const [diagPintadoResp, setDiagPintadoResp] = useState('');
  const [diagMantenimientoResp, setDiagMantenimientoResp] = useState('');
  const [requiereMantenimiento, setRequiereMantenimiento] = useState(true);

  const [precioCompraUsd, setPrecioCompraUsd] = useState('');
  const [precioVentaUsd, setPrecioVentaUsd] = useState('');

  const [areaAsignar, setAreaAsignar] = useState<AreaIntervencion>(AreaIntervencion.MECANICA);
  const [descAsignar, setDescAsignar] = useState('');
  const [empleadoAsignarId, setEmpleadoAsignarId] = useState('');

  function syncForm(data: MaquinaDto) {
    setEditNombre(data.nombre);
    setEditTipo(data.tipo);
    setEditMarca(data.marca);
    setEditModelo(data.modelo);
    setEditAnio(data.anio != null ? String(data.anio) : '');
    setEditProveedorId(data.proveedorId);
    setEditDescripcion(data.descripcionAcordada ?? data.descripcionLlegada ?? '');
    setRecepcionDesc(data.descripcionLlegada ?? '');
    setFechaDespacho(data.fechaDespacho?.slice(0, 10) ?? '');
    setFechaLlegadaEst(data.fechaLlegadaEstimada?.slice(0, 10) ?? '');
    setFechaRecibida(
      data.fechaLlegadaReal?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    );
    setPrecioCompraUsd(data.precioCompraUsd ?? '');
    setPrecioVentaUsd(data.precioVentaUsd ?? '');
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [data, emps, provs] = await Promise.all([
        apiFetch<MaquinaDto>(`/maquinas/${params.id}`),
        apiFetch<EmpleadoDto[]>('/empleados'),
        apiFetch<ProveedorDto[]>('/proveedores'),
      ]);
      setMaquina(data);
      setEmpleados(emps.filter((e) => e.activo));
      setProveedores(provs);
      syncForm(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar máquina');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [params.id]);

  const estado = maquina?.estado;
  const acordada = maquina?.descripcionAcordada ?? maquina?.descripcionLlegada;
  const estadoPrevio = estado ? estadoAnteriorDe(estado) : null;

  const intervencionesMantenimiento = useMemo(
    () =>
      maquina?.intervenciones?.filter(
        (i) =>
          i.tipo === TipoIntervencion.TRABAJO_REALIZADO ||
          (i.tipo === TipoIntervencion.OBSERVACION_ADICIONAL && i.responsableId),
      ) ?? [],
    [maquina?.intervenciones],
  );

  const hayPendientesAprobacion = intervencionesMantenimiento.some(
    (i) => i.estadoIntervencion === EstadoIntervencion.FINALIZADO,
  );
  const hayTrabajoAprobado = intervencionesMantenimiento.some(
    (i) => i.estadoIntervencion === EstadoIntervencion.APROBADO,
  );

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
    } finally {
      setUploading(false);
    }
  }

  async function handleTransito(e: FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      await apiFetch(`/maquinas/${params.id}/transito`, {
        method: 'POST',
        body: JSON.stringify({
          fechaDespacho,
          fechaLlegadaEstimada: fechaLlegadaEst || undefined,
        }),
      });
      setVolverAtras(false);
      await load();
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
      await apiFetch(`/maquinas/${params.id}/recibida`, {
        method: 'POST',
        body: JSON.stringify({ fechaLlegadaReal: fechaRecibida || undefined }),
      });
      setVolverAtras(false);
      await load();
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
      if (fechaRecibida) form.append('fechaLlegadaReal', fechaRecibida);
      fotosLlegada.forEach((f) => form.append('files', f));
      await apiFetch(`/maquinas/${params.id}/recepcion`, { method: 'POST', body: form });
      setFotosLlegada([]);
      setVolverAtras(false);
      await load();
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
      const areas = [
        { text: diagMecanica, resp: diagMecanicaResp, key: 'mecanica' as const },
        { text: diagElectrica, resp: diagElectricaResp, key: 'electrica' as const },
        { text: diagPintado, resp: diagPintadoResp, key: 'pintado' as const },
        { text: diagMantenimiento, resp: diagMantenimientoResp, key: 'mantenimiento' as const },
      ];
      for (const a of areas) {
        if (a.text.trim() && !a.resp) {
          setError('Cada área con observación debe tener un responsable asignado');
          setActionLoading(false);
          return;
        }
      }

      await apiFetch(`/maquinas/${params.id}/diagnostico/completar`, {
        method: 'POST',
        body: JSON.stringify({
          mecanica: diagMecanica.trim() || undefined,
          mecanicaResponsableId: diagMecanica.trim() ? diagMecanicaResp : undefined,
          electrica: diagElectrica.trim() || undefined,
          electricaResponsableId: diagElectrica.trim() ? diagElectricaResp : undefined,
          pintado: diagPintado.trim() || undefined,
          pintadoResponsableId: diagPintado.trim() ? diagPintadoResp : undefined,
          mantenimiento: diagMantenimiento.trim() || undefined,
          mantenimientoResponsableId: diagMantenimiento.trim() ? diagMantenimientoResp : undefined,
          requiereMantenimiento,
        }),
      });
      setVolverAtras(false);
      await load();
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
      await apiFetch(`/maquinas/${params.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          precioCompraUsd: precioCompraUsd || undefined,
          precioVentaUsd: precioVentaUsd || undefined,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar precio');
    }
  }

  async function asignarTrabajo(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await apiFetch(`/maquinas/${params.id}/intervenciones`, {
        method: 'POST',
        body: JSON.stringify({
          tipo: TipoIntervencion.TRABAJO_REALIZADO,
          area: areaAsignar,
          descripcion: descAsignar,
          responsableId: empleadoAsignarId,
        }),
      });
      setDescAsignar('');
      setEmpleadoAsignarId('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar trabajo');
    }
  }

  async function cambiarEstado(nuevoEstado: EstadoMaquina, motivo?: string) {
    setActionLoading(true);
    setError('');
    try {
      await apiFetch(`/maquinas/${params.id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: nuevoEstado, motivo }),
      });
      setVolverAtras(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVolverAtras() {
    if (!estadoPrevio) return;
    await cambiarEstado(estadoPrevio, 'Retroceso al estado anterior');
  }

  async function saveEdicion(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await apiFetch(`/maquinas/${params.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nombre: editNombre,
          tipo: editTipo,
          marca: editMarca,
          modelo: editModelo,
          anio: editAnio ? Number(editAnio) : undefined,
          proveedorId: editProveedorId,
          descripcionLlegada: editDescripcion,
        }),
      });
      setEditing(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar cambios');
    }
  }

  async function aprobarIntervencion(id: string) {
    await apiFetch(`/intervenciones/${id}/aprobar`, { method: 'PATCH' });
    await load();
  }

  async function rechazarIntervencion(id: string) {
    const obs = prompt('Motivo del rechazo (opcional):');
    await apiFetch(`/intervenciones/${id}/rechazar`, {
      method: 'PATCH',
      body: JSON.stringify({ observaciones: obs || undefined }),
    });
    await load();
  }

  if (loading) {
    return (
      <AuthGuard adminOnly>
        <AppShell>
          <p className="text-[#6c757d]">Cargando...</p>
        </AppShell>
      </AuthGuard>
    );
  }

  if (!maquina || !estado) return null;

  return (
    <AuthGuard adminOnly>
      <AppShell>
        <div className="max-w-5xl mx-auto space-y-6">
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          {/* CUADRO 1 — Datos principales + fotos + despacho */}
          <div className="rounded-xl bg-white border p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">{maquinaTitulo(maquina)}</h2>
                <p className="text-xl text-[#6c757d]">{maquinaSubtitulo(maquina)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-sm text-white px-3 py-1 rounded-full ${ESTADO_COLORS[estado]}`}
                >
                  {ESTADO_LABELS[estado]}
                </span>
                {estado !== EstadoMaquina.VENDIDA && (
                  <button
                    type="button"
                    onClick={() => setEditing(!editing)}
                    className="text-sm rounded-lg border px-3 py-1 hover:bg-gray-50"
                  >
                    {editing ? 'Cancelar' : 'Editar'}
                  </button>
                )}
              </div>
            </div>

            {editing ? (
              <form onSubmit={saveEdicion} className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t pt-4">
                <input
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  placeholder="Nombre interno"
                  className="rounded-lg border px-3 py-2"
                  required
                />
                <input
                  value={editTipo}
                  onChange={(e) => setEditTipo(e.target.value)}
                  placeholder="Tipo (ej. Fresadora)"
                  className="rounded-lg border px-3 py-2"
                  required
                />
                <input
                  value={editMarca}
                  onChange={(e) => setEditMarca(e.target.value)}
                  placeholder="Marca *"
                  className="rounded-lg border px-3 py-2"
                  required
                />
                <input
                  value={editModelo}
                  onChange={(e) => setEditModelo(e.target.value)}
                  placeholder="Modelo *"
                  className="rounded-lg border px-3 py-2"
                  required
                />
                <input
                  type="number"
                  min={1950}
                  max={2100}
                  value={editAnio}
                  onChange={(e) => setEditAnio(e.target.value)}
                  placeholder="Año *"
                  className="rounded-lg border px-3 py-2"
                  required
                />
                <select
                  value={editProveedorId}
                  onChange={(e) => setEditProveedorId(e.target.value)}
                  className="rounded-lg border px-3 py-2 md:col-span-2"
                  required
                >
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
                <textarea
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  placeholder="Descripción acordada / qué debería traer"
                  rows={3}
                  className="rounded-lg border px-3 py-2 md:col-span-2"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#f5c842] px-4 py-2 font-semibold text-sm w-fit"
                >
                  Guardar cambios
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p>
                  <span className="text-[#6c757d]">Proveedor:</span> {maquina.proveedor?.nombre}
                </p>
                <p>
                  <span className="text-[#6c757d]">Registrada por:</span> {maquina.creadoPor?.nombre}
                </p>
                {acordada && (
                  <p className="md:col-span-2 whitespace-pre-wrap">
                    <span className="text-[#6c757d]">Descripción:</span> {acordada}
                  </p>
                )}
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
              </div>
            )}

            <PhotoGallery imagenes={maquina.imagenes ?? []} title="Fotos de la máquina" />

            {estado === EstadoMaquina.COMPRADA_ITALIA && (
              <>
                <AudioNoteRecorder
                  maquinaId={maquina.id}
                  audioUrl={maquina.notaAudioUrl}
                  onUploaded={() => load()}
                />
                <ImagePicker
                  label="Agregar fotos de embarque"
                  disabled={uploading}
                  onUpload={(files) => uploadPhotos(EtapaImagen.EMBARQUE, files)}
                  uploading={uploading}
                />
                <form
                  onSubmit={handleTransito}
                  className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-3"
                >
                  <p className="text-sm font-medium">Confirmar despacho → En tránsito</p>
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
              </>
            )}
          </div>

          {/* CUADRO 2 — Estado + acción del paso actual */}
          <div className="rounded-xl bg-white border p-5 space-y-4">
            <EstadoPipeline estadoActual={estado} />

            {estadoPrevio && estado !== EstadoMaquina.VENDIDA && (
              <div className="rounded-lg border border-dashed border-gray-300 p-3 space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={volverAtras}
                    onChange={(e) => setVolverAtras(e.target.checked)}
                  />
                  Deseo volver al estado anterior ({ESTADO_LABELS[estadoPrevio]})
                </label>
                {volverAtras && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleVolverAtras}
                    className="rounded-lg border border-amber-400 bg-amber-50 text-amber-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    Confirmar retroceso a {ESTADO_LABELS[estadoPrevio]}
                  </button>
                )}
              </div>
            )}

            {estado === EstadoMaquina.EN_TRANSITO && (
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm text-[#6c757d]">
                  La máquina va en camino. Cuando llegue al taller, marca como recibida.
                </p>
                {maquina.fechaDespacho && (
                  <p className="text-sm">
                    Despachada el {new Date(maquina.fechaDespacho).toLocaleDateString('es-BO')}
                  </p>
                )}
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
                    {actionLoading ? '...' : 'Marcar recibida en taller'}
                  </button>
                </div>
              </div>
            )}

            {estado === EstadoMaquina.RECIBIDA && (
              <form onSubmit={handleRecepcion} className="space-y-4 border-t pt-4">
                <p className="text-sm font-medium">Verificar cómo llegó la máquina (descargo del contenedor)</p>
                <textarea
                  value={recepcionDesc}
                  onChange={(e) => setRecepcionDesc(e.target.value)}
                  rows={3}
                  placeholder="Ej: Llegó con plato, sin garras. Bomba dañada..."
                  className="w-full rounded-lg border px-3 py-2"
                  required
                />
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
                  {actionLoading ? 'Guardando...' : 'Confirmar recepción → Diagnóstico'}
                </button>
              </form>
            )}

            {estado === EstadoMaquina.EN_DIAGNOSTICO && (
              <form onSubmit={handleCompletarDiagnostico} className="space-y-4 border-t pt-4">
                <p className="text-sm text-[#6c757d]">
                  Diagnóstico por área — asigna un responsable por cada observación registrada.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(
                    [
                      ['Mecánica', diagMecanica, setDiagMecanica, diagMecanicaResp, setDiagMecanicaResp],
                      ['Eléctrica', diagElectrica, setDiagElectrica, diagElectricaResp, setDiagElectricaResp],
                      ['Pintado', diagPintado, setDiagPintado, diagPintadoResp, setDiagPintadoResp],
                      [
                        'Mantenimiento general',
                        diagMantenimiento,
                        setDiagMantenimiento,
                        diagMantenimientoResp,
                        setDiagMantenimientoResp,
                      ],
                    ] as const
                  ).map(([label, val, setVal, resp, setResp]) => (
                    <div key={label} className="space-y-2">
                      <label className="block text-sm font-medium">{label}</label>
                      <textarea
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        rows={2}
                        placeholder="Observaciones (opcional)"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      />
                      {val.trim() && (
                        <select
                          value={resp}
                          onChange={(e) => setResp(e.target.value)}
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                          required
                        >
                          <option value="">Responsable de esta observación *</option>
                          {empleados.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.nombreCompleto} — {e.especialidad.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={requiereMantenimiento}
                    onChange={(e) => setRequiereMantenimiento(e.target.checked)}
                  />
                  Requiere mantenimiento antes de vender
                </label>
                {!requiereMantenimiento && (
                  <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                    Diagnóstico preventivo: la máquina pasará directo a lista para venta sin mantenimiento.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={actionLoading || empleados.length === 0}
                  className="rounded-lg bg-[#f5c842] px-4 py-2 font-semibold text-sm disabled:opacity-50"
                >
                  {actionLoading
                    ? 'Guardando...'
                    : requiereMantenimiento
                      ? 'Completar → Mantenimiento'
                      : 'Completar → Lista para venta'}
                </button>
              </form>
            )}

            {estado === EstadoMaquina.EN_MANTENIMIENTO && (
              <div className="space-y-4 border-t pt-4">
                <p className="text-sm text-[#6c757d]">
                  Asigna el trabajo a un empleado. Él iniciará sesión, describirá qué hará y
                  finalizará. Tú validas y apruebas antes de marcar la máquina lista.
                </p>
                <ImagePicker
                  label="Fotos del trabajo"
                  disabled={uploading}
                  onUpload={(files) => uploadPhotos(EtapaImagen.OTRA, files)}
                  uploading={uploading}
                />
                <form onSubmit={asignarTrabajo} className="rounded-lg bg-gray-50 border p-4 space-y-3">
                  <p className="text-sm font-medium">Asignar nuevo trabajo</p>
                  <select
                    value={areaAsignar}
                    onChange={(e) => setAreaAsignar(e.target.value as AreaIntervencion)}
                    className="w-full rounded-lg border px-3 py-2"
                  >
                    {Object.entries(AREA_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <select
                    value={empleadoAsignarId}
                    onChange={(e) => setEmpleadoAsignarId(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  >
                    <option value="">Seleccionar empleado</option>
                    {empleados.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombreCompleto} — {e.especialidad.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={descAsignar}
                    onChange={(e) => setDescAsignar(e.target.value)}
                    placeholder="Qué debe hacer el trabajador..."
                    rows={2}
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                  <button
                    type="submit"
                    disabled={empleados.length === 0}
                    className="rounded-lg bg-[#1a1a1a] text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    Asignar trabajo
                  </button>
                </form>

                {intervencionesMantenimiento.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Trabajos asignados</p>
                    {intervencionesMantenimiento.map((i) => (
                      <div key={i.id} className="rounded-lg border p-3 text-sm">
                        <p className="font-medium">
                          {i.responsableNombre ?? i.responsable?.nombreCompleto} —{' '}
                          {AREA_LABELS[i.area]}
                        </p>
                        <p className="text-[#6c757d] mt-1">{i.descripcion}</p>
                        {i.detalleTrabajo && (
                          <p className="mt-1 bg-gray-50 p-2 rounded">Realizado: {i.detalleTrabajo}</p>
                        )}
                        <div className="text-xs text-[#6c757d] mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                          <p>Estado: {(i.estadoIntervencion ?? 'ASIGNADO').replace(/_/g, ' ')}</p>
                          <p>Asignado: {formatDateTime(i.fechaAsignacion ?? i.createdAt)}</p>
                          {i.fechaInicio && <p>Inicio: {formatDateTime(i.fechaInicio)}</p>}
                          {i.fechaFinalizacion && (
                            <p>Finalizado: {formatDateTime(i.fechaFinalizacion)}</p>
                          )}
                          {i.fechaAprobacion && (
                            <p>Aprobado: {formatDateTime(i.fechaAprobacion)}</p>
                          )}
                        </div>
                        {i.estadoIntervencion === EstadoIntervencion.FINALIZADO && (
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => aprobarIntervencion(i.id)}
                              className="text-xs bg-green-700 text-white px-3 py-1 rounded-lg"
                            >
                              Validar trabajo
                            </button>
                            <button
                              type="button"
                              onClick={() => rechazarIntervencion(i.id)}
                              className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {hayTrabajoAprobado && !hayPendientesAprobacion && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => cambiarEstado(EstadoMaquina.LISTA_PARA_VENTA, 'Trabajo validado')}
                    className="rounded-lg bg-green-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    Trabajo terminado → Lista para venta
                  </button>
                )}
              </div>
            )}

            {(estado === EstadoMaquina.LISTA_PARA_VENTA ||
              estado === EstadoMaquina.RESERVADA ||
              estado === EstadoMaquina.VENDIDA) && (
              <form onSubmit={savePrecio} className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Precios (USD)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#6c757d] mb-1">Precio de compra USD</label>
                    <input
                      value={precioCompraUsd}
                      onChange={(e) => setPrecioCompraUsd(e.target.value)}
                      placeholder="Ej. 5000"
                      className="w-full rounded-lg border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6c757d] mb-1">Precio de venta USD</label>
                    <input
                      value={precioVentaUsd}
                      onChange={(e) => setPrecioVentaUsd(e.target.value)}
                      placeholder="Ej. 7500"
                      className="w-full rounded-lg border px-3 py-2"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-[#f5c842] px-4 py-2 font-semibold text-sm"
                >
                  Guardar precio
                </button>
              </form>
            )}
          </div>

          {/* CUADRO 3 — Historial */}
          <div className="rounded-xl bg-white border p-6 space-y-6">
            <h3 className="font-semibold text-lg">Historial</h3>

            {maquina.historialEstados && maquina.historialEstados.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[#6c757d] mb-3">Cambios de estado</p>
                <div className="space-y-2">
                  {maquina.historialEstados.map((h) => (
                    <div key={h.id} className="text-sm border-l-4 border-gray-300 pl-3">
                      <p className="font-medium">
                        {h.anterior ? `${ESTADO_LABELS[h.anterior]} → ` : ''}
                        {ESTADO_LABELS[h.estado]}
                      </p>
                      <p className="text-[#6c757d] text-xs">
                        {new Date(h.createdAt).toLocaleString('es-BO')} — {h.creadoPor.nombre}
                        {h.motivo ? ` — ${h.motivo}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {maquina.intervenciones && maquina.intervenciones.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[#6c757d] mb-3">Auditoría de trabajos</p>
                <div className="space-y-3">
                  {maquina.intervenciones.map((i) => (
                    <div key={i.id} className="border-l-4 border-[#f5c842] pl-4 py-1 text-sm">
                      <div className="flex flex-wrap gap-2 text-xs text-[#6c757d]">
                        <span>{new Date(i.createdAt).toLocaleString('es-BO')}</span>
                        <span>•</span>
                        <span>{TIPO_INTERVENCION_LABELS[i.tipo]}</span>
                        <span>•</span>
                        <span>{AREA_LABELS[i.area]}</span>
                      </div>
                      <p className="mt-1">{i.descripcion}</p>
                      <p className="text-[#6c757d] mt-1">
                        {i.responsableNombre ?? i.responsable?.nombreCompleto ?? '—'}
                        {i.estadoIntervencion && (
                          <> — {(i.estadoIntervencion as string).replace(/_/g, ' ')}</>
                        )}
                      </p>
                      {(i.fechaAsignacion || i.fechaInicio || i.fechaFinalizacion) && (
                        <p className="text-xs text-[#6c757d] mt-1">
                          {i.fechaAsignacion && <>Asignado: {formatDateTime(i.fechaAsignacion)}</>}
                          {i.fechaInicio && <> · Inicio: {formatDateTime(i.fechaInicio)}</>}
                          {i.fechaFinalizacion && (
                            <> · Fin: {formatDateTime(i.fechaFinalizacion)}</>
                          )}
                        </p>
                      )}
                      {i.detalleTrabajo && (
                        <p className="mt-1 bg-gray-50 p-2 rounded text-xs">{i.detalleTrabajo}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!maquina.historialEstados?.length && !maquina.intervenciones?.length) && (
              <p className="text-sm text-[#6c757d]">Sin registros aún.</p>
            )}
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
