'use client';

interface PrintReportProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function PrintReport({ title, children, onClose }: PrintReportProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-8 no-print-ui">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="text-sm underline">
            Cerrar
          </button>
        </div>
        <div className="print-area space-y-4">
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-bold">
              RETI<span className="text-[#f5c842]">MAX</span>
            </h1>
            <p className="text-sm text-[#6c757d]">{title}</p>
            <p className="text-xs text-[#6c757d] mt-1">
              Generado: {new Date().toLocaleString('es-BO')}
            </p>
          </div>
          {children}
        </div>
        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-[#1a1a1a] text-white px-4 py-2 text-sm font-semibold"
          >
            Imprimir
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
