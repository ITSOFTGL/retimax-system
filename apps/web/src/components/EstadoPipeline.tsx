'use client';

import { EstadoMaquina } from '@retimax/shared-types';
import { ESTADO_COLORS, ESTADO_LABELS, NEXT_ESTADOS } from '@/lib/labels';

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

type Props = {
  estadoActual: EstadoMaquina;
  onChangeEstado?: (estado: EstadoMaquina) => void;
};

export function EstadoPipeline({ estadoActual, onChangeEstado }: Props) {
  const currentIdx = PIPELINE.indexOf(estadoActual);
  const nextEstados = NEXT_ESTADOS[estadoActual] ?? [];

  return (
    <div className="rounded-xl bg-white border p-5">
      <h3 className="font-semibold mb-1">Estado de la máquina</h3>
      <p className="text-sm text-[#6c757d] mb-4">
        Flujo completo: compra en Italia → tránsito → recepción → diagnóstico → mantenimiento →
        venta
      </p>

      <div className="flex flex-wrap gap-1 mb-4">
        {PIPELINE.map((estado, idx) => {
          const isPast = idx < currentIdx;
          const isCurrent = estado === estadoActual;
          const isFuture = idx > currentIdx;
          return (
            <div key={estado} className="flex items-center gap-1">
              <div
                className={`px-2 py-1 rounded text-xs font-medium ${
                  isCurrent
                    ? `${ESTADO_COLORS[estado]} text-white ring-2 ring-[#f5c842] ring-offset-1`
                    : isPast
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-400'
                }`}
                title={ESTADO_LABELS[estado]}
              >
                {isFuture && !isCurrent ? '○' : isPast ? '✓' : '●'}{' '}
                <span className="hidden sm:inline">{ESTADO_LABELS[estado]}</span>
                <span className="sm:hidden">{idx + 1}</span>
              </div>
              {idx < PIPELINE.length - 1 && (
                <span className={`text-xs ${isPast ? 'text-green-500' : 'text-gray-300'}`}>→</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-[#f8f9fa] p-3 text-sm">
        <p>
          <span className="font-medium">Estado actual:</span>{' '}
          <span className={`inline-block px-2 py-0.5 rounded text-white text-xs ${ESTADO_COLORS[estadoActual]}`}>
            {ESTADO_LABELS[estadoActual]}
          </span>
        </p>
        {nextEstados.length > 0 && onChangeEstado && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-[#6c757d] w-full sm:w-auto">Avanzar a:</span>
            {nextEstados.map((estado) => (
              <button
                key={estado}
                type="button"
                onClick={() => onChangeEstado(estado)}
                className="rounded-lg bg-[#1a1a1a] text-white px-3 py-1.5 text-sm hover:bg-black"
              >
                → {ESTADO_LABELS[estado]}
              </button>
            ))}
          </div>
        )}
        {estadoActual === EstadoMaquina.COMPRADA_ITALIA && (
          <p className="mt-2 text-[#6c757d]">
            Cuando la máquina salga de Italia, márcala como <strong>En tránsito</strong>. Al llegar al
            contenedor, pasa a <strong>Recibida</strong> y completa el módulo de recepción abajo.
          </p>
        )}
        {(estadoActual === EstadoMaquina.EN_TRANSITO ||
          estadoActual === EstadoMaquina.RECIBIDA) && (
          <p className="mt-2 text-cyan-800">
            ↓ Completa el <strong>módulo de recepción</strong> más abajo: cómo llegó, qué faltó y qué
            trabajo se requiere (mecánica, eléctrica, pintado, chapería).
          </p>
        )}
      </div>
    </div>
  );
}
