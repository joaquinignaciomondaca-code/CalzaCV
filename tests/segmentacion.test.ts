import { describe, expect, it } from 'vitest';
import { segmentarOferta } from '../src/dominio/segmentacion';

const OFERTA = `Empresa ficticia: Panadería Aurora SpA
Cargo: Analista de operaciones

Requisitos del puesto:
- Experiencia en Excel y tablas de cálculo
- Conocimientos en SQL y bases de datos
- Trabajo en equipo

Deseables:
- Conocimiento en Power BI

Salario a conversar en entrevista.
Postular en el sitio de ejemplo.`;

describe('segmentación de la oferta', () => {
  const requisitos = segmentarOferta(OFERTA);

  it('detecta los requisitos de las viñetas', () => {
    expect(requisitos.map((r) => r.texto)).toEqual([
      'Experiencia en Excel y tablas de cálculo',
      'Conocimientos en SQL y bases de datos',
      'Trabajo en equipo',
      'Conocimiento en Power BI',
    ]);
  });

  it('conserva la línea de la frase de la oferta', () => {
    expect(requisitos[0].linea).toBe(5);
    expect(requisitos[3].linea).toBe(10);
  });

  it('guarda la frase de la oferta como evidencia del lado oferta', () => {
    expect(requisitos[1].fraseOferta).toBe('Conocimientos en SQL y bases de datos');
  });

  it('descarta líneas de ruido (salario, postulación, encabezados)', () => {
    const textos = requisitos.map((r) => r.texto).join(' | ');
    expect(textos).not.toMatch(/Salario/i);
    expect(textos).not.toMatch(/Postular/i);
    expect(textos).not.toMatch(/Empresa ficticia/i);
    expect(textos).not.toMatch(/Requisitos del puesto/i);
  });

  it('elimina duplicados', () => {
    const repetida = segmentarOferta('- Excel\n- Excel\n- Python');
    expect(repetida).toHaveLength(2);
  });

  it('conserva requisitos cortos con significado (SQL)', () => {
    const cortos = segmentarOferta('- SQL\n- GIS');
    expect(cortos.map((r) => r.texto)).toEqual(['SQL', 'GIS']);
  });

  it('devuelve una lista vacía si no encuentra requisitos', () => {
    expect(segmentarOferta('Solo un párrafo sin viñetas ni frases de requisito.')).toHaveLength(0);
  });
});
