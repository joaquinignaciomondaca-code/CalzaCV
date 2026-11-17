/**
 * Matcher local: compara los términos de un requisito con los términos de la evidencia
 * del perfil. Comparación literal y conservadora (ver `normalizacion.ts`).
 *
 * Reglas:
 *   - si el requisito no deja términos comparables → `informacion_insuficiente`;
 *   - si todos los términos aparecen en alguna evidencia → `coincide`;
 *   - si aparece al menos uno → `coincidencia_posible`;
 *   - si no aparece ninguno → `brecha` («no se encontró evidencia en tu perfil»).
 *
 * No hay puntaje, ni ponderación, ni medida global: solo el estado de cada requisito.
 */

import { terminosComparables } from './normalizacion';
import type { EvidenciaPerfil, Requisito, Sugerencia } from './tipos';

function listar(terminos: string[]): string {
  return terminos.join(', ');
}

/** Propone un estado para un requisito, con su explicación y los términos de apoyo. */
export function sugerir(requisito: Requisito, evidencias: EvidenciaPerfil[]): Sugerencia {
  const terminosRequisito = terminosComparables(requisito.texto);

  if (terminosRequisito.length === 0) {
    return {
      estado: 'informacion_insuficiente',
      explicacion:
        'El requisito es demasiado general para buscar evidencia automáticamente. ' +
        'Escríbelo con más detalle (por ejemplo, la herramienta o el contexto) para que la comparación sea útil.',
      terminosCubiertos: [],
      terminosNoCubiertos: [],
      evidenciaVinculadaId: null,
    };
  }

  let mejorCubiertos: string[] = [];
  let mejorEvidenciaId: string | null = null;

  for (const evidencia of evidencias) {
    const terminosEvidencia = new Set(terminosComparables(evidencia.texto));
    const cubiertos = terminosRequisito.filter((termino) => terminosEvidencia.has(termino));
    if (cubiertos.length > mejorCubiertos.length) {
      mejorCubiertos = cubiertos;
      mejorEvidenciaId = evidencia.id;
    }
  }

  const noCubiertos = terminosRequisito.filter((termino) => !mejorCubiertos.includes(termino));

  if (mejorCubiertos.length === 0) {
    return {
      estado: 'brecha',
      explicacion:
        `No se encontró evidencia en tu perfil para este requisito. Se buscaron los términos: ${listar(terminosRequisito)}. ` +
        '«Brecha» significa que no se encontró evidencia en tu perfil; no afirma que carezcas de la habilidad.',
      terminosCubiertos: [],
      terminosNoCubiertos: noCubiertos,
      evidenciaVinculadaId: null,
    };
  }

  if (noCubiertos.length === 0) {
    return {
      estado: 'coincide',
      explicacion:
        `Se encontró evidencia en tu perfil para los ${mejorCubiertos.length} términos del requisito: ${listar(mejorCubiertos)}.`,
      terminosCubiertos: mejorCubiertos,
      terminosNoCubiertos: [],
      evidenciaVinculadaId: mejorEvidenciaId,
    };
  }

  return {
    estado: 'coincidencia_posible',
    explicacion:
      `La evidencia de tu perfil cubre ${mejorCubiertos.length} de ${terminosRequisito.length} términos ` +
      `(${listar(mejorCubiertos)}). Faltan: ${listar(noCubiertos)}.`,
    terminosCubiertos: mejorCubiertos,
    terminosNoCubiertos: noCubiertos,
    evidenciaVinculadaId: mejorEvidenciaId,
  };
}
