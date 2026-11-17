/**
 * Vistas: construcción del DOM de los tres paneles.
 * Cada estado se muestra con símbolo + texto (nunca solo con color).
 */

import { crear, vaciar } from './dom';
import type { Estado, EvidenciaPerfil, FilaComparacion, Requisito } from '../dominio/tipos';

const FORMATO_FECHA = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });

export const ESTADOS_UI: Record<Estado, { etiqueta: string; simbolo: string; clase: string }> = {
  coincide: { etiqueta: 'Coincide', simbolo: '✔', clase: 'estado--coincide' },
  coincidencia_posible: { etiqueta: 'Coincidencia posible', simbolo: '≈', clase: 'estado--posible' },
  brecha: { etiqueta: 'Brecha de evidencia', simbolo: '!', clase: 'estado--brecha' },
  informacion_insuficiente: { etiqueta: 'Información insuficiente', simbolo: '?', clase: 'estado--insuficiente' },
};

export function insigniaEstado(estado: Estado): HTMLElement {
  const datos = ESTADOS_UI[estado];
  return crear('span', { class: `insignia ${datos.clase}` }, [
    crear('span', { class: 'insignia__simbolo', 'aria-hidden': 'true', texto: datos.simbolo }),
    crear('span', { class: 'insignia__texto', texto: datos.etiqueta }),
  ]);
}

export interface ManejadoresRequisitos {
  alCambiarTexto(id: string, texto: string): void;
  alEliminar(id: string): void;
}

export function renderRequisitos(
  contenedor: HTMLElement,
  requisitos: Requisito[],
  manejadores: ManejadoresRequisitos,
): void {
  vaciar(contenedor);

  if (requisitos.length === 0) {
    contenedor.append(
      crear('li', { class: 'vacio' }, [
        crear('p', {
          texto:
            'Todavía no hay requisitos. Pega una oferta y pulsa «Analizar oferta», o agrega uno a mano.',
        }),
      ]),
    );
    return;
  }

  for (const requisito of requisitos) {
    const entrada = crear('input', {
      class: 'entrada',
      type: 'text',
      value: requisito.texto,
      'aria-label': `Texto del requisito: ${requisito.texto}`,
    });
    entrada.addEventListener('change', () => manejadores.alCambiarTexto(requisito.id, entrada.value));

    const origen = crear('span', {
      class: 'etiqueta-etiqueta',
      texto: requisito.origen === 'manual' ? 'agregado a mano' : 'detectado en la oferta',
    });

    const linea = crear('span', {
      class: 'detalle',
      texto: requisito.linea !== null ? `línea ${requisito.linea} de la oferta` : 'sin frase de oferta',
    });

    const botonEliminar = crear('button', {
      type: 'button',
      class: 'boton boton--icono',
      'aria-label': `Eliminar requisito: ${requisito.texto}`,
      title: 'Eliminar requisito',
      texto: '×',
    });
    botonEliminar.addEventListener('click', () => manejadores.alEliminar(requisito.id));

    contenedor.append(
      crear('li', { class: 'item-lista' }, [
        crear('div', { class: 'item-lista__cabecera' }, [origen, linea]),
        entrada,
        crear('div', { class: 'item-lista__pie' }, [
          crear('span', {
            class: 'detalle detalle--frase',
            texto: requisito.fraseOferta ? `«${requisito.fraseOferta}»` : 'sin frase de oferta',
          }),
          botonEliminar,
        ]),
      ]),
    );
  }
}

export interface ManejadoresEvidencias {
  alCambiarTexto(id: string, texto: string): void;
  alCambiarRespaldo(id: string, respaldo: string): void;
  alEliminar(id: string): void;
}

export function renderEvidencias(
  contenedor: HTMLElement,
  evidencias: EvidenciaPerfil[],
  manejadores: ManejadoresEvidencias,
): void {
  vaciar(contenedor);

  if (evidencias.length === 0) {
    contenedor.append(
      crear('li', { class: 'vacio' }, [
        crear('p', {
          texto:
            'No hay evidencias registradas. Agrega actividades, proyectos o estudios que sustenten tu perfil.',
        }),
      ]),
    );
    return;
  }

  for (const evidencia of evidencias) {
    const area = crear('textarea', {
      class: 'entrada entrada--area',
      rows: 2,
      'aria-label': `Evidencia: ${evidencia.texto}`,
    });
    area.value = evidencia.texto;
    area.addEventListener('change', () => manejadores.alCambiarTexto(evidencia.id, area.value));

    const respaldo = crear('input', {
      class: 'entrada',
      type: 'text',
      value: evidencia.respaldo,
      'aria-label': `Respaldo de la evidencia: ${evidencia.texto}`,
      placeholder: 'Respaldo (opcional): actividad, curso, proyecto…',
    });
    respaldo.addEventListener('change', () =>
      manejadores.alCambiarRespaldo(evidencia.id, respaldo.value),
    );

    const botonEliminar = crear('button', {
      type: 'button',
      class: 'boton boton--icono',
      'aria-label': `Eliminar evidencia: ${evidencia.texto}`,
      title: 'Eliminar evidencia',
      texto: '×',
    });
    botonEliminar.addEventListener('click', () => manejadores.alEliminar(evidencia.id));

    contenedor.append(
      crear('li', { class: 'item-lista' }, [
        area,
        respaldo,
        crear('div', { class: 'item-lista__pie' }, [crear('span', { class: 'detalle' }), botonEliminar]),
      ]),
    );
  }
}

