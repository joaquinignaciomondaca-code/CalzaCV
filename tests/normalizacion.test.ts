import { describe, expect, it } from 'vitest';
import {
  ALIAS,
  canonico,
  normalizar,
  terminosComparables,
  tokenizar,
} from '../src/dominio/normalizacion';

describe('normalización conservadora', () => {
  it('ignora mayúsculas, acentos y puntuación', () => {
    expect(normalizar('Inglés BÁSICO, nivel técnico.')).toBe('ingles basico nivel tecnico');
  });

  it('colapsa espacios sobrantes', () => {
    expect(normalizar('  Excel   y    SQL  ')).toBe('excel y sql');
  });

  it('separa en términos', () => {
    expect(tokenizar('Excel y SQL')).toEqual(['excel', 'y', 'sql']);
  });

  it('NO hace stemming: los plurales no se unifican', () => {
    expect(terminosComparables('inventarios')).toEqual(['inventarios']);
    expect(terminosComparables('inventario')).toEqual(['inventario']);
  });

  it('descarta palabras vacías y genéricas', () => {
    expect(terminosComparables('Experiencia en Excel y SQL')).toEqual(['excel', 'sql']);
    expect(terminosComparables('experiencia')).toEqual([]);
  });

  it('aplica únicamente los alias declarados', () => {
    expect(ALIAS.js).toBe('javascript');
    expect(terminosComparables('JS y Node')).toEqual(['javascript', 'nodejs']);
    expect(canonico('postgres')).toBe('postgresql');
  });

  it('no inventa equivalencias entre habilidades distintas', () => {
    // «Power BI» y «Excel» son habilidades distintas: no hay alias entre ellas.
    expect(terminosComparables('Power BI')).toEqual(['power', 'bi']);
    expect(terminosComparables('Excel')).toEqual(['excel']);
  });
});
