'use client';

import { EstadoMaquina } from '@retimax/shared-types';
import { ESTADO_COLORS, ESTADO_LABELS } from '@/lib/labels';

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
};

export function EstadoPipeline({ estadoActual }: Props) {
  const currentIdx = PIPELINE.indexOf(estadoActual);

  const hint: Record<EstadoMaquina, string> = {
    [EstadoMaquina.COMPRADA_ITALIA]:
      'Máquina registrada en Italia. Álvaro debe confirmar el despacho con fecha de salida.',
    [EstadoMaquina.EN_TRANSITO]:
      'En camino. Al llegar al taller, marca como recibida para que Cesia verifique.',
    [EstadoMaquina.RECIBIDA]:
      'Cesia verifica cómo llegó vs. lo acordado, sube fotos y asigna quién hará el diagnóstico.',
    [EstadoMaquina.EN_DIAGNOSTICO]:
      'El trabajador asignado completa el diagnóstico por área. Si falta algo → mantenimiento; si no → lista para venta.',
    [EstadoMaquina.EN_MANTENIMIENTO]:
      'Trabajos en curso. Registra intervenciones hasta dejar la máquina lista.',
    [EstadoMaquina.LISTA_PARA_VENTA]: 'Define precio de venta cuando esté listo.',
    [EstadoMaquina.RESERVADA]: 'Máquina reservada para un cliente.',
    [EstadoMaquina.VENDIDA]: 'Venta completada.',
  };

  return (
    <div className="rounded-xl bg-white border p-5">
      <h3 className="font-semibold mb-1">Estado de la máquina</h3>
      <p className="text-sm text-[#6c757d] mb-4">
        Flujo: compra Italia → tránsito → recepción → diagnóstico → mantenimiento → venta
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
          <span
            className={`inline-block px-2 py-0.5 rounded text-white text-xs ${ESTADO_COLORS[estadoActual]}`}
          >
            {ESTADO_LABELS[estadoActual]}
          </span>
        </p>
        <p className="mt-2 text-[#6c757d]">{hint[estadoActual]}</p>
      </div>
    </div>
  );
}
