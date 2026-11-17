/**
 * CalzaCV — tipos del dominio.
 *
 * Aquí conviven tres planos que NUNCA se mezclan:
 *
 *  1. `Sugerencia`         → lo que propone el matcher local. Es derivado (se recalcula) y
 *                            siempre viene con su explicación.
 *  2. `CorreccionUsuario`  → lo que corrigió la persona. Vive en un campo aparte
 *                            (`EstadoApp.correcciones`), nunca pisa la sugerencia.
 *  3. `EtiquetaReferencia` → etiqueta de un benchmark externo. NO EXISTE TODAVÍA: en esta
 *                            versión `EstadoApp.referencias` se mantiene vacío y la interfaz
 *                            lo muestra como «no disponible». No se inventa ground truth.
 */

/** Los cuatro estados posibles de un requisito. */
export type Estado =
  | 'coincide'
  | 'coincidencia_posible'
  | 'brecha'
  | 'informacion_insuficiente';

/** Un requisito detectado en la oferta (o agregado a mano por la persona). */
export interface Requisito {
  id: string;
  /** Texto del requisito tal como se evalúa. */
  texto: string;
  /** Frase literal de la oferta que originó el requisito (evidencia del lado oferta). */
  fraseOferta: string;
  /** Línea (1-based) de la frase dentro del texto pegado; `null` si fue agregado a mano. */
  linea: number | null;
  origen: 'segmentacion' | 'manual';
}

/** Una evidencia declarada en el perfil de la persona. */
export interface EvidenciaPerfil {
  id: string;
  /** Qué demuestra o sostiene esta evidencia. */
  texto: string;
  /** Respaldo libre (actividad, curso, proyecto). Opcional. */
  respaldo: string;
}

/** Propuesta del matcher local para un requisito. Derivada: no se persiste. */
export interface Sugerencia {
  estado: Estado;
  /** Explicación en lenguaje llano de por qué se propone ese estado. */
  explicacion: string;
  /** Términos del requisito que aparecen en la evidencia del perfil. */
  terminosCubiertos: string[];
  /** Términos del requisito que NO aparecen en la evidencia del perfil. */
  terminosNoCubiertos: string[];
  /** Id de la evidencia del perfil con la que se comparó (si hubo alguna coincidencia). */
  evidenciaVinculadaId: string | null;
}

/** Corrección explícita de la persona. Campo aparte: no modifica la sugerencia. */
export interface CorreccionUsuario {
  estado: Estado;
  nota: string;
  /** Fecha ISO de la última corrección. */
  fecha: string;
}

/**
 * Etiqueta de referencia (benchmark externo). Reservada y vacía en esta versión:
 * no existe benchmark, por lo que nunca se rellena ni se sintetiza.
 */
export interface EtiquetaReferencia {
  estado: Estado;
  nota: string;
  /** Procedencia de la etiqueta, p. ej. «benchmark externo». */
  fuente: string;
}

/** Estado completo de la aplicación (lo que se persiste en el navegador). */
export interface EstadoApp {
  /** Versión del formato guardado, para poder migrar o descartar en el futuro. */
  version: number;
  /**
   * De dónde vienen los datos que hay en pantalla:
   *   - 'demo'   → datos ficticios de ejemplo (se avisa con un banner visible);
   *   - 'usuario' → datos reales de la persona.
   */
  origen: 'demo' | 'usuario';
  /** Texto de la oferta pegado por la persona. */
  oferta: string;
  requisitos: Requisito[];
  evidenciasPerfil: EvidenciaPerfil[];
  /** Correcciones de la persona, indexadas por `Requisito.id`. */
  correcciones: Record<string, CorreccionUsuario>;
  /** Etiquetas de referencia externa, indexadas por `Requisito.id`. Siempre vacío en v1. */
  referencias: Record<string, EtiquetaReferencia>;
}

/** Un requisito junto con todo lo que hay que mostrar sobre él. */
export interface FilaComparacion {
  requisito: Requisito;
  sugerencia: Sugerencia;
  /** Estado final que se muestra, y de dónde viene. */
  estadoMostrado: Estado;
  /** `usuario` si hay corrección manual; `sistema` si se muestra la sugerencia. */
  origenMostrado: 'usuario' | 'sistema';
  correccion: CorreccionUsuario | null;
  /** Referencia externa: `null` porque todavía no existe benchmark. */
  referencia: EtiquetaReferencia | null;
  /** Evidencia del perfil con la que se comparó (para mostrarla al lado). */
  evidenciaVinculada: EvidenciaPerfil | null;
}
