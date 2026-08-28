'use client';

import { useEffect } from 'react';

interface ReciboPrintProps {
  title: string;
  numero: string;
  fechaEmision: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function ReciboPrint({ title, numero, fechaEmision, children, onClose }: ReciboPrintProps) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-auto p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-8 print:shadow-none print:max-w-none print:rounded-none">
        <div className="print:hidden flex justify-between items-center mb-4">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-sm underline">
            Cerrar
          </button>
        </div>
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold">
            RETI<span className="text-[#f5c842]">MAX</span>
          </h1>
          <p className="text-sm text-[#6c757d]">{title}</p>
          <p className="font-mono font-semibold mt-2">{numero}</p>
          <p className="text-xs text-[#6c757d] mt-1">
            {new Date(fechaEmision).toLocaleString('es-BO')}
          </p>
        </div>
        {children}
        <p className="text-xs text-center text-[#6c757d] mt-6 print:mt-8">
          Documento generado por RETIMAX — Gestión de maquinaria
        </p>
      </div>
    </div>
  );
}
