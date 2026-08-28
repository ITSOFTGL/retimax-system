'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ClienteDto, MaquinaDto, ReciboVentaDto, VentaDto } from '@retimax/shared-types';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { ReciboPrint } from '@/components/ReciboPrint';
import { apiFetch } from '@/lib/api';
import { ESTADO_LABELS } from '@/lib/labels';
import { formatDecimal, multiplyDecimals, normalizeDecimal } from '@/lib/numbers';

export default function VentasPage() {
  const [ventas, setVentas] = useState<VentaDto[]>([]);
  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [maquinas, setMaquinas] = useState<MaquinaDto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recibo, setRecibo] = useState<ReciboVentaDto | null>(null);
  const [form, setForm] = useState({
    maquinaId: '',
    clienteId: '',
    precioFinalUsd: '',
    precioFinalBob: '',
    tipoCambio: '',
    fechaEntrega: '',
  });

  function updateForm(patch: Partial<typeof form>) {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if ('precioFinalUsd' in patch || 'tipoCambio' in patch) {
        const bob = multiplyDecimals(next.precioFinalUsd, next.tipoCambio);
        if (bob) next.precioFinalBob = bob;
      }
      return next;
    });
  }

  async function load() {
    const [v, c, m] = await Promise.all([
      apiFetch<VentaDto[]>('/ventas'),
      apiFetch<ClienteDto[]>('/clientes'),
      apiFetch<MaquinaDto[]>('/maquinas'),
    ]);
    setVentas(v);
    setClientes(c);
    setMaquinas(m.filter((x) => x.estado === 'LISTA_PARA_VENTA' || x.estado === 'RESERVADA'));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const precioFinalUsd = formatDecimal(form.precioFinalUsd);
      const tipoCambio = formatDecimal(form.tipoCambio, 4);
      const precioFinalBob =
        formatDecimal(form.precioFinalBob) ?? multiplyDecimals(form.precioFinalUsd, form.tipoCambio);

      if (!precioFinalUsd || !tipoCambio || !precioFinalBob) {
        throw new Error('Precio USD, tipo de cambio y precio BOB deben ser números válidos');
      }
      if (!form.fechaEntrega) {
        throw new Error('Selecciona la fecha de entrega');
      }

      const venta = await apiFetch<VentaDto>('/ventas', {
        method: 'POST',
        body: JSON.stringify({
          maquinaId: form.maquinaId,
          clienteId: form.clienteId,
          precioFinalUsd,
          precioFinalBob,
          tipoCambio,
          fechaEntrega: form.fechaEntrega,
        }),
      });
      if (venta.id) {
        const r = await apiFetch<ReciboVentaDto>(`/ventas/${venta.id}/recibo`);
        setRecibo(r);
      }
      setShowForm(false);
      setForm({
        maquinaId: '',
        clienteId: '',
        precioFinalUsd: '',
        precioFinalBob: '',
        tipoCambio: '',
        fechaEntrega: '',
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar venta');
    } finally {
      setLoading(false);
    }
  }

  const totalUsd = ventas.reduce((s, v) => s + parseFloat(v.precioFinalUsd), 0);

  return (
    <AuthGuard adminOnly>
      <AppShell>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Ventas</h2>
              <p className="text-sm text-[#6c757d]">{ventas.length} máquina(s) vendida(s)</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-[#f5c842] px-4 py-2 font-semibold text-sm"
            >
              + Registrar venta
            </button>
          </div>

          <div className="rounded-xl bg-green-50 border border-green-200 p-5">
            <h3 className="font-semibold text-lg mb-3">Máquinas vendidas</h3>
            {ventas.length === 0 ? (
              <p className="text-sm text-[#6c757d]">Aún no hay ventas registradas.</p>
            ) : (
              <>
                <p className="text-sm mb-4">
                  Total facturado: <strong>${totalUsd.toFixed(2)} USD</strong>
                </p>
                <div className="space-y-2">
                  {ventas.map((v) => (
                    <div
                      key={v.id}
                      className="rounded-lg bg-white border p-4 flex flex-wrap justify-between gap-3"
                    >
                      <div>
                        <Link
                          href={`/maquinas/${v.maquinaId}`}
                          className="font-semibold hover:text-[#f5c842]"
                        >
                          {v.maquina?.nombre ?? 'Máquina'}
                        </Link>
                        <p className="text-sm text-[#6c757d]">Cliente: {v.cliente?.nombre}</p>
                        <p className="text-sm mt-1">
                          ${v.precioFinalUsd} USD / Bs {v.precioFinalBob} (TC {v.tipoCambio})
                        </p>
                        <p className="text-xs text-[#6c757d]">
                          Venta: {new Date(v.createdAt).toLocaleDateString('es-BO')} — Entrega:{' '}
                          {new Date(v.fechaEntrega).toLocaleDateString('es-BO')}
                        </p>
                        {v.reciboVenta && (
                          <button
                            type="button"
                            onClick={async () => {
                              const r = await apiFetch<ReciboVentaDto>(`/ventas/${v.id}/recibo`);
                              setRecibo(r);
                            }}
                            className="text-xs underline mt-1"
                          >
                            Imprimir recibo {v.reciboVenta.numero}
                          </button>
                        )}
                      </div>
                      <span className="text-xs bg-neutral-500 text-white px-2 py-1 rounded-full h-fit">
                        Vendida
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="rounded-xl bg-white border p-6 space-y-3">
              <h3 className="font-semibold">Nueva venta</h3>
              <select
                value={form.maquinaId}
                onChange={(e) => updateForm({ maquinaId: e.target.value })}
                className="w-full rounded-lg border px-3 py-2"
                required
              >
                <option value="">Máquina disponible</option>
                {maquinas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} ({ESTADO_LABELS[m.estado]})
                  </option>
                ))}
              </select>
              {maquinas.length === 0 && (
                <p className="text-amber-700 text-sm">No hay máquinas en lista para venta o reservadas.</p>
              )}
              <select
                value={form.clienteId}
                onChange={(e) => updateForm({ clienteId: e.target.value })}
                className="w-full rounded-lg border px-3 py-2"
                required
              >
                <option value="">Cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-[#6c757d] mb-1">Precio USD</label>
                  <input
                    placeholder="Ej. 100"
                    value={form.precioFinalUsd}
                    onChange={(e) => updateForm({ precioFinalUsd: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6c757d] mb-1">Tipo de cambio</label>
                  <input
                    placeholder="Ej. 11.96"
                    value={form.tipoCambio}
                    onChange={(e) => updateForm({ tipoCambio: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6c757d] mb-1">Precio BOB (auto)</label>
                  <input
                    value={form.precioFinalBob}
                    readOnly
                    className="w-full rounded-lg border px-3 py-2 bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6c757d] mb-1">Fecha de entrega</label>
                  <input
                    type="date"
                    value={form.fechaEntrega}
                    onChange={(e) => updateForm({ fechaEntrega: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                </div>
              </div>
              {form.precioFinalUsd && form.tipoCambio && normalizeDecimal(form.precioFinalUsd) && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  {form.precioFinalUsd} USD × {form.tipoCambio} = <strong>Bs {form.precioFinalBob}</strong>
                </p>
              )}
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading || maquinas.length === 0}
                className="rounded-lg bg-[#1a1a1a] text-white px-4 py-2 text-sm disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Confirmar venta'}
              </button>
            </form>
          )}
        </div>

        {recibo && (
          <ReciboPrint
            title="Recibo de venta"
            numero={recibo.numero}
            fechaEmision={recibo.fechaEmision}
            onClose={() => setRecibo(null)}
          >
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-[#6c757d]">Cliente:</span> {recibo.venta?.cliente.nombre}
              </p>
              {recibo.venta?.cliente.telefono && (
                <p>
                  <span className="text-[#6c757d]">Tel:</span> {recibo.venta.cliente.telefono}
                </p>
              )}
              <p>
                <span className="text-[#6c757d]">Máquina:</span> {recibo.venta?.maquina.nombre} (
                {recibo.venta?.maquina.tipo})
              </p>
              {recibo.venta?.maquina.proveedor && (
                <p>
                  <span className="text-[#6c757d]">Proveedor:</span> {recibo.venta.maquina.proveedor}
                </p>
              )}
              <hr className="my-3" />
              <p>
                <span className="text-[#6c757d]">Precio USD:</span>{' '}
                <strong>${recibo.venta?.precioFinalUsd}</strong>
              </p>
              <p>
                <span className="text-[#6c757d]">Tipo cambio:</span> {recibo.venta?.tipoCambio}
              </p>
              <p>
                <span className="text-[#6c757d]">Precio BOB:</span>{' '}
                <strong>Bs {recibo.venta?.precioFinalBob}</strong>
              </p>
              <p>
                <span className="text-[#6c757d]">Fecha entrega:</span>{' '}
                {recibo.venta?.fechaEntrega &&
                  new Date(recibo.venta.fechaEntrega).toLocaleDateString('es-BO')}
              </p>
            </div>
          </ReciboPrint>
        )}
      </AppShell>
    </AuthGuard>
  );
}
