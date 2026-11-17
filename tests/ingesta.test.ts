import { describe, expect, it } from 'vitest';
import { convertirTextoEnEvidencias, esEncabezadoCv } from '../src/dominio/ingesta';

describe('conversión de un resumen pegado en evidencias', () => {
  it('convierte cada línea no vacía en una evidencia', () => {
    const resultado = convertirTextoEnEvidencias('Excel\nSQL');
    expect(resultado.fragmentos).toEqual(['Excel', 'SQL']);
  });

  it('ignora líneas vacías y líneas con solo espacios', () => {
    const resultado = convertirTextoEnEvidencias('\n   \n\t\nExcel\n\n');
    expect(resultado.fragmentos).toEqual(['Excel']);
    expect(resultado.vacias).toBe(5);
  });

  it('quita la viñeta inicial de cada línea', () => {
    const resultado = convertirTextoEnEvidencias(
      '- Excel\n• SQL\n* Power BI\n1. Git\n2) Docker\n– Azure',
    );
    expect(resultado.fragmentos).toEqual(['Excel', 'SQL', 'Power BI', 'Git', 'Docker', 'Azure']);
  });

  it('elimina líneas duplicadas (mismo texto con distinta caja)', () => {
    const resultado = convertirTextoEnEvidencias('Excel\nexcel\nEXCEL');
    expect(resultado.fragmentos).toEqual(['Excel']);
    expect(resultado.duplicados).toBe(2);
  });

  it('ignora los encabezados de CV', () => {
    const resultado = convertirTextoEnEvidencias(
      'EXPERIENCIA\nExperiencia laboral:\nEducación\nHabilidades:\nExcel',
    );
    expect(resultado.fragmentos).toEqual(['Excel']);
    expect(resultado.encabezados).toBe(4);
  });

  it('no duplica una evidencia que ya existe y no borra las que ya había', () => {
    const resultado = convertirTextoEnEvidencias('Excel\nSQL', ['Excel']);
    expect(resultado.fragmentos).toEqual(['SQL']);
    expect(resultado.yaExistentes).toBe(1);
  });

  it('trata el texto con caracteres HTML de forma literal', () => {
    const resultado = convertirTextoEnEvidencias('<b>Excel</b>\n<script>alert(1)</script>');
    expect(resultado.fragmentos).toEqual(['<b>Excel</b>', '<script>alert(1)</script>']);
  });

  it('no rompe líneas que empiezan con un año', () => {
    const resultado = convertirTextoEnEvidencias('2020 - 2022 · Panadería Aurora SpA');
    expect(resultado.fragmentos).toEqual(['2020 - 2022 · Panadería Aurora SpA']);
  });

  it('detecta encabezados con dos puntos y pocas palabras', () => {
    expect(esEncabezadoCv('Contacto:')).toBe(true);
    expect(esEncabezadoCv('Idiomas:')).toBe(true);
    expect(esEncabezadoCv('Control de inventario en bodega')).toBe(false);
  });
});
