'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ClienteDto, MaquinaDto, PedidoDto, ReciboReservaDto } from '@retimax/shared-types';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { ReciboPrint } from '@/components/ReciboPrint';
import { apiFetch } from '@/lib/api';

import { formatDecimal } from '@/lib/numbers';

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoDto[]>([]);
  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [maquinas, setMaquinas] = useState<MaquinaDto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [maquinaId, setMaquinaId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [anticipo, setAnticipo] = useState('');
  const [total, setTotal] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recibo, setRecibo] = useState<ReciboReservaDto | null>(null);

  const saldo = (() => {
    const t = parseFloat(total.replace(',', '.'));
    const a = parseFloat(anticipo.replace(',', '.'));
    if (Number.isNaN(t) || Number.isNaN(a)) return '';
    const s = Math.max(0, t - a);
    return s.toFixed(2);
  })();

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
    setError('');
    setLoading(true);
    try {
      const anticipoUsd = formatDecimal(anticipo);
      const totalUsd = formatDecimal(total);
      if (!anticipoUsd || !totalUsd) {
        throw new Error('Anticipo y total deben ser números válidos (ej. 1500 o 1500.50)');
      }
      const saldoUsd = formatDecimal(saldo) ?? '0';
      const pedido = await apiFetch<PedidoDto>('/pedidos', {
        method: 'POST',
        body: JSON.stringify({
          clienteId,
          maquinaId: maquinaId || undefined,
          descripcionReferencia: descripcion || undefined,
          anticipoUsd,
          saldoUsd,
          totalUsd,
        }),
      });
      if (pedido.id) {
        const r = await apiFetch<ReciboReservaDto>(`/pedidos/${pedido.id}/recibo`);
        setRecibo(r);
      }
      setShowForm(false);
      setClienteId('');
      setMaquinaId('');
      setDescripcion('');
      setAnticipo('');
      setTotal('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar pedido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGuard adminOnly>
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
              {clientes.length === 0 && (
                <p className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
                  Primero registra un cliente en la sección Clientes.
                </p>
              )}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  value={anticipo}
                  onChange={(e) => setAnticipo(e.target.value)}
                  placeholder="Anticipo USD"
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
                <input
                  value={saldo}
                  readOnly
                  placeholder="Saldo (auto)"
                  className="rounded-lg border px-3 py-2 bg-gray-50"
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading || clientes.length === 0}
                className="rounded-lg bg-[#1a1a1a] text-white px-4 py-2 text-sm disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar pedido'}
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
                {p.reciboReserva && (
                  <button
                    type="button"
                    onClick={async () => {
                      const r = await apiFetch<ReciboReservaDto>(`/pedidos/${p.id}/recibo`);
                      setRecibo(r);
                    }}
                    className="text-xs underline mt-2"
                  >
                    Imprimir recibo {p.reciboReserva.numero}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {recibo && (
          <ReciboPrint
            title="Recibo de reserva"
            numero={recibo.numero}
            fechaEmision={recibo.fechaEmision}
            onClose={() => setRecibo(null)}
          >
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-[#6c757d]">Cliente:</span> {recibo.pedido?.cliente.nombre}
              </p>
              {recibo.pedido?.maquina && (
                <p>
                  <span className="text-[#6c757d]">Máquina:</span> {recibo.pedido.maquina.nombre} (
                  {recibo.pedido.maquina.tipo})
                </p>
              )}
              {recibo.pedido?.descripcionReferencia && (
                <p>
                  <span className="text-[#6c757d]">Referencia:</span>{' '}
                  {recibo.pedido.descripcionReferencia}
                </p>
              )}
              <hr className="my-3" />
              <p>
                Total: <strong>${recibo.pedido?.totalUsd}</strong> USD
              </p>
              <p>Anticipo: ${recibo.pedido?.anticipoUsd} USD</p>
              <p>Saldo pendiente: ${recibo.pedido?.saldoUsd} USD</p>
              <p className="text-xs text-[#6c757d] mt-2">
                Vigencia de reserva: {recibo.vigenciaDias} días
              </p>
            </div>
          </ReciboPrint>
        )}
      </AppShell>
    </AuthGuard>
  );
}
