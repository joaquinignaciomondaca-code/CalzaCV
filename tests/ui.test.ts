// @vitest-environment happy-dom
/**
 * Prueba de humo de la interfaz: monta el HTML real del sitio en un DOM y comprueba
 * que la demo se muestra, que la tabla trae la evidencia de los dos lados y que una
 * corrección queda guardada en el almacenamiento local sin tocar la sugerencia.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { iniciarApp } from '../src/ui/app';

function montarDocumento(): void {
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
  const cuerpo = html.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] ?? '';
  // Se quita el <script> del documento: en la prueba no debe ejecutarse nada externo.
  document.body.innerHTML = cuerpo.replace(/<script[\s\S]*?<\/script>/g, '');
}

describe('interfaz (demo montada en DOM)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    montarDocumento();
  });

  it('muestra la demo: requisitos, evidencia de la oferta y evidencia del perfil', () => {
    iniciarApp();

    const requisitos = document.querySelectorAll('#lista-requisitos .item-lista');
    expect(requisitos.length).toBe(8);

    const filas = document.querySelectorAll('#filas-comparacion tr');
    expect(filas.length).toBe(8);

    // La primera fila muestra requisito, frase de la oferta y evidencia del perfil.
    const primeraFila = filas[0];
    const celdas = primeraFila.querySelectorAll('th, td');
    expect(celdas.length).toBe(5);
    expect(celdas[0].textContent).toContain('Excel');
    expect(celdas[1].textContent).toContain('reportes diarios');
    expect(celdas[2].textContent).toContain('Excel');
    expect(celdas[3].textContent).toContain('Coincide');
    expect(celdas[4].textContent).toContain('Corregir');
  });

  it('el mensaje de brecha dice que no se encontró evidencia en tu perfil', () => {
    iniciarApp();

    const filaPowerBi = Array.from(document.querySelectorAll('#filas-comparacion tr')).find((fila) =>
      fila.textContent?.includes('Power BI'),
    );
    expect(filaPowerBi).toBeDefined();
    expect(filaPowerBi?.textContent).toMatch(/no se encontró evidencia en tu perfil/i);
  });

  it('guarda la corrección del usuario en el almacenamiento local, sin tocar la sugerencia', () => {
    iniciarApp();

    const fila = Array.from(document.querySelectorAll('#filas-comparacion tr')).find((f) =>
      f.textContent?.includes('Power BI'),
    );
    const botonCorregir = fila?.querySelector<HTMLButtonElement>('.celda--correccion .boton');
    expect(botonCorregir).toBeDefined();

    botonCorregir?.click();

    const dialogo = document.querySelector<HTMLDialogElement>('#dialogo-correccion');
    expect(dialogo?.open).toBe(true);

    const radio = dialogo?.querySelector<HTMLInputElement>('input[name="estado"][value="coincide"]');
    expect(radio).not.toBeNull();
    if (radio) radio.checked = true;

    dialogo?.querySelector<HTMLFormElement>('#form-correccion')?.dispatchEvent(
      new Event('submit', { cancelable: true, bubbles: true }),
    );

    // El estado guardado contiene la corrección, en su propio campo.
    const guardado = window.localStorage.getItem('calzacv:estado:v1');
    expect(guardado).not.toBeNull();
    const datos = JSON.parse(guardado ?? '{}') as {
      correcciones: Record<string, { estado: string }>;
      referencias: Record<string, unknown>;
    };
    const correcciones = Object.values(datos.correcciones);
    expect(correcciones).toHaveLength(1);
    expect(correcciones[0].estado).toBe('coincide');
    // No existe benchmark: no se guarda ninguna referencia.
    expect(datos.referencias).toEqual({});

    // La tabla sigue mostrando la sugerencia del sistema aparte de la corrección.
    const filaCorregida = Array.from(document.querySelectorAll('#filas-comparacion tr')).find((f) =>
      f.textContent?.includes('Power BI'),
    );
    const sugerencia = filaCorregida?.querySelector('.celda--sugerencia')?.textContent ?? '';
    const correccion = filaCorregida?.querySelector('.celda--correccion')?.textContent ?? '';
    expect(sugerencia).toContain('Brecha de evidencia');
    expect(sugerencia).toContain('no disponible');
    expect(correccion).toContain('Corregido por ti');
  });

  it('recargar conserva el estado local', () => {
    iniciarApp();
    const guardadoInicial = window.localStorage.getItem('calzacv:estado:v1');
    expect(guardadoInicial).not.toBeNull();

    // Simula una recarga: se vuelve a montar el documento y se reinicia la app.
    montarDocumento();
    iniciarApp();

    const requisitos = document.querySelectorAll('#lista-requisitos .item-lista');
    expect(requisitos.length).toBe(8);
  });
});
