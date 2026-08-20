'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ClienteDto } from '@retimax/shared-types';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { apiFetch } from '@/lib/api';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editNotas, setEditNotas] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setClientes(await apiFetch<ClienteDto[]>('/clientes'));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/clientes', {
        method: 'POST',
        body: JSON.stringify({ nombre, telefono: telefono || undefined, notas: notas || undefined }),
      });
      setNombre('');
      setTelefono('');
      setNotas('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  function startEdit(c: ClienteDto) {
    setEditId(c.id);
    setEditNombre(c.nombre);
    setEditTelefono(c.telefono ?? '');
    setEditNotas(c.notas ?? '');
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setError('');
    try {
      await apiFetch(`/clientes/${editId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nombre: editNombre,
          telefono: editTelefono || undefined,
          notas: editNotas || undefined,
        }),
      });
      setEditId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  }

  return (
    <AuthGuard>
      <AppShell>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Clientes</h2>
          <form onSubmit={handleSubmit} className="rounded-xl bg-white border p-6 mb-6 space-y-3">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre"
              className="w-full rounded-lg border px-3 py-2"
              required
            />
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Teléfono"
              className="w-full rounded-lg border px-3 py-2"
            />
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas"
              className="w-full rounded-lg border px-3 py-2"
            />
            <button type="submit" className="rounded-lg bg-[#f5c842] px-4 py-2 font-semibold text-sm">
              Agregar cliente
            </button>
          </form>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <div className="space-y-2">
            {clientes.map((c) => (
              <div key={c.id} className="rounded-lg bg-white border p-4">
                {editId === c.id ? (
                  <form onSubmit={saveEdit} className="space-y-2">
                    <input
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2"
                      required
                    />
                    <input
                      value={editTelefono}
                      onChange={(e) => setEditTelefono(e.target.value)}
                      placeholder="Teléfono"
                      className="w-full rounded-lg border px-3 py-2"
                    />
                    <textarea
                      value={editNotas}
                      onChange={(e) => setEditNotas(e.target.value)}
                      placeholder="Notas"
                      className="w-full rounded-lg border px-3 py-2"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="rounded-lg bg-[#1a1a1a] text-white px-3 py-1.5 text-sm">
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditId(null)}
                        className="rounded-lg border px-3 py-1.5 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-semibold">{c.nombre}</p>
                      {c.telefono && <p className="text-sm text-[#6c757d]">{c.telefono}</p>}
                      {c.notas && <p className="text-sm mt-1">{c.notas}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="text-sm text-[#6c757d] hover:text-[#1a1a1a] shrink-0"
                    >
                      Editar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
