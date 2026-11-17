import { describe, expect, it } from 'vitest';
import { estadoDemo, OFERTA_DEMO } from '../src/dominio/datos-demo';
import { construirFilas } from '../src/dominio/evaluacion';
import type { Estado } from '../src/dominio/tipos';

describe('demo ficticia', () => {
  const estado = estadoDemo();
  const filas = construirFilas(estado);

  function estadoDe(texto: string): Estado {
    const fila = filas.find((f) => f.requisito.texto === texto);
    if (!fila) throw new Error(`El requisito de ejemplo «${texto}» no está en la demo`);
    return fila.sugerencia.estado;
  }

  it('detecta los ocho requisitos del ejemplo y descarta el ruido', () => {
    expect(estado.requisitos).toHaveLength(8);
    expect(estado.requisitos[0].linea).toBe(7);
    expect(estado.requisitos[7].linea).toBe(16);

    const textos = estado.requisitos.map((r) => r.texto).join(' | ');
    expect(textos).not.toMatch(/Salario/i);
    expect(textos).not.toMatch(/Postular/i);
    expect(textos).not.toMatch(/Empresa ficticia/i);
  });

  it('muestra los cuatro estados posibles con la demo precargada', () => {
    const estados = new Set(filas.map((f) => f.sugerencia.estado));
    expect(estados).toEqual(
      new Set<Estado>(['coincide', 'coincidencia_posible', 'brecha', 'informacion_insuficiente']),
    );
  });

  it('clasifica cada requisito del ejemplo como se espera', () => {
    expect(estadoDe('Experiencia en Excel y tablas de cálculo para reportes diarios')).toBe('coincide');
    expect(estadoDe('Conocimientos en SQL y bases de datos')).toBe('coincide');
    expect(estadoDe('Manejo de control de inventario en bodega')).toBe('coincide');
    expect(estadoDe('Inglés básico para lectura de documentación técnica')).toBe('coincide');
    expect(estadoDe('Trabajo en equipo y buena comunicación')).toBe('coincidencia_posible');
    expect(estadoDe('Inglés intermedio')).toBe('coincidencia_posible');
    expect(estadoDe('Conocimiento en Power BI')).toBe('brecha');
    expect(estadoDe('Varios según experiencia')).toBe('informacion_insuficiente');
  });

  it('la demo no trae correcciones ni referencias inventadas', () => {
    expect(estado.correcciones).toEqual({});
    expect(estado.referencias).toEqual({});
    expect(filas.every((fila) => fila.referencia === null)).toBe(true);
  });

  it('la demo es local: el texto de ejemplo vive en el estado, no en una red', () => {
    expect(estado.oferta).toBe(OFERTA_DEMO);
    expect(estado.evidenciasPerfil.length).toBeGreaterThan(0);
  });
});
