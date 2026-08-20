'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EstadoMaquina, ReporteResumenDto } from '@retimax/shared-types';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { apiFetch, imageUrl } from '@/lib/api';
import { ESTADO_COLORS, ESTADO_LABELS } from '@/lib/labels';

export default function ReportesPage() {
  const [data, setData] = useState<ReporteResumenDto | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<ReporteResumenDto>('/reportes/resumen')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const maquinasFiltradas = useMemo(() => {
    if (!data) return [];
    if (filtroEstado === 'TODOS') return data.maquinas;
    return data.maquinas.filter((m) => m.estado === filtroEstado);
  }, [data, filtroEstado]);

  if (loading) {
    return (
      <AuthGuard>
        <AppShell>
          <p className="text-[#6c757d]">Cargando reportes...</p>
        </AppShell>
      </AuthGuard>
    );
  }

  if (!data) return null;

  const { resumen, porEstado } = data;

  return (
    <AuthGuard>
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Reportería</h2>
            <p className="text-sm text-[#6c757d]">Resumen del inventario, ventas, clientes y proveedores</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total máquinas', value: resumen.totalMaquinas },
              { label: 'Vendidas', value: resumen.maquinasVendidas, color: 'text-green-700' },
              { label: 'Lista para venta', value: resumen.maquinasDisponibles, color: 'text-green-600' },
              { label: 'Reservadas', value: resumen.maquinasReservadas, color: 'text-purple-600' },
              { label: 'En tránsito / Italia', value: resumen.maquinasCompradas, color: 'text-blue-600' },
              { label: 'En taller', value: resumen.maquinasEnProceso, color: 'text-amber-600' },
              { label: 'Clientes', value: resumen.totalClientes },
              { label: 'Proveedores', value: resumen.totalProveedores },
            ].map((card) => (
              <div key={card.label} className="rounded-xl bg-white border p-4">
                <p className="text-xs text-[#6c757d]">{card.label}</p>
                <p className={`text-2xl font-bold mt-1 ${card.color ?? ''}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-white border p-5">
            <h3 className="font-semibold mb-3">Ventas — ${resumen.totalVentasUsd} USD / Bs {resumen.totalVentasBob}</h3>
            {data.ventas.length === 0 ? (
              <p className="text-sm text-[#6c757d]">Sin ventas registradas</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#6c757d] border-b">
                      <th className="py-2 pr-3">Máquina</th>
                      <th className="py-2 pr-3">Cliente</th>
                      <th className="py-2 pr-3">Proveedor</th>
                      <th className="py-2 pr-3">USD</th>
                      <th className="py-2 pr-3">BOB</th>
                      <th className="py-2">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ventas.map((v) => (
                      <tr key={v.id} className="border-b last:border-0">
                        <td className="py-2 pr-3">
                          <Link href={`/maquinas/${v.maquinaId}`} className="font-medium hover:text-[#f5c842]">
                            {v.maquinaNombre}
                          </Link>
                        </td>
                        <td className="py-2 pr-3">{v.clienteNombre}</td>
                        <td className="py-2 pr-3">{v.proveedor}</td>
                        <td className="py-2 pr-3">${v.precioFinalUsd}</td>
                        <td className="py-2 pr-3">Bs {v.precioFinalBob}</td>
                        <td className="py-2">{new Date(v.createdAt).toLocaleDateString('es-BO')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl bg-white border p-5">
              <h3 className="font-semibold mb-3">Clientes ({data.clientes.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.clientes.map((c) => (
                  <div key={c.id} className="flex justify-between text-sm border-b pb-2">
                    <span>{c.nombre}</span>
                    <span className="text-[#6c757d]">
                      {c.totalVentas} venta(s) · {c.totalPedidos} pedido(s)
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-white border p-5">
              <h3 className="font-semibold mb-3">Proveedores ({data.proveedores.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.proveedores.map((p) => (
                  <div key={p.id} className="flex justify-between text-sm border-b pb-2">
                    <span>{p.nombre}</span>
                    <span className="text-[#6c757d]">{p.totalMaquinas} máquina(s)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white border p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-semibold">Máquinas por estado</h3>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                <option value="TODOS">Todos los estados</option>
                {Object.values(EstadoMaquina).map((e) => (
                  <option key={e} value={e}>
                    {ESTADO_LABELS[e]} ({porEstado[e] ?? 0})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(porEstado).map(([estado, count]) => (
                <button
                  key={estado}
                  type="button"
                  onClick={() => setFiltroEstado(estado)}
                  className={`text-xs px-2 py-1 rounded-full text-white ${ESTADO_COLORS[estado as EstadoMaquina]}`}
                >
                  {ESTADO_LABELS[estado as EstadoMaquina]}: {count}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#6c757d] border-b">
                    <th className="py-2 pr-2">Foto</th>
                    <th className="py-2 pr-3">Máquina</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3">Proveedor</th>
                    <th className="py-2 pr-3">Registró</th>
                    <th className="py-2 pr-3">Reservada / Vendida</th>
                    <th className="py-2">Diagnóstico</th>
                  </tr>
                </thead>
                <tbody>
                  {maquinasFiltradas.map((m) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-2 pr-2">
                        {m.thumbnailUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={imageUrl(m.thumbnailUrl)}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <span className="text-xs text-[#6c757d]">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <Link href={`/maquinas/${m.id}`} className="font-medium hover:text-[#f5c842]">
                          {m.nombre}
                        </Link>
                        <p className="text-xs text-[#6c757d]">{m.tipo}</p>
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`text-xs text-white px-2 py-0.5 rounded-full ${ESTADO_COLORS[m.estado]}`}
                        >
                          {ESTADO_LABELS[m.estado]}
                        </span>
                      </td>
                      <td className="py-2 pr-3">{m.proveedor}</td>
                      <td className="py-2 pr-3">{m.registradoPor}</td>
                      <td className="py-2 pr-3">
                        {m.vendidaA ? (
                          <span className="text-green-700">Vendida: {m.vendidaA}</span>
                        ) : m.reservadaPor ? (
                          <span className="text-purple-700">Reservada: {m.reservadaPor}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2">{m.empleadoDiagnostico ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
