'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ProveedorDto } from '@retimax/shared-types';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { apiFetch } from '@/lib/api';

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<ProveedorDto[]>([]);
  const [nombre, setNombre] = useState('');

  async function load() {
    setProveedores(await apiFetch<ProveedorDto[]>('/proveedores'));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await apiFetch('/proveedores', {
      method: 'POST',
      body: JSON.stringify({ nombre }),
    });
    setNombre('');
    await load();
  }

  return (
    <AuthGuard>
      <AppShell>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Proveedores</h2>
          <form onSubmit={handleSubmit} className="rounded-xl bg-white border p-6 mb-6 flex gap-2">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del proveedor"
              className="flex-1 rounded-lg border px-3 py-2"
              required
            />
            <button type="submit" className="rounded-lg bg-[#f5c842] px-4 py-2 font-semibold text-sm">
              Agregar
            </button>
          </form>
          <div className="space-y-2">
            {proveedores.map((p) => (
              <div key={p.id} className="rounded-lg bg-white border p-4 font-medium">
                {p.nombre}
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
