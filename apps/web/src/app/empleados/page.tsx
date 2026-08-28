'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  CreateEmpleadoRequest,
  EmpleadoDto,
  Especialidad,
} from '@retimax/shared-types';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { apiFetch } from '@/lib/api';

const ESPECIALIDADES: { value: Especialidad; label: string }[] = [
  { value: Especialidad.MECANICO, label: 'Mecánico' },
  { value: Especialidad.ELECTRICO, label: 'Eléctrico' },
  { value: Especialidad.PINTOR, label: 'Pintor' },
  { value: Especialidad.MANTENIMIENTO_GENERAL, label: 'Mantenimiento general' },
  { value: Especialidad.OTRO, label: 'Otro' },
];

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<EmpleadoDto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EmpleadoDto | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otraEspecialidad, setOtraEspecialidad] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    especialidad: Especialidad.MECANICO as Especialidad,
  });

  async function load() {
    const data = await apiFetch<EmpleadoDto[]>('/empleados?incluirInactivos=true');
    setEmpleados(data);
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      password: '',
      especialidad: Especialidad.MECANICO,
    });
    setOtraEspecialidad('');
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(emp: EmpleadoDto) {
    setEditing(emp);
    setForm({
      nombre: emp.nombre,
      apellido: emp.apellido,
      email: emp.email,
      telefono: emp.telefono ?? '',
      password: '',
      especialidad: emp.especialidad,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editing) {
        await apiFetch(`/empleados/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            nombre: form.nombre,
            apellido: form.apellido,
            email: form.email,
            telefono: form.telefono || undefined,
            especialidad: form.especialidad,
            ...(form.password ? { password: form.password } : {}),
          }),
        });
      } else {
        const payload: CreateEmpleadoRequest = {
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
          password: form.password,
          especialidad: form.especialidad,
          telefono: form.telefono || undefined,
        };
        await apiFetch('/empleados', { method: 'POST', body: JSON.stringify(payload) });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar empleado');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Desactivar este empleado?')) return;
    await apiFetch(`/empleados/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <AuthGuard adminOnly>
      <AppShell>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Empleados</h2>
              <p className="text-sm text-[#6c757d]">Trabajadores del taller con acceso al sistema</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="rounded-lg bg-[#f5c842] px-4 py-2 font-semibold text-sm"
            >
              + Nuevo empleado
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="rounded-xl bg-white border p-6 space-y-4">
              <h3 className="font-semibold">{editing ? 'Editar empleado' : 'Registrar empleado'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre *"
                  className="rounded-lg border px-3 py-2"
                  required
                />
                <input
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                  placeholder="Apellido *"
                  className="rounded-lg border px-3 py-2"
                  required
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email (usuario de acceso) *"
                  className="rounded-lg border px-3 py-2 sm:col-span-2"
                  required
                />
                <input
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="Teléfono"
                  className="rounded-lg border px-3 py-2"
                />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editing ? 'Nueva contraseña (opcional)' : 'Contraseña *'}
                  className="rounded-lg border px-3 py-2"
                  required={!editing}
                />
                <div className="sm:col-span-2 flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm mb-1">Especialidad *</label>
                    <select
                      value={form.especialidad}
                      onChange={(e) => setForm({ ...form, especialidad: e.target.value as Especialidad })}
                      className="w-full rounded-lg border px-3 py-2"
                      required
                    >
                      {ESPECIALIDADES.map((e) => (
                        <option key={e.value} value={e.value}>
                          {e.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {form.especialidad === Especialidad.OTRO && (
                    <input
                      value={otraEspecialidad}
                      onChange={(e) => setOtraEspecialidad(e.target.value)}
                      placeholder="Describir especialidad"
                      className="rounded-lg border px-3 py-2 flex-1 min-w-[200px]"
                    />
                  )}
                </div>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#1a1a1a] text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : editing ? 'Actualizar' : 'Crear empleado y usuario'}
                </button>
                <button type="button" onClick={resetForm} className="rounded-lg border px-4 py-2 text-sm">
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="rounded-xl bg-white border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3">Nombre</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Especialidad</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {empleados.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{e.nombreCompleto}</td>
                    <td className="p-3">{e.email}</td>
                    <td className="p-3">{e.especialidad.replace(/_/g, ' ')}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          e.activo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {e.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button onClick={() => startEdit(e)} className="text-[#1a1a1a] underline text-xs">
                        Editar
                      </button>
                      {e.activo && (
                        <button onClick={() => handleDelete(e.id)} className="text-red-600 underline text-xs">
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