export interface ManejadoresComparacion {
  alCorregir(idRequisito: string): void;
  alQuitarCorreccion(idRequisito: string): void;
}

export function renderComparacion(
  cuerpo: HTMLElement,
  filas: FilaComparacion[],
  manejadores: ManejadoresComparacion,
): void {
  vaciar(cuerpo);

  if (filas.length === 0) {
    const celdas = 5;
    cuerpo.append(
      crear('tr', {}, [
        crear('td', { class: 'vacio', colspan: celdas }, [
          crear('p', { texto: 'No hay requisitos que comparar todavía.' }),
        ]),
      ]),
    );
    return;
  }

  for (const fila of filas) {
    const id = fila.requisito.id;

    // 1. Requisito
    const celdaRequisito = crear('th', { scope: 'row', class: 'celda celda--requisito' }, [
      crear('p', { class: 'celda__principal', texto: fila.requisito.texto }),
      crear('p', { class: 'detalle', texto: fila.requisito.origen === 'manual' ? 'agregado a mano' : 'detectado en la oferta' }),
    ]);

    // 2. Evidencia de la oferta
    const celdaOferta = crear('td', { class: 'celda celda--oferta' }, [
      crear('p', { class: 'celda__principal', texto: fila.requisito.fraseOferta || 'Sin frase de oferta' }),
      crear('p', {
        class: 'detalle',
        texto: fila.requisito.linea !== null ? `línea ${fila.requisito.linea}` : 'requisito manual',
      }),
    ]);

    // 3. Evidencia del perfil
    const celdaPerfil = crear('td', { class: 'celda celda--perfil' }, [
      fila.evidenciaVinculada
        ? crear('p', { class: 'celda__principal', texto: fila.evidenciaVinculada.texto })
        : crear('p', { class: 'celda__principal celda__vacia', texto: 'Sin evidencia que coincida en tu perfil' }),
      fila.evidenciaVinculada && fila.evidenciaVinculada.respaldo
        ? crear('p', { class: 'detalle', texto: `Respaldo: ${fila.evidenciaVinculada.respaldo}` })
        : null,
    ].filter((n): n is HTMLParagraphElement => n !== null));

    // 4. Sugerencia del sistema (derivada, no se modifica con las correcciones)
    const detalles = crear('details', { class: 'detalles' }, [
      crear('summary', { texto: 'Ver términos comparados' }),
      crear('ul', { class: 'lista-terminos' }, [
        crear('li', { texto: `Cubiertos: ${fila.sugerencia.terminosCubiertos.join(', ') || '—'}` }),
        crear('li', { texto: `No cubiertos: ${fila.sugerencia.terminosNoCubiertos.join(', ') || '—'}` }),
      ]),
    ]);

    const celdaSugerencia = crear('td', { class: 'celda celda--sugerencia' }, [
      crear('div', { class: 'celda__estado' }, [insigniaEstado(fila.sugerencia.estado)]),
      crear('p', { class: 'detalle', texto: fila.sugerencia.explicacion }),
      detalles,
      crear('p', {
        class: 'detalle detalle--referencia',
        texto: fila.referencia
          ? `Referencia externa (${fila.referencia.fuente}): ${fila.referencia.estado}`
          : 'Referencia externa: no disponible (no existe benchmark en esta versión).',
      }),
    ]);

    // 5. Corrección de la persona
    const acciones: HTMLElement[] = [];
    if (fila.correccion) {
      const partes: Array<HTMLElement | null> = [
        crear('div', { class: 'celda__estado' }, [insigniaEstado(fila.correccion.estado)]),
        crear('p', { class: 'detalle', texto: 'Corregido por ti. La sugerencia del sistema se conserva.' }),
        fila.correccion.nota
          ? crear('p', { class: 'detalle detalle--nota', texto: `Nota: ${fila.correccion.nota}` })
          : null,
        crear('p', {
          class: 'detalle',
          texto: `Registrado el ${FORMATO_FECHA.format(new Date(fila.correccion.fecha))}`,
        }),
      ];
      for (const parte of partes) {
        if (parte) acciones.push(parte);
      }
    } else {
      acciones.push(
        crear('p', { class: 'detalle', texto: 'Sin corrección: se muestra la sugerencia del sistema.' }),
      );
    }

    const botonCorregir = crear('button', {
      type: 'button',
      class: 'boton boton--secundario',
      texto: fila.correccion ? 'Editar corrección' : 'Corregir',
    });
    botonCorregir.addEventListener('click', () => manejadores.alCorregir(id));
    acciones.push(botonCorregir);

    if (fila.correccion) {
      const botonQuitar = crear('button', {
        type: 'button',
        class: 'boton boton--peligro boton--compacto',
        texto: 'Quitar corrección',
      });
      botonQuitar.addEventListener('click', () => manejadores.alQuitarCorreccion(id));
      acciones.push(botonQuitar);
    }

    const celdaCorreccion = crear('td', { class: 'celda celda--correccion' }, acciones);

    cuerpo.append(crear('tr', {}, [celdaRequisito, celdaOferta, celdaPerfil, celdaSugerencia, celdaCorreccion]));
  }
}
