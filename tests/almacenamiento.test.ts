import { describe, expect, it } from 'vitest';
import {
  cargar,
  exportarJSON,
  guardar,
  importarJSON,
  normalizarEstado,
  estadoInicial,
} from '../src/almacenamiento/local';
import type { Almacen } from '../src/almacenamiento/local';
import { CLAVE_ESTADO, CLAVE_ESTADO_V1, VERSION_DATOS } from '../src/almacenamiento/version';
import { OFERTA_DEMO } from '../src/dominio/datos-demo';
import type { EstadoApp } from '../src/dominio/tipos';

function almacenMemoria(): { almacen: Almacen; datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return {
    datos,
    almacen: {
      leer: (clave) => datos.get(clave) ?? null,
      escribir: (clave, valor) => {
        datos.set(clave, valor);
      },
      borrar: (clave) => {
        datos.delete(clave);
      },
    },
  };
}

function estadoDePrueba(): EstadoApp {
  return {
    version: VERSION_DATOS,
    origen: 'usuario',
    oferta: 'Oferta ficticia de prueba',
    requisitos: [
      { id: 'req_1', texto: 'Excel', fraseOferta: 'Excel', linea: 2, origen: 'segmentacion' },
      { id: 'req_2', texto: 'SQL', fraseOferta: '', linea: null, origen: 'manual' },
    ],
    evidenciasPerfil: [{ id: 'e1', texto: 'Trabajo con Excel', respaldo: 'práctica' }],
    correcciones: {
      req_2: { estado: 'coincidencia_posible', nota: 'revisar', fecha: '2026-01-01T00:00:00.000Z' },
    },
    referencias: {},
  };
}

describe('almacenamiento local versionado', () => {
  it('guarda y recupera el estado en el almacén local', () => {
    const { almacen } = almacenMemoria();
    const estado = estadoDePrueba();

    guardar(almacen, estado);
    expect(cargar(almacen)).toEqual(estado);
  });

  it('no hay nada guardado: cargar devuelve null', () => {
    const { almacen } = almacenMemoria();
    expect(cargar(almacen)).toBeNull();
  });

  it('ignora un estado guardado con otra versión de formato', () => {
    const { almacen, datos } = almacenMemoria();
    datos.set(CLAVE_ESTADO, JSON.stringify({ ...estadoDePrueba(), version: VERSION_DATOS + 1 }));
    expect(cargar(almacen)).toBeNull();
  });

  it('ignora contenido corrupto sin romperse', () => {
    const { almacen, datos } = almacenMemoria();
    datos.set(CLAVE_ESTADO, '{esto no es json');
    expect(cargar(almacen)).toBeNull();
  });
});

describe('migración del formato anterior (v1 → v2)', () => {
  it('migra un estado v1 y lo guarda en la versión actual', () => {
    const { almacen, datos } = almacenMemoria();
    datos.set(
      CLAVE_ESTADO_V1,
      JSON.stringify({
        version: 1,
        oferta: 'Mi oferta',
        requisitos: [],
        evidenciasPerfil: [],
        correcciones: {},
        referencias: {},
      }),
    );

    const estado = cargar(almacen);
    expect(estado).not.toBeNull();
    expect(estado?.version).toBe(VERSION_DATOS);
    expect(estado?.origen).toBe('usuario');
    expect(estado?.oferta).toBe('Mi oferta');
    // Queda guardado en la clave actual y se retira la copia del formato anterior.
    expect(datos.has(CLAVE_ESTADO)).toBe(true);
    expect(datos.has(CLAVE_ESTADO_V1)).toBe(false);
  });

  it('un estado v1 que todavía tiene la oferta de la demo se marca como demo', () => {
    const { almacen, datos } = almacenMemoria();
    datos.set(
      CLAVE_ESTADO_V1,
      JSON.stringify({
        version: 1,
        oferta: OFERTA_DEMO,
        requisitos: [],
        evidenciasPerfil: [],
        correcciones: {},
        referencias: {},
      }),
    );

    const estado = cargar(almacen);
    expect(estado?.origen).toBe('demo');
  });
});

describe('exportar / importar JSON', () => {
  it('el round-trip conserva el estado completo (incluidas las correcciones)', () => {
    const estado = estadoDePrueba();
    const resultado = importarJSON(exportarJSON(estado));

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.estado).toEqual(estado);
    // La corrección sigue siendo un campo aparte de cualquier sugerencia.
    expect(resultado.estado.correcciones.req_2.estado).toBe('coincidencia_posible');
    expect(resultado.estado.referencias).toEqual({});
  });

  it('rechaza un JSON inválido con un mensaje en español', () => {
    const resultado = importarJSON('{no es json');
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.error).toMatch(/JSON/i);
  });

  it('importa un archivo del formato anterior migrándolo', () => {
    const resultado = importarJSON(
      JSON.stringify({ version: 1, oferta: 'Oferta antigua', requisitos: [], evidenciasPerfil: [], correcciones: {}, referencias: {} }),
    );
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.estado.version).toBe(VERSION_DATOS);
    expect(resultado.estado.origen).toBe('usuario');
  });

  it('rechaza un JSON que no es un estado de CalzaCV', () => {
    const resultado = importarJSON(JSON.stringify({ hola: 'mundo' }));
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.error).toMatch(/CalzaCV/i);
  });

  it('descarta entradas inválidas sin inventar datos', () => {
    const estado = normalizarEstado({
      version: VERSION_DATOS,
      origen: 'usuario',
      oferta: 'texto',
      requisitos: [
        { id: 'ok', texto: 'Excel', fraseOferta: 'Excel', linea: 1, origen: 'manual' },
        { id: 'roto' },
      ],
      evidenciasPerfil: [{ id: 'e1', texto: 'Excel', respaldo: '' }],
      correcciones: { req_1: { estado: 'coincide', nota: '', fecha: '2026-01-01T00:00:00.000Z' } },
      referencias: {},
    });

    expect(estado).not.toBeNull();
    expect(estado?.requisitos).toHaveLength(1);
    expect(estado?.requisitos[0].id).toBe('ok');
  });

  it('el estado inicial está vacío, versionado y marcado como datos propios', () => {
    const estado = estadoInicial();
    expect(estado.version).toBe(VERSION_DATOS);
    expect(estado.origen).toBe('usuario');
    expect(estado.requisitos).toEqual([]);
    expect(estado.correcciones).toEqual({});
    expect(estado.referencias).toEqual({});
  });
});
