'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ClienteDto, MaquinaDto, VentaDto } from '@retimax/shared-types';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { apiFetch } from '@/lib/api';
import { ESTADO_LABELS } from '@/lib/labels';

export default function VentasPage() {
  const [ventas, setVentas] = useState<VentaDto[]>([]);
  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [maquinas, setMaquinas] = useState<MaquinaDto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    maquinaId: '',
    clienteId: '',
    precioFinalUsd: '',
    precioFinalBob: '',
    tipoCambio: '',
    fechaEntrega: '',
  });

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
    await apiFetch('/ventas', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setShowForm(false);
    await load();
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
                onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}
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
                onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
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
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Precio USD"
                  value={form.precioFinalUsd}
                  onChange={(e) => setForm({ ...form, precioFinalUsd: e.target.value })}
                  className="rounded-lg border px-3 py-2"
                  required
                />
                <input
                  placeholder="Precio BOB"
                  value={form.precioFinalBob}
                  onChange={(e) => setForm({ ...form, precioFinalBob: e.target.value })}
                  className="rounded-lg border px-3 py-2"
                  required
                />
                <input
                  placeholder="Tipo de cambio"
                  value={form.tipoCambio}
                  onChange={(e) => setForm({ ...form, tipoCambio: e.target.value })}
                  className="rounded-lg border px-3 py-2"
                  required
                />
                <input
                  type="date"
                  value={form.fechaEntrega}
                  onChange={(e) => setForm({ ...form, fechaEntrega: e.target.value })}
                  className="rounded-lg border px-3 py-2"
                  required
                />
              </div>
              <button type="submit" className="rounded-lg bg-[#1a1a1a] text-white px-4 py-2 text-sm">
                Confirmar venta
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
