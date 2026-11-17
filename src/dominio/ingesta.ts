/**
 * Conversión de un resumen de perfil pegado en evidencias.
 *
 * Reglas simples y declaradas (sin IA, sin OCR, sin lectura de archivos):
 *   1. Se recorre el texto línea por línea.
 *   2. Las líneas vacías o con solo espacios se ignoran.
 *   3. Se quita la viñeta inicial («-», «•», «*», «1.», «1)»).
 *   4. Las líneas que son encabezados de CV («Experiencia:», «IDIOMAS», «Educación») se ignoran.
 *   5. Las líneas repetidas se descartan (comparación por texto normalizado).
 *   6. Las líneas que ya coinciden con una evidencia existente se descartan.
 *
 * El texto se trata SIEMPRE como texto plano: no se interpreta como HTML ni se interpreta nada.
 * Quien lo pega decide qué incluir; la aplicación solo lo ordena.
 */

import { normalizar } from './normalizacion';

/** Encabezados típicos de un currículum: no son evidencia, son títulos de sección. */
export const ENCABEZADOS_CV: ReadonlySet<string> = new Set([
  'perfil', 'resumen', 'resumen profesional', 'objetivo', 'objetivos', 'curriculum', 'cv',
  'experiencia', 'experiencia laboral', 'experiencia profesional', 'trayectoria',
  'historial laboral', 'empleo', 'empleos', 'trabalhos',
  'educacion', 'formacion', 'formacion academica', 'estudios', 'titulos', 'titulo profesional',
  'habilidades', 'habilidades duras', 'habilidades blandas', 'competencias', 'conocimientos',
  'herramientas', 'tecnologias', 'idiomas', 'certificaciones', 'certificados', 'cursos',
  'proyectos', 'trabajos', 'logros', 'destacados', 'referencias', 'publicaciones',
  'datos personales', 'informacion personal', 'contacto', 'datos de contacto',
  'disponibilidad', 'disponibilidades', 'licencias', 'patentes', 'reconocimientos',
  'organizaciones', 'participacion', 'intereses', 'referencias laborales',
]);

/** Viñeta inicial: exige al menos un espacio después para no romper «-5 casos». */
const PREFIJO_VINETA = /^\s*(?:[-*+•·–—]|\d{1,2}[.)])\s+/;

export interface ResultadoIngesta {
  /** Fragmentos nuevos que se convertirán en evidencias. */
  fragmentos: string[];
  /** Líneas repetidas dentro del texto pegado. */
  duplicados: number;
  /** Líneas que ya coinciden con una evidencia existente. */
  yaExistentes: number;
  /** Líneas descartadas por ser encabezados de CV. */
  encabezados: number;
  /** Líneas vacías o con solo espacios. */
  vacias: number;
}

/** ¿La línea es un encabezado de sección de CV y no una evidencia? */
export function esEncabezadoCv(linea: string): boolean {
  const recortada = linea.trim();
  if (recortada === '') return false;

  const sinPuntos = recortada.replace(/:+\s*$/, '').trim();
  const clave = normalizar(sinPuntos);
  if (clave === '') return false;

  if (ENCABEZADOS_CV.has(clave)) return true;

  // «Sección:» con pocas palabras también se considera encabezado.
  if (recortada.endsWith(':')) {
    const palabras = clave.split(' ').filter(Boolean);
    return palabras.length > 0 && palabras.length <= 4;
  }

  return false;
}

/**
 * Convierte un texto pegado en una lista de evidencias.
 * @param texto texto pegado por la persona (se trata como texto plano)
 * @param existentes textos de las evidencias que ya hay (no se duplican ni se pierden)
 */
export function convertirTextoEnEvidencias(texto: string, existentes: string[] = []): ResultadoIngesta {
  const resultado: ResultadoIngesta = {
    fragmentos: [],
    duplicados: 0,
    yaExistentes: 0,
    encabezados: 0,
    vacias: 0,
  };

  const vistas = new Set<string>();
  const clavesExistentes = new Set(existentes.map((existente) => normalizar(existente)));

  for (const lineaCruda of texto.split(/\r?\n/)) {
    const recortada = lineaCruda.trim();
    if (recortada === '') {
      resultado.vacias++;
      continue;
    }

    const sinVineta = recortada.replace(PREFIJO_VINETA, '').trim();
    if (sinVineta === '') {
      resultado.vacias++;
      continue;
    }

    if (esEncabezadoCv(sinVineta)) {
      resultado.encabezados++;
      continue;
    }

    const clave = normalizar(sinVineta);
    if (clave === '') {
      resultado.vacias++;
      continue;
    }

    if (vistas.has(clave)) {
      resultado.duplicados++;
      continue;
    }
    vistas.add(clave);

    if (clavesExistentes.has(clave)) {
      resultado.yaExistentes++;
      continue;
    }

    resultado.fragmentos.push(sinVineta);
  }

  return resultado;
}
