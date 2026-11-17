/**
 * Controlador de la aplicación: mantiene el estado, guarda en local y coordina las vistas.
 *
 * Reglas de provenance que se respetan aquí:
 *   - la sugerencia del matcher NUNCA se escribe en el estado: se recalcula siempre;
 *   - la corrección del usuario se guarda en `estado.correcciones`, en un campo aparte;
 *   - las referencias externas se guardan aparte y hoy están vacías (no hay benchmark).
 *
 * Reglas de entrada:
 *   - en la primera visita se ofrece una elección explícita entre la demo (datos ficticios)
 *     y empezar con datos propios;
 *   - mientras se vea la demo, un banner visible lo dice y ofrece cambiar a datos propios;
 *   - nada se borra sin confirmación.
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
import { OFERTA_DEMO, estadoDemo } from '../dominio/datos-demo';
import { construirFilas } from '../dominio/evaluacion';
import { nuevoId } from '../dominio/ids';
import { convertirTextoEnEvidencias } from '../dominio/ingesta';
import type { ResultadoIngesta } from '../dominio/ingesta';
import { segmentarOferta } from '../dominio/segmentacion';
import type { Estado, EstadoApp } from '../dominio/tipos';
import { porId } from './dom';
import {
  ESTADOS_UI,
  renderComparacion as pintarComparacion,
  renderEvidencias as pintarEvidencias,
  renderPreviaFragmentos,
  renderRequisitos as pintarRequisitos,
} from './vistas';

const FORMATO_FECHA = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });

export function iniciarApp(): void {
  const almacen: Almacen = crearAlmacenLocal();

  const main = porId<HTMLElement>('contenido');
  const bienvenida = porId<HTMLElement>('bienvenida');
  const banner = porId<HTMLElement>('banner-demo');
  const areaOferta = porId<HTMLTextAreaElement>('oferta-texto');
  const areaPerfil = porId<HTMLTextAreaElement>('texto-perfil');
  const listaRequisitos = porId<HTMLUListElement>('lista-requisitos');
  const listaEvidencias = porId<HTMLUListElement>('lista-evidencias');
  const cuerpoComparacion = porId<HTMLTableSectionElement>('filas-comparacion');
  const contadorRequisitos = porId<HTMLElement>('contador-requisitos');
  const aviso = porId<HTMLElement>('aviso-guardado');

  const previa = porId<HTMLElement>('previa-fragmentos');
  const previaResumen = porId<HTMLElement>('previa-resumen');
  const previaLista = porId<HTMLUListElement>('previa-lista');
  const botonAnadir = porId<HTMLButtonElement>('btn-anadir-fragmentos');

  const dialogo = porId<HTMLDialogElement>('dialogo-correccion');
  const formDialogo = porId<HTMLFormElement>('form-correccion');
  const tituloDialogo = porId<HTMLElement>('dialogo-requisito');
  const notaDialogo = porId<HTMLTextAreaElement>('dialogo-nota');
  const botonQuitar = porId<HTMLButtonElement>('btn-quitar-correccion');

  // Estado en memoria; el almacén local es la persistencia.
  const guardado = cargar(almacen);
  let estado: EstadoApp = guardado ?? estadoInicial();
  /** En la primera visita no se guarda nada hasta que la persona elige por dónde empezar. */
  let enFaseBienvenida = guardado === null;
  let requisitoEnEdicion: string | null = null;
  let ingestaPendiente: ResultadoIngesta | null = null;

  function persistir(mensaje = 'Guardado en este navegador.'): void {
    if (enFaseBienvenida) return;
    guardar(almacen, estado);
    aviso.textContent = `${mensaje} (${FORMATO_FECHA.format(new Date())})`;
  }

  function renderGlobal(): void {
    contadorRequisitos.textContent = String(estado.requisitos.length);
    bienvenida.hidden = !enFaseBienvenida;
    banner.hidden = estado.origen !== 'demo';
    main.dataset.fase = enFaseBienvenida ? 'bienvenida' : 'uso';
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

  /**
   * Si se está viendo la demo, pide confirmación y cambia a un estado con datos propios.
   * @param conservarOferta texto de la oferta que se quiere mantener (si viene de la persona)
   */
  function salirDeDemo(conservarOferta: string | null = null): boolean {
    if (estado.origen !== 'demo') return true;

    const aceptado = window.confirm(
      'Estás viendo datos de ejemplo (ficticios). Al continuar se reemplazarán por tus datos. ¿Continuar?',
    );
    if (!aceptado) return false;

    const oferta = conservarOferta ?? '';
    estado = estadoInicial();
    estado.oferta = oferta.trim() === OFERTA_DEMO.trim() ? '' : oferta;
    return true;
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

  // --- Entrada: elección de inicio -------------------------------------------

  porId<HTMLButtonElement>('btn-empezar-demo').addEventListener('click', () => {
    estado = estadoDemo();
    enFaseBienvenida = false;
    persistir('Demo ficticia cargada.');
    renderTodo();
  });

  porId<HTMLButtonElement>('btn-empezar-mis-datos').addEventListener('click', () => {
    estado = estadoInicial();
    enFaseBienvenida = false;
    persistir('Empezamos con tus datos: pega una oferta y un resumen de tu perfil.');
    renderTodo();
    areaOferta.focus();
  });

  porId<HTMLButtonElement>('btn-banner-mis-datos').addEventListener('click', () => {
    const aceptado = window.confirm(
      'Se reemplazarán los datos de ejemplo (y cualquier edición que hayas hecho sobre ellos) por un estado vacío. ¿Continuar?',
    );
    if (!aceptado) return;
    estado = estadoInicial();
    enFaseBienvenida = false;
    persistir('Ahora trabajas con tus datos.');
    renderTodo();
    areaOferta.focus();
  });

  // --- Entrada: oferta --------------------------------------------------------

  porId<HTMLButtonElement>('btn-analizar').addEventListener('click', () => {
    const texto = areaOferta.value;
    if (!salirDeDemo(texto)) return;

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

  // --- Entrada: perfil en un solo paso ---------------------------------------

  porId<HTMLButtonElement>('btn-ver-fragmentos').addEventListener('click', () => {
    const resultado = convertirTextoEnEvidencias(
      areaPerfil.value,
      estado.evidenciasPerfil.map((evidencia) => evidencia.texto),
    );
    ingestaPendiente = resultado;
    renderPreviaFragmentos(previaLista, previaResumen, resultado);
    previa.hidden = false;
    botonAnadir.textContent =
      resultado.fragmentos.length === 1
        ? 'Añadir 1 evidencia'
        : `Añadir ${resultado.fragmentos.length} evidencias`;
    botonAnadir.disabled = resultado.fragmentos.length === 0;
    previaResumen.focus();
  });

  porId<HTMLButtonElement>('btn-anadir-fragmentos').addEventListener('click', () => {
    if (!ingestaPendiente || ingestaPendiente.fragmentos.length === 0) return;
    const fragmentos = ingestaPendiente.fragmentos;
    if (!salirDeDemo(areaOferta.value)) return;

    for (const fragmento of fragmentos) {
      estado.evidenciasPerfil = [
        ...estado.evidenciasPerfil,
        { id: nuevoId('evi'), texto: fragmento, respaldo: '' },
      ];
    }

    ingestaPendiente = null;
    areaPerfil.value = '';
    previa.hidden = true;
    previaLista.replaceChildren();
    persistir(
      fragmentos.length === 1
        ? 'Se añadió 1 evidencia a tu perfil.'
        : `Se añadieron ${fragmentos.length} evidencias a tu perfil.`,
    );
    renderEvidencias();
    renderComparacion();
    renderGlobal();
    // El foco va a la primera evidencia: se puede seguir editando sin usar el ratón.
    listaEvidencias.querySelector<HTMLTextAreaElement>('textarea')?.focus();
  });

  porId<HTMLButtonElement>('btn-cancelar-fragmentos').addEventListener('click', () => {
    ingestaPendiente = null;
    previa.hidden = true;
    previaLista.replaceChildren();
    aviso.textContent = 'Se canceló la vista previa. El texto sigue en el área de pegado.';
    areaPerfil.focus();
  });

  porId<HTMLButtonElement>('btn-agregar-requisito').addEventListener('click', () => {
    estado.requisitos = [
      ...estado.requisitos,
      { id: nuevoId('req'), texto: '', fraseOferta: '', linea: null, origen: 'manual' as const },
    ];
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

  // --- Entrada: datos locales ------------------------------------------------

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
        enFaseBienvenida = false;
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

  if (enFaseBienvenida) {
    aviso.textContent =
      'Elige cómo empezar. Mientras tanto no se guarda nada en este navegador.';
  } else {
    persistir('Estado restaurado desde este navegador.');
    aviso.textContent = `${aviso.textContent} Los estados posibles son: ${Object.values(ESTADOS_UI)
      .map((estadoUi) => estadoUi.etiqueta)
      .join(', ')}.`;
  }
}
