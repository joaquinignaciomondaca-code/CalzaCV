import { describe, expect, it } from 'vitest';
import { construirFila, construirFilas } from '../src/dominio/evaluacion';
import { sugerir } from '../src/dominio/matching';
import { VERSION_DATOS } from '../src/almacenamiento/version';
import type { EstadoApp, Requisito } from '../src/dominio/tipos';

const REQUISITO: Requisito = {
  id: 'req_1',
  texto: 'Experiencia en Excel',
  fraseOferta: 'Experiencia en Excel',
  linea: 3,
  origen: 'segmentacion',
};

const EVIDENCIAS = [{ id: 'e1', texto: 'Trabajo con Excel', respaldo: 'práctica' }];

describe('distinción entre sugerencia, corrección y referencia', () => {
  it('sin corrección se muestra la sugerencia del sistema', () => {
    const fila = construirFila(REQUISITO, EVIDENCIAS, {}, {});
    expect(fila.estadoMostrado).toBe('coincide');
    expect(fila.origenMostrado).toBe('sistema');
    expect(fila.correccion).toBeNull();
  });

  it('la corrección del usuario se guarda aparte y NO sobrescribe la sugerencia', () => {
    const sugerenciaOriginal = sugerir(REQUISITO, EVIDENCIAS);

    const correcciones = {
      req_1: { estado: 'informacion_insuficiente' as const, nota: 'revisar', fecha: '2026-01-01T00:00:00.000Z' },
    };
    const fila = construirFila(REQUISITO, EVIDENCIAS, correcciones, {});

    // La sugerencia del matcher sigue intacta.
    expect(fila.sugerencia.estado).toBe(sugerenciaOriginal.estado);
    expect(fila.sugerencia.terminosCubiertos).toEqual(sugerenciaOriginal.terminosCubiertos);
    // Lo que se muestra es la corrección, con su propio origen.
    expect(fila.estadoMostrado).toBe('informacion_insuficiente');
    expect(fila.origenMostrado).toBe('usuario');
    expect(fila.correccion?.nota).toBe('revisar');
  });

  it('la corrección no falsifica las métricas de la sugerencia', () => {
    const correcciones = {
      req_1: { estado: 'coincide' as const, nota: '', fecha: '2026-01-01T00:00:00.000Z' },
    };
    const fila = construirFila(REQUISITO, [], correcciones, {});

    // La sugerencia (derivada) sigue diciendo que no hay evidencia...
    expect(fila.sugerencia.estado).toBe('brecha');
    expect(fila.sugerencia.terminosCubiertos).toEqual([]);
    // ...y lo que se muestra viene de la corrección de la persona.
    expect(fila.estadoMostrado).toBe('coincide');
    expect(fila.origenMostrado).toBe('usuario');
  });

  it('la referencia externa no existe: se informa como no disponible, no se inventa', () => {
    const fila = construirFila(REQUISITO, EVIDENCIAS, {}, {});
    expect(fila.referencia).toBeNull();
  });

  it('el estado guardado no contiene ningún campo de sugerencia ni de puntaje', () => {
    const estado: EstadoApp = {
      version: VERSION_DATOS,
      origen: 'usuario',
      oferta: '',
      requisitos: [REQUISITO],
      evidenciasPerfil: EVIDENCIAS,
      correcciones: {},
      referencias: {},
    };
    expect(Object.keys(estado)).not.toContain('sugerencias');
    expect(Object.keys(estado)).not.toContain('puntaje');
    expect(estado.referencias).toEqual({});
    expect(construirFilas(estado)).toHaveLength(1);
  });
});
