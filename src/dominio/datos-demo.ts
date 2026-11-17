/**
 * Datos de demostración COMPLETAMENTE FICTICIOS.
 *
 * La oferta y el perfil de ejemplo están inventados para ilustrar el flujo:
 * no corresponden a ninguna persona, empresa, puesto ni oferta real, y no contienen
 * datos personales, correos ni currículums reales.
 */

import { nuevoId } from './ids';
import { segmentarOferta } from './segmentacion';
import type { EvidenciaPerfil, EstadoApp } from './tipos';
import { VERSION_DATOS } from '../almacenamiento/version';

export const OFERTA_DEMO = `CalzaCV — oferta de ejemplo (datos totalmente ficticios)

Empresa ficticia: Panadería Aurora SpA
Cargo: Analista de operaciones (jornada completa)

Requisitos del puesto:
- Experiencia en Excel y tablas de cálculo para reportes diarios
- Conocimientos en SQL y bases de datos
- Manejo de control de inventario en bodega
- Trabajo en equipo y buena comunicación
- Inglés básico para lectura de documentación técnica

Deseables:
- Conocimiento en Power BI
- Inglés intermedio
- Varios según experiencia

Salario a conversar en entrevista.
Postular en el sitio de ejemplo.`;

/** Evidencias ficticias del perfil de ejemplo. */
export const PERFIL_DEMO: Array<{ texto: string; respaldo: string }> = [
  {
    texto: 'Uso de Excel y tablas de cálculo en reportes diarios',
    respaldo: 'Ejercicio ficticio de análisis de ventas',
  },
  {
    texto: 'Consultas SQL y diseño de bases de datos',
    respaldo: 'Proyecto ficticio de inventario',
  },
  {
    texto: 'Control de inventario en bodega durante un conteo cíclico',
    respaldo: 'Simulación ficticia de almacén',
  },
  {
    texto: 'Trabajo en equipo con el área de operaciones',
    respaldo: 'Actividad de práctica ficticia',
  },
  {
    texto: 'Inglés básico para lectura de documentación técnica',
    respaldo: 'Curso de ejemplo',
  },
];

/** Estado inicial con la demo ficticia cargada. */
export function estadoDemo(): EstadoApp {
  const evidenciasPerfil: EvidenciaPerfil[] = PERFIL_DEMO.map((evidencia) => ({
    id: nuevoId('evi'),
    texto: evidencia.texto,
    respaldo: evidencia.respaldo,
  }));

  return {
    version: VERSION_DATOS,
    origen: 'demo',
    oferta: OFERTA_DEMO,
    requisitos: segmentarOferta(OFERTA_DEMO),
    evidenciasPerfil,
    correcciones: {},
    referencias: {},
  };
}
