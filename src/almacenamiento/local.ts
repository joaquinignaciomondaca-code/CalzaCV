/**
 * Persistencia local versionada + exportar/importar JSON.
 *
 * No hay backend ni red: el estado vive en el almacenamiento local del navegador
 * (o en cualquier almacén con la misma interfaz, como el de memoria en las pruebas).
 */

import { CLAVE_ESTADO, VERSION_DATOS } from './version';
import type {
  CorreccionUsuario,
  Estado,
  EstadoApp,
  EtiquetaReferencia,
  EvidenciaPerfil,
  Requisito,
} from '../dominio/tipos';

/** Interfaz mínima de almacenamiento (localStorage en el navegador, memoria en tests). */
export interface Almacen {
  leer(clave: string): string | null;
  escribir(clave: string, valor: string): void;
  borrar(clave: string): void;
}

/** Estado vacío (sin datos precargados). */
export function estadoInicial(): EstadoApp {
  return {
    version: VERSION_DATOS,
    oferta: '',
    requisitos: [],
    evidenciasPerfil: [],
    correcciones: {},
    referencias: {},
  };
}

/** Almacén real del navegador. Tolera navegadores que bloquean `localStorage`. */
export function crearAlmacenLocal(): Almacen {
  return {
    leer(clave) {
      try {
        return window.localStorage.getItem(clave);
      } catch {
        return null;
      }
    },
    escribir(clave, valor) {
      try {
        window.localStorage.setItem(clave, valor);
      } catch {
        /* modo privado o cuota llena: la app sigue funcionando en memoria */
      }
    },
    borrar(clave) {
      try {
        window.localStorage.removeItem(clave);
      } catch {
        /* sin efecto */
      }
    },
  };
}

/** Guarda el estado en el almacén local. */
export function guardar(almacen: Almacen, estado: EstadoApp): void {
  almacen.escribir(CLAVE_ESTADO, exportarJSON(estado));
}

function esRequisito(valor: unknown): valor is Requisito {
  if (typeof valor !== 'object' || valor === null) return false;
  const r = valor as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.texto === 'string' &&
    typeof r.fraseOferta === 'string' &&
    (r.linea === null || typeof r.linea === 'number') &&
    (r.origen === 'segmentacion' || r.origen === 'manual')
  );
}

function esEvidencia(valor: unknown): valor is EvidenciaPerfil {
  if (typeof valor !== 'object' || valor === null) return false;
  const e = valor as Record<string, unknown>;
  return typeof e.id === 'string' && typeof e.texto === 'string' && typeof e.respaldo === 'string';
}

function isEstado(valor: unknown): valor is Estado {
  return (
    valor === 'coincide' ||
    valor === 'coincidencia_posible' ||
    valor === 'brecha' ||
    valor === 'informacion_insuficiente'
  );
}

function esCorreccion(valor: unknown): valor is CorreccionUsuario {
  if (typeof valor !== 'object' || valor === null) return false;
  const c = valor as Record<string, unknown>;
  return (
    isEstado(c.estado) && typeof c.nota === 'string' && typeof c.fecha === 'string'
  );
}

function esReferencia(valor: unknown): valor is EtiquetaReferencia {
  if (typeof valor !== 'object' || valor === null) return false;
  const r = valor as Record<string, unknown>;
  return (
    isEstado(r.estado) && typeof r.nota === 'string' && typeof r.fuente === 'string'
  );
}

/** Valida y normaliza un objeto desconocido como `EstadoApp`. */
export function normalizarEstado(valor: unknown): EstadoApp | null {
  if (typeof valor !== 'object' || valor === null) return null;
  const dato = valor as Record<string, unknown>;
  if (dato.version !== VERSION_DATOS) return null;
  if (typeof dato.oferta !== 'string') return null;
  if (!Array.isArray(dato.requisitos) || !Array.isArray(dato.evidenciasPerfil)) return null;

  const correcciones: Record<string, CorreccionUsuario> = {};
  if (typeof dato.correcciones === 'object' && dato.correcciones !== null) {
    for (const [id, correccion] of Object.entries(dato.correcciones as Record<string, unknown>)) {
      if (esCorreccion(correccion)) correcciones[id] = correccion;
    }
  }

  const referencias: Record<string, EtiquetaReferencia> = {};
  if (typeof dato.referencias === 'object' && dato.referencias !== null) {
    for (const [id, referencia] of Object.entries(dato.referencias as Record<string, unknown>)) {
      if (esReferencia(referencia)) referencias[id] = referencia;
    }
  }

  return {
    version: VERSION_DATOS,
    oferta: dato.oferta,
    requisitos: (dato.requisitos as unknown[]).filter(esRequisito),
    evidenciasPerfil: (dato.evidenciasPerfil as unknown[]).filter(esEvidencia),
    correcciones,
    referencias,
  };
}

/**
 * Carga el estado guardado. Devuelve `null` si no hay nada, si el formato no es válido
 * o si la versión guardada es distinta a la soportada (no se intenta migrar a ciegas).
 */
export function cargar(almacen: Almacen): EstadoApp | null {
  const bruto = almacen.leer(CLAVE_ESTADO);
  if (!bruto) return null;
  try {
    return normalizarEstado(JSON.parse(bruto) as unknown);
  } catch {
    return null;
  }
}

/** Serializa el estado a JSON (formato de exportación). */
export function exportarJSON(estado: EstadoApp): string {
  return JSON.stringify(estado, null, 2);
}

export type ResultadoImportacion =
  | { ok: true; estado: EstadoApp }
  | { ok: false; error: string };

/** Lee un JSON exportado y devuelve el estado, o un mensaje de error en español. */
export function importarJSON(texto: string): ResultadoImportacion {
  let datos: unknown;
  try {
    datos = JSON.parse(texto) as unknown;
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' };
  }
  const estado = normalizarEstado(datos);
  if (!estado) {
    return {
      ok: false,
      error: `El archivo no corresponde a un estado de CalzaCV versión ${VERSION_DATOS}.`,
    };
  }
  return { ok: true, estado };
}
