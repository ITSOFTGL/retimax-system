'use client';

import { FormEvent, useState } from 'react';
import { ClienteDto } from '@retimax/shared-types';
import { apiFetch } from '@/lib/api';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (cliente: ClienteDto) => void;
};

export function ClienteModal({ open, onClose, onCreated }: Props) {
  const [nombre, setNombre] = useState('');
  const [nitCi, setNitCi] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cliente = await apiFetch<ClienteDto>('/clientes', {
        method: 'POST',
        body: JSON.stringify({
          nombre,
          nitCi: nitCi || undefined,
          telefono: telefono || undefined,
          notas: notas || undefined,
        }),
      });
      onCreated(cliente);
      setNombre('');
      setNitCi('');
      setTelefono('');
      setNotas('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cliente');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-t-xl sm:rounded-xl shadow-xl max-w-md w-full p-6 space-y-3 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="font-semibold text-lg">Nuevo cliente</h3>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre completo *"
          className="w-full rounded-lg border px-3 py-2.5"
          required
        />
        <input
          value={nitCi}
          onChange={(e) => setNitCi(e.target.value)}
          placeholder="NIT / CI"
          className="w-full rounded-lg border px-3 py-2.5"
        />
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Teléfono"
          className="w-full rounded-lg border px-3 py-2.5"
        />
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Notas (opcional)"
          rows={2}
          className="w-full rounded-lg border px-3 py-2.5"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#f5c842] px-4 py-2.5 font-semibold text-sm disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar cliente'}
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2.5 text-sm">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
