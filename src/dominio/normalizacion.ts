/**
 * Normalización y comparación de términos — conservadora y a propósito.
 *
 * Lo que SÍ hace:
 *   - ignora mayúsculas/minúsculas,
 *   - ignora acentos,
 *   - unifica puntuación y espacios,
 *   - aplica un diccionario de alias EXPLÍCITOS y documentado.
 *
 * Lo que NO hace (fuera de alcance en este incremento):
 *   - stemming o lematización («inventarios» NO se unifica con «inventario»),
 *   - similitud difusa o distances,
 *   - relaciones semánticas implícitas,
 *   - afirmaciones de que una habilidad equivale a otra salvo alias declarados aquí.
 */

/** Diccionario de alias declarados: notaciones distintas de una MISMA tecnología. */
export const ALIAS: Record<string, string> = {
  js: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  typescript: 'typescript',
  node: 'nodejs',
  nodejs: 'nodejs',
  postgres: 'postgresql',
  postgresql: 'postgresql',
  mssql: 'sqlserver',
  sqlserver: 'sqlserver',
};

/**
 * Palabras sin valor para comparar (función gramatical).
 * Se eliminan de los dos lados por igual, para no sesgar la comparación.
 */
export const PALABRAS_VACIAS: ReadonlySet<string> = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'y', 'o', 'u', 'con', 'sin', 'en', 'para', 'por', 'al', 'a', 'se',
  'que', 'su', 'sus', 'lo', 'es', 'son', 'ser', 'tiene', 'tienen',
  'mas', 'como', 'ante', 'sobre', 'entre', 'desde', 'hasta', 'cada',
  'muy', 'ya', 'todo', 'toda', 'todos', 'todas', 'otro', 'otra', 'durante',
]);

/**
 * Palabras genéricas de encabezado de requisito. No describen una habilidad concreta,
 * así que no sirven para buscar evidencia. Se eliminan solo si no dejan otro término:
 * «experiencia en Excel» se evalúa como «Excel», pero «experiencia» a secas no se
 * puede evaluar (queda como información insuficiente).
 */
export const PALABRAS_GENERICAS: ReadonlySet<string> = new Set([
  'experiencia', 'experiencias', 'conocimiento', 'conocimientos', 'manejo',
  'manejar', 'uso', 'dominio', 'destreza', 'destrezas', 'habilidad',
  'habilidades', 'competencia', 'competencias', 'segun', 'varios', 'varias',
  'diversos', 'diversas', 'etc',
]);

const DIACRITICOS = /[\u0300-\u036f]/g;
const NO_ALFANUMERICO = /[^a-z0-9+#]+/g;
const ESPACIOS = /\s+/g;

/** Minúsculas, sin acentos, sin puntuación, con espacios colapsados. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICOS, '')
    .replace(NO_ALFANUMERICO, ' ')
    .replace(ESPACIOS, ' ')
    .trim();
}

/** Divide un texto normalizado en términos. */
export function tokenizar(texto: string): string[] {
  const normalizado = normalizar(texto);
  if (normalizado === '') return [];
  return normalizado.split(' ');
}

/** Traduce un término (ya normalizado, en minúsculas) a su forma canónica si hay un alias. */
export function canonico(termino: string): string {
  return ALIAS[termino] ?? termino;
}

/**
 * Términos comparables de un texto: tokenizados, sin palabras vacías ni genéricas,
 * canónicos y sin repetir (conservando el orden de aparición).
 */
export function terminosComparables(texto: string): string[] {
  const vistos = new Set<string>();
  const resultado: string[] = [];
  for (const termino of tokenizar(texto)) {
    if (PALABRAS_VACIAS.has(termino) || PALABRAS_GENERICAS.has(termino)) continue;
    const canon = canonico(termino);
    if (vistos.has(canon)) continue;
    vistos.add(canon);
    resultado.push(canon);
  }
  return resultado;
}
