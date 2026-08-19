import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RETIMAX — Gestión de Maquinaria',
  description: 'Sistema de gestión del ciclo de vida de maquinaria industrial',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
