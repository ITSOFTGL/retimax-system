'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function getTokens() {
  if (typeof window === 'undefined') return null;
  const accessToken = localStorage.getItem('retimax_access');
  const refreshToken = localStorage.getItem('retimax_refresh');
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('retimax_access', accessToken);
  localStorage.setItem('retimax_refresh', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('retimax_access');
  localStorage.removeItem('retimax_refresh');
  localStorage.removeItem('retimax_user');
}

export function setUser(user: unknown) {
  localStorage.setItem('retimax_user', JSON.stringify(user));
}

export function getUser<T>() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('retimax_user');
  return raw ? (JSON.parse(raw) as T) : null;
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('Sesión expirada');
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  setUser(data.usuario);
  return data.accessToken as string;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const tokens = getTokens();
  const headers = new Headers(init.headers);

  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (tokens?.accessToken) {
    headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }

  let res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401 && tokens?.refreshToken) {
    const newAccess = await refreshAccessToken(tokens.refreshToken);
    headers.set('Authorization', `Bearer ${newAccess}`);
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error de red' }));
    throw new Error(Array.isArray(err.message) ? err.message.join(', ') : err.message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Credenciales inválidas' }));
    throw new Error(err.message ?? 'Credenciales inválidas');
  }
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  setUser(data.usuario);
  return data;
}

export async function logout() {
  const tokens = getTokens();
  if (tokens?.refreshToken) {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    }).catch(() => undefined);
  }
  clearTokens();
}

export function imageUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
}
