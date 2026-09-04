function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '');
}

export function suggestEmpleadoEmail(nombre: string, apellido: string): string {
  const n = normalizeText(nombre);
  const a = normalizeText(apellido).replace(/\s+/g, '');
  if (!n || !a) return '';
  return `${n[0]}${a}@retimax.local`;
}

export function suggestEmpleadoUsername(
  carnet: string,
  nombre: string,
  apellido: string,
): string {
  if (carnet.trim()) return carnet.trim().toLowerCase().replace(/\s+/g, '');
  const n = normalizeText(nombre);
  const a = normalizeText(apellido).replace(/\s+/g, '');
  if (!n || !a) return '';
  return `${n[0]}${a}`;
}

export const SUGGESTED_EMPLEADO_PASSWORD = 'R3t1max2026$';

export function passwordMeetsPolicy(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
