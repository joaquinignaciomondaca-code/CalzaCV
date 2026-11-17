/**
 * Segmentación de la oferta pegada.
 *
 * Reglas simples y declaradas, sin IA y sin extracción «inteligente»:
 *   1. Se trabaja línea por línea sobre el texto pegado (se conserva el número de línea).
 *   2. Una línea de encabezado («Requisitos del puesto:», «Deseables:») abre un bloque:
 *      las líneas siguientes son requisitos candidatos hasta una línea vacía.
 *   3. Las viñetas («-», «*», «•», «1.») siempre son candidatas.
 *   4. Una línea corriente que contenga una frase de requisito también es candidata.
 *   5. Se descartan líneas de ruido (correos, enlaces, teléfonos, salario, postulación).
 *   6. Se eliminan duplicados por texto normalizado.
 */

import { nuevoId } from './ids';
import { normalizar } from './normalizacion';
import type { Requisito } from './tipos';

const PREFIJO_VINETA = /^\s*(?:[-*+•·–—]|\d{1,2}[.)])\s*/;

const ENCABEZADO = /^(requisitos?|perfil|que\s+buscamos|deseables?|valorable?s?|preferentes?|competencias|habilidades|conocimientos|experiencia|condiciones)\b/i;

const FRASE_REQUISITO = /\b(se\s+requiere|se\s+solicita|requerimos|buscamos|valoramos|deseamos|experiencia\s+(?:en|con)|conocimientos?\s+(?:en|de|con)|manejo\s+de|dominio\s+de|habilidad\s+(?:en|con)|valorable|deseable|preferente|obligatorio|indispensable)\b/i;

const RUIDO = /(https?:\/\/|www\.|[\w.+-]+@[\w-]+\.[\w.]+|\+\d{2}[\s-]?\d{3}|\bsalario\b|remuneraci[oó]n|beneficios|\bpostul\b|env[ií]a\s+tu\s+cv|cv\s+a\s+la|entrevista|contacto)/i;

// 3 caracteres: permite requisitos cortos y reales como «SQL» o «BI».
const LARGO_MINIMO = 3;

/** ¿La línea es ruido conocido (contacto, salario, postulación…)? */
export function esRuido(linea: string): boolean {
  return RUIDO.test(linea);
}

/**
 * Divide el texto de la oferta en requisitos candidatos.
 * Devuelve los requisitos con su frase de origen y la línea donde aparecen.
 */
export function segmentarOferta(texto: string): Requisito[] {
  const lineas = texto.split('\n');
  const requisitos: Requisito[] = [];
  const vistos = new Set<string>();
  let enBloqueDeRequisitos = false;

  lineas.forEach((lineaCruda, indice) => {
    const linea = lineaCruda.trim();

    if (linea === '') {
      enBloqueDeRequisitos = false;
      return;
    }

    const tieneVineta = PREFIJO_VINETA.test(lineaCruda);

    const esEncabezado =
      !tieneVineta && (ENCABEZADO.test(linea) || (linea.endsWith(':') && linea.length <= 60));
    if (esEncabezado) {
      enBloqueDeRequisitos = true;
      return;
    }

    const esCandidata =
      tieneVineta ||
      (enBloqueDeRequisitos && !esRuido(linea)) ||
      (!tieneVineta && FRASE_REQUISITO.test(linea));

    if (!esCandidata) return;

    const frase = linea.replace(PREFIJO_VINETA, '').trim();
    if (frase.length < LARGO_MINIMO) return;
    if (esRuido(frase)) return;

    const clave = normalizar(frase);
    if (clave === '' || vistos.has(clave)) return;
    vistos.add(clave);

    requisitos.push({
      id: nuevoId('req'),
      texto: frase,
      fraseOferta: frase,
      linea: indice + 1,
      origen: 'segmentacion',
    });
  });

  return requisitos;
}
