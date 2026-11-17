/**
 * Controlador de la aplicación: mantiene el estado, guarda en local y coordina las vistas.
 *
 * Reglas de provenance que se respetan aquí:
 *   - la sugerencia del matcher NUNCA se escribe en el estado: se recalcula siempre;
 *   - la corrección del usuario se guarda en `estado.correcciones`, en un campo aparte;
 *   - las referencias externas se guardan aparte y hoy están vacías (no hay benchmark).
 */

import {
  cargar,
  crearAlmacenLocal,
  exportarJSON,
  guardar,
  importarJSON,
  estadoInicial,
} from '../almacenamiento/local';
import type { Almacen } from '../almacenamiento/local';
import { estadoDemo } from '../dominio/datos-demo';
import { construirFilas } from '../dominio/evaluacion';
import { nuevoId } from '../dominio/ids';
import { segmentarOferta } from '../dominio/segmentacion';
import type { Estado, EstadoApp } from '../dominio/tipos';
import { porId } from './dom';
import { ESTADOS_UI, renderComparacion as pintarComparacion, renderEvidencias as pintarEvidencias, renderRequisitos as pintarRequisitos } from './vistas';

const FORMATO_FECHA = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });

export function iniciarApp(): void {
  const almacen: Almacen = crearAlmacenLocal();

  const areaOferta = porId<HTMLTextAreaElement>('oferta-texto');
  const listaRequisitos = porId<HTMLUListElement>('lista-requisitos');
  const listaEvidencias = porId<HTMLUListElement>('lista-evidencias');
  const cuerpoComparacion = porId<HTMLTableSectionElement>('filas-comparacion');
  const contadorRequisitos = porId<HTMLElement>('contador-requisitos');
  const aviso = porId<HTMLElement>('aviso-guardado');

  const dialogo = porId<HTMLDialogElement>('dialogo-correccion');
  const formDialogo = porId<HTMLFormElement>('form-correccion');
  const tituloDialogo = porId<HTMLElement>('dialogo-requisito');
  const notaDialogo = porId<HTMLTextAreaElement>('dialogo-nota');
  const botonQuitar = porId<HTMLButtonElement>('btn-quitar-correccion');

  // Estado en memoria; el almacén local es la persistencia.
  let estado: EstadoApp = cargar(almacen) ?? estadoDemo();
  let requisitoEnEdicion: string | null = null;

  function persistir(mensaje = 'Guardado en este navegador.'): void {
    guardar(almacen, estado);
    aviso.textContent = `${mensaje} (${FORMATO_FECHA.format(new Date())})`;
  }

  function renderGlobal(): void {
    contadorRequisitos.textContent = String(estado.requisitos.length);
  }

  function renderComparacion(): void {
    pintarComparacion(cuerpoComparacion, construirFilas(estado), {
      alCorregir: (id) => abrirDialogo(id),
      alQuitarCorreccion: (id) => {
        delete estado.correcciones[id];
        persistir('Corrección eliminada.');
        renderComparacion();
      },
    });
  }

  function renderRequisitos(): void {
    pintarRequisitos(listaRequisitos, estado.requisitos, {
      alCambiarTexto: (id, texto) => {
        const requisito = estado.requisitos.find((r) => r.id === id);
        if (!requisito) return;
        requisito.texto = texto;
        persistir('Requisito actualizado.');
        renderComparacion();
      },
      alEliminar: (id) => {
        estado.requisitos = estado.requisitos.filter((r) => r.id !== id);
        delete estado.correcciones[id];
        delete estado.referencias[id];
        persistir('Requisito eliminado.');
        renderRequisitos();
        renderComparacion();
        renderGlobal();
      },
    });
  }

  function renderEvidencias(): void {
    pintarEvidencias(listaEvidencias, estado.evidenciasPerfil, {
      alCambiarTexto: (id, texto) => {
        const evidencia = estado.evidenciasPerfil.find((e) => e.id === id);
        if (!evidencia) return;
        evidencia.texto = texto;
        persistir('Evidencia actualizada.');
        renderComparacion();
      },
      alCambiarRespaldo: (id, respaldo) => {
        const evidencia = estado.evidenciasPerfil.find((e) => e.id === id);
        if (!evidencia) return;
        evidencia.respaldo = respaldo;
        persistir('Evidencia actualizada.');
        renderComparacion();
      },
      alEliminar: (id) => {
        estado.evidenciasPerfil = estado.evidenciasPerfil.filter((e) => e.id !== id);
        persistir('Evidencia eliminada.');
        renderEvidencias();
        renderComparacion();
      },
    });
  }

  function renderTodo(): void {
    areaOferta.value = estado.oferta;
    renderRequisitos();
    renderEvidencias();
    renderComparacion();
    renderGlobal();
  }

  function abrirDialogo(idRequisito: string): void {
    const requisito = estado.requisitos.find((r) => r.id === idRequisito);
    if (!requisito) return;
    requisitoEnEdicion = idRequisito;
    const correccion = estado.correcciones[idRequisito] ?? null;

    tituloDialogo.textContent = requisito.texto;
    notaDialogo.value = correccion?.nota ?? '';

    const seleccion = formDialogo.querySelector<HTMLInputElement>(
      `input[name="estado"][value="${correccion?.estado ?? ''}"]`,
    );
    if (seleccion) seleccion.checked = true;

    botonQuitar.hidden = correccion === null;
    dialogo.showModal();
  }

  function aplicarCorreccion(): void {
    if (!requisitoEnEdicion) return;
    const elegido = formDialogo.querySelector<HTMLInputElement>('input[name="estado"]:checked');
    if (!elegido) {
      aviso.textContent = 'Selecciona un estado para guardar la corrección.';
      return;
    }
    const estadoElegido = elegido.value as Estado;
    estado.correcciones[requisitoEnEdicion] = {
      estado: estadoElegido,
      nota: notaDialogo.value.trim(),
      fecha: new Date().toISOString(),
    };
    requisitoEnEdicion = null;
    persistir('Corrección guardada. La sugerencia del sistema no se modificó.');
    renderComparacion();
  }

  // --- Acciones de la interfaz -------------------------------------------------

  porId<HTMLButtonElement>('btn-analizar').addEventListener('click', () => {
    const texto = areaOferta.value;
    estado.oferta = texto;
    const segmentados = segmentarOferta(texto);
    const previos = new Set(estado.requisitos.map((r) => r.texto.trim()));
    const nuevos = segmentados.filter((r) => !previos.has(r.texto.trim()));
    estado.requisitos = [...estado.requisitos, ...nuevos];
    persistir(
      nuevos.length > 0
        ? `Se agregaron ${nuevos.length} requisitos detectados.`
        : 'No se detectaron requisitos nuevos; revisa los existentes.',
    );
    renderRequisitos();
    renderComparacion();
    renderGlobal();
  });

  porId<HTMLButtonElement>('btn-demo').addEventListener('click', () => {
    estado = estadoDemo();
    persistir('Demo ficticia cargada.');
    renderTodo();
  });

  porId<HTMLButtonElement>('btn-agregar-requisito').addEventListener('click', () => {
    const requisito = {
      id: nuevoId('req'),
      texto: '',
      fraseOferta: '',
      linea: null,
      origen: 'manual' as const,
    };
    estado.requisitos = [...estado.requisitos, requisito];
    persistir('Requisito agregado. Escribe su texto.');
    renderRequisitos();
    renderGlobal();
    renderComparacion();
    listaRequisitos.querySelector<HTMLInputElement>('.item-lista:last-child input')?.focus();
  });

  porId<HTMLButtonElement>('btn-agregar-evidencia').addEventListener('click', () => {
    estado.evidenciasPerfil = [
      ...estado.evidenciasPerfil,
      { id: nuevoId('evi'), texto: '', respaldo: '' },
    ];
    persistir('Evidencia agregada. Escribe su texto.');
    renderEvidencias();
    renderComparacion();
    listaEvidencias.querySelector<HTMLTextAreaElement>('.item-lista:last-child textarea')?.focus();
  });

  porId<HTMLButtonElement>('btn-exportar').addEventListener('click', () => {
    const contenido = exportarJSON(estado);
    const blob = new Blob([contenido], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'calzacv-estado.json';
    enlace.click();
    URL.revokeObjectURL(url);
    aviso.textContent = 'Se descargó el archivo JSON en este equipo.';
  });

  porId<HTMLInputElement>('input-importar').addEventListener('change', (evento) => {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0];
    if (!archivo) return;
    void archivo
      .text()
      .then((texto) => {
        const resultado = importarJSON(texto);
        if (!resultado.ok) {
          aviso.textContent = `No se pudo importar: ${resultado.error}`;
          return;
        }
        estado = resultado.estado;
        persistir('Estado importado.');
        renderTodo();
      })
      .catch(() => {
        aviso.textContent = 'No se pudo leer el archivo seleccionado.';
      })
      .finally(() => {
        entrada.value = '';
      });
  });

  porId<HTMLButtonElement>('btn-vaciar').addEventListener('click', () => {
    const confirmado = window.confirm(
      'Se borrarán la oferta, los requisitos, las evidencias y las correcciones guardadas en este navegador. ¿Continuar?',
    );
    if (!confirmado) return;
    estado = estadoInicial();
    persistir('Todo quedó vacío.');
    renderTodo();
  });

  formDialogo.addEventListener('submit', (evento) => {
    evento.preventDefault();
    aplicarCorreccion();
    dialogo.close();
  });

  porId<HTMLButtonElement>('btn-cerrar-dialogo').addEventListener('click', () => {
    requisitoEnEdicion = null;
    dialogo.close();
  });

  botonQuitar.addEventListener('click', () => {
    if (requisitoEnEdicion) {
      delete estado.correcciones[requisitoEnEdicion];
      persistir('Corrección eliminada.');
      renderComparacion();
    }
    requisitoEnEdicion = null;
    dialogo.close();
  });

  areaOferta.addEventListener('change', () => {
    estado.oferta = areaOferta.value;
    persistir('Oferta guardada.');
  });

  // --- Arranque ----------------------------------------------------------------
  renderTodo();
  persistir(cargar(almacen) ? 'Estado restaurado desde este navegador.' : 'Demo ficticia cargada.');
  aviso.textContent = `${aviso.textContent} Los estados posibles son: ${Object.values(ESTADOS_UI)
    .map((e) => e.etiqueta)
    .join(', ')}.`;
}
