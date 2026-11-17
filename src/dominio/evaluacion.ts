/**
 * Ensamblado de la comparación: une requisito, sugerencia del matcher, corrección de la
 * persona y referencia externa, sin mezclarlos.
 */

import { sugerir } from './matching';
import type {
  CorreccionUsuario,
  EstadoApp,
  EtiquetaReferencia,
  EvidenciaPerfil,
  FilaComparacion,
  Requisito,
} from './tipos';

/** Estado que se muestra en pantalla y de dónde proviene. */
export function construirFila(
  requisito: Requisito,
  evidencias: EvidenciaPerfil[],
  correcciones: Record<string, CorreccionUsuario>,
  referencias: Record<string, EtiquetaReferencia>,
): FilaComparacion {
  const sugerencia = sugerir(requisito, evidencias);
  const correccion = correcciones[requisito.id] ?? null;
  const referencia = referencias[requisito.id] ?? null;

  return {
    requisito,
    sugerencia,
    estadoMostrado: correccion ? correccion.estado : sugerencia.estado,
    origenMostrado: correccion ? 'usuario' : 'sistema',
    correccion,
    referencia,
    evidenciaVinculada:
      sugerencia.evidenciaVinculadaId !== null
        ? (evidencias.find((evidencia) => evidencia.id === sugerencia.evidenciaVinculadaId) ?? null)
        : null,
  };
}

/** Construye todas las filas de la comparación, en el orden de los requisitos. */
export function construirFilas(estado: EstadoApp): FilaComparacion[] {
  return estado.requisitos.map((requisito) =>
    construirFila(requisito, estado.evidenciasPerfil, estado.correcciones, estado.referencias),
  );
}
