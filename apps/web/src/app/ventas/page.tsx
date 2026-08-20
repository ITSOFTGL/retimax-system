'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ClienteDto, MaquinaDto, VentaDto } from '@retimax/shared-types';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
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

      await apiFetch('/ventas', {
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

  return (
    <AuthGuard>
      <AppShell>
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Ventas</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-[#f5c842] px-4 py-2 font-semibold text-sm"
            >
              + Registrar venta
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="rounded-xl bg-white border p-6 mb-6 space-y-3">
              <select
                value={form.maquinaId}
                onChange={(e) => updateForm({ maquinaId: e.target.value })}
                className="w-full rounded-lg border px-3 py-2"
                required
              >
                <option value="">Máquina</option>
                {maquinas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} ({ESTADO_LABELS[m.estado]})
                  </option>
                ))}
              </select>
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
                  <label className="block text-xs text-[#6c757d] mb-1">Precio BOB (auto: USD × TC)</label>
                  <input
                    placeholder="Calculado automáticamente"
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
                  {form.precioFinalUsd} USD × {form.tipoCambio} ={' '}
                  <strong>Bs {form.precioFinalBob}</strong>
                </p>
              )}
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-[#1a1a1a] text-white px-4 py-2 text-sm disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Confirmar venta'}
              </button>
            </form>
          )}

          <div className="space-y-3">
            {ventas.map((v) => (
              <div key={v.id} className="rounded-xl bg-white border p-4">
                <p className="font-semibold">{v.maquina?.nombre}</p>
                <p className="text-sm text-[#6c757d]">Cliente: {v.cliente?.nombre}</p>
                <p className="text-sm mt-2">
                  ${v.precioFinalUsd} USD / Bs {v.precioFinalBob} (TC {v.tipoCambio})
                </p>
                <p className="text-xs text-[#6c757d]">
                  Entrega: {new Date(v.fechaEntrega).toLocaleDateString('es-BO')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
