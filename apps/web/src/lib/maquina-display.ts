import { MaquinaDto } from '@retimax/shared-types';

/** Título principal: "Fresadora Arno" */
export function maquinaTitulo(m: Pick<MaquinaDto, 'tipo' | 'marca'>): string {
  return `${m.tipo} ${m.marca}`.replace(/\s+/g, ' ').trim();
}

/** Subtítulo: modelo, sin año */
export function maquinaSubtitulo(m: Pick<MaquinaDto, 'modelo'>): string {
  return m.modelo;
}

export function maquinaEtiquetaCorta(
  m: Pick<MaquinaDto, 'tipo' | 'marca' | 'modelo'>,
): string {
  return `${maquinaTitulo(m)} · ${m.modelo}`;
}
