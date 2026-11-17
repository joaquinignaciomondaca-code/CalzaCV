/**
 * Migraciones del formato de datos guardados en el navegador.
 *
 * v1 → v2: se agrega el campo `origen` ('demo' | 'usuario'), que permite distinguir
 * los datos ficticios de la demo de los datos de la persona. La migración es
 * conservadora: si la oferta guardada es exactamente la de la demo, el estado se
 * marca como 'demo' (para que no parezca un análisis real); en cualquier otro caso
 * se marca como 'usuario'.
 */

import { OFERTA_DEMO } from '../dominio/datos-demo';
import type { EstadoApp } from '../dominio/tipos';

export function migrarV1AV2(dato: unknown): EstadoApp | null {
  if (typeof dato !== 'object' || dato === null) return null;
  const anterior = dato as Record<string, unknown>;
  if (anterior.version !== 1) return null;

  const oferta = typeof anterior.oferta === 'string' ? anterior.oferta : '';
  const requisitos = Array.isArray(anterior.requisitos) ? anterior.requisitos : [];
  const evidencias = Array.isArray(anterior.evidenciasPerfil) ? anterior.evidenciasPerfil : [];

  return {
    version: 2,
    origen: oferta.trim() === OFERTA_DEMO.trim() ? 'demo' : 'usuario',
    oferta,
    requisitos: requisitos as EstadoApp['requisitos'],
    evidenciasPerfil: evidencias as EstadoApp['evidenciasPerfil'],
    correcciones:
      typeof anterior.correcciones === 'object' && anterior.correcciones !== null
        ? (anterior.correcciones as EstadoApp['correcciones'])
        : {},
    referencias:
      typeof anterior.referencias === 'object' && anterior.referencias !== null
        ? (anterior.referencias as EstadoApp['referencias'])
        : {},
  };
}
