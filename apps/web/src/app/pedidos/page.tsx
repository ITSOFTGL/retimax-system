'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ClienteDto, MaquinaDto, PedidoDto } from '@retimax/shared-types';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { apiFetch } from '@/lib/api';

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoDto[]>([]);
  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [maquinas, setMaquinas] = useState<MaquinaDto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [maquinaId, setMaquinaId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [anticipo, setAnticipo] = useState('');
  const [saldo, setSaldo] = useState('');
  const [total, setTotal] = useState('');

  async function load() {
    const [p, c, m] = await Promise.all([
      apiFetch<PedidoDto[]>('/pedidos'),
      apiFetch<ClienteDto[]>('/clientes'),
      apiFetch<MaquinaDto[]>('/maquinas'),
    ]);
    setPedidos(p);
    setClientes(c);
    setMaquinas(m);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await apiFetch('/pedidos', {
      method: 'POST',
      body: JSON.stringify({
        clienteId,
        maquinaId: maquinaId || undefined,
        descripcionReferencia: descripcion || undefined,
        anticipoUsd: anticipo,
        saldoUsd: saldo,
        totalUsd: total,
      }),
    });
    setShowForm(false);
    await load();
  }

  return (
    <AuthGuard>
      <AppShell>
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Pedidos</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-[#f5c842] px-4 py-2 font-semibold text-sm"
            >
              + Nuevo pedido
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="rounded-xl bg-white border p-6 mb-6 space-y-3">
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
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
              <select
                value={maquinaId}
                onChange={(e) => setMaquinaId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="">Máquina (opcional)</option>
                {maquinas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción de referencia"
                className="w-full rounded-lg border px-3 py-2"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  value={anticipo}
                  onChange={(e) => setAnticipo(e.target.value)}
                  placeholder="Anticipo USD"
                  className="rounded-lg border px-3 py-2"
                  required
                />
                <input
                  value={saldo}
                  onChange={(e) => setSaldo(e.target.value)}
                  placeholder="Saldo USD"
                  className="rounded-lg border px-3 py-2"
                  required
                />
                <input
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  placeholder="Total USD"
                  className="rounded-lg border px-3 py-2"
                  required
                />
              </div>
              <button type="submit" className="rounded-lg bg-[#1a1a1a] text-white px-4 py-2 text-sm">
                Guardar pedido
              </button>
            </form>
          )}

          <div className="space-y-3">
            {pedidos.map((p) => (
              <div key={p.id} className="rounded-xl bg-white border p-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">{p.cliente?.nombre}</p>
                    <p className="text-sm text-[#6c757d]">
                      {p.maquina?.nombre ?? p.descripcionReferencia ?? 'Sin máquina vinculada'}
                    </p>
                  </div>
                  <span className="text-sm font-medium">{p.estado}</span>
                </div>
                <p className="text-sm mt-2">
                  Total: ${p.totalUsd} — Anticipo: ${p.anticipoUsd} — Saldo: ${p.saldoUsd}
                </p>
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
