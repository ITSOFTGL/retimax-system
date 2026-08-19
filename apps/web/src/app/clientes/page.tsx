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

  async function load() {
    setClientes(await apiFetch<ClienteDto[]>('/clientes'));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await apiFetch('/clientes', {
      method: 'POST',
      body: JSON.stringify({ nombre, telefono: telefono || undefined, notas: notas || undefined }),
    });
    setNombre('');
    setTelefono('');
    setNotas('');
    await load();
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
          <div className="space-y-2">
            {clientes.map((c) => (
              <div key={c.id} className="rounded-lg bg-white border p-4">
                <p className="font-semibold">{c.nombre}</p>
                {c.telefono && <p className="text-sm text-[#6c757d]">{c.telefono}</p>}
                {c.notas && <p className="text-sm mt-1">{c.notas}</p>}
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
