import { describe, expect, it } from 'vitest';
import { sugerir } from '../src/dominio/matching';
import type { EvidenciaPerfil, Requisito } from '../src/dominio/tipos';

function requisito(texto: string): Requisito {
  return { id: 'req_1', texto, fraseOferta: texto, linea: 1, origen: 'manual' };
}

function evidencia(id: string, texto: string): EvidenciaPerfil {
  return { id, texto, respaldo: '' };
}

describe('matcher local (coincidencia de términos)', () => {
  it('coincidencia directa: todos los términos del requisito aparecen', () => {
    const sugerencia = sugerir(
      requisito('Experiencia en Excel y SQL'),
      [evidencia('e1', 'Trabajo con Excel y consultas SQL')],
    );
    expect(sugerencia.estado).toBe('coincide');
    expect(sugerencia.terminosCubiertos).toEqual(['excel', 'sql']);
    expect(sugerencia.terminosNoCubiertos).toEqual([]);
    expect(sugerencia.evidenciaVinculadaId).toBe('e1');
    expect(sugerencia.explicacion).toMatch(/Se encontró evidencia en tu perfil/i);
  });

  it('equivalencia explícita: el alias declarado hace coincidir las dos notaciones', () => {
    const sugerencia = sugerir(
      requisito('Programación en JS'),
      [evidencia('e1', 'Programación en JavaScript')],
    );
    expect(sugerencia.estado).toBe('coincide');
  });

  it('coincidencia posible: la evidencia cubre solo parte de los términos', () => {
    const sugerencia = sugerir(
      requisito('Excel y comunicación con clientes'),
      [evidencia('e1', 'Uso de Excel')],
    );
    expect(sugerencia.estado).toBe('coincidencia_posible');
    expect(sugerencia.terminosCubiertos).toEqual(['excel']);
    expect(sugerencia.terminosNoCubiertos).toEqual(['comunicacion', 'clientes']);
    expect(sugerencia.explicacion).toMatch(/Faltan/i);
  });

  it('brecha: no se encontró evidencia en tu perfil, y no afirma que falte la habilidad', () => {
    const sugerencia = sugerir(requisito('Experiencia en Power BI'), []);

    expect(sugerencia.estado).toBe('brecha');
    expect(sugerencia.explicacion).toMatch(/no se encontró evidencia en tu perfil/i);
    // El mensaje no atribuye la ausencia a la persona.
    expect(sugerencia.explicacion).not.toMatch(/no tienes|no dominas|no posees|te falta/i);
    expect(sugerencia.explicacion).toMatch(/no afirma que/i);
    expect(sugerencia.evidenciaVinculadaId).toBeNull();
  });

  it('brecha también cuando hay evidencia pero de otra habilidad', () => {
    const sugerencia = sugerir(
      requisito('Power BI'),
      [evidencia('e1', 'Trabajo con Excel')],
    );
    expect(sugerencia.estado).toBe('brecha');
  });

  it('información insuficiente: el requisito no deja términos comparables', () => {
    const sugerencia = sugerir(requisito('Experiencia'), [evidencia('e1', 'Excel')]);
    expect(sugerencia.estado).toBe('informacion_insuficiente');
    expect(sugerencia.explicacion).toMatch(/demasiado general/i);
  });

  it('no hace stemming: plurales distintos no se consideran la misma habilidad', () => {
    const sugerencia = sugerir(
      requisito('Manejo de inventarios'),
      [evidencia('e1', 'Control de inventario')],
    );
    expect(sugerencia.estado).toBe('brecha');
  });
});
