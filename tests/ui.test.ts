// @vitest-environment happy-dom
/**
 * Prueba de humo de la interfaz: monta el HTML real del sitio en un DOM y comprueba
 * el flujo de primer uso, la comparación con evidencia de los dos lados y la corrección
 * del usuario (que queda guardada aparte de la sugerencia).
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { iniciarApp } from '../src/ui/app';

const CLAVE = 'calzacv:estado:v2';

function montarDocumento(): void {
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
  const cuerpo = html.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] ?? '';
  document.body.innerHTML = cuerpo.replace(/<script[\s\S]*?<\/script>/g, '');
}

function pulsar(id: string): void {
  document.querySelector<HTMLButtonElement>(`#${id}`)?.click();
}

function textosEvidencia(): string[] {
  return Array.from(
    document.querySelectorAll<HTMLTextAreaElement>('#lista-evidencias textarea'),
  ).map((area) => area.value);
}

function escribir(id: string, valor: string): void {
  const campo = document.querySelector<HTMLTextAreaElement>(`#${id}`);
  if (campo) campo.value = valor;
}

describe('interfaz: primer uso y comparación', () => {
  beforeEach(() => {
    window.localStorage.clear();
    montarDocumento();
    window.confirm = () => true;
  });

  it('en la primera visita ofrece elegir entre demo y datos propios, sin guardar nada', () => {
    iniciarApp();

    expect(document.querySelector<HTMLElement>('#bienvenida')?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('#contenido')?.dataset.fase).toBe('bienvenida');
    // No se persiste nada hasta que la persona elige.
    expect(window.localStorage.getItem(CLAVE)).toBeNull();
  });

  it('«Probar con la demo» carga los datos ficticios y muestra el banner que lo dice', () => {
    iniciarApp();
    pulsar('btn-empezar-demo');

    expect(document.querySelectorAll('#lista-requisitos .item-lista').length).toBe(8);
    expect(document.querySelectorAll('#filas-comparacion tr').length).toBe(8);
    expect(document.querySelector<HTMLElement>('#banner-demo')?.hidden).toBe(false);
    expect(document.querySelector('#banner-demo')?.textContent).toMatch(/datos ficticios/i);
    expect(window.localStorage.getItem(CLAVE)).not.toBeNull();
  });

  it('«Empezar con mis datos» desde el banner vacía el estado y esconde el banner', () => {
    iniciarApp();
    pulsar('btn-empezar-demo');
    pulsar('btn-banner-mis-datos');

    expect(document.querySelectorAll('#lista-requisitos .item-lista').length).toBe(0);
    expect(document.querySelectorAll('#lista-evidencias .item-lista').length).toBe(0);
    expect(document.querySelector<HTMLElement>('#banner-demo')?.hidden).toBe(true);
  });

  it('la demo muestra requisito, evidencia de la oferta, evidencia del perfil y estado', () => {
    iniciarApp();
    pulsar('btn-empezar-demo');

    const primeraFila = document.querySelector('#filas-comparacion tr');
    const celdas = primeraFila?.querySelectorAll('th, td');
    expect(celdas?.length).toBe(5);
    expect(celdas?.[0].textContent).toContain('Excel');
    expect(celdas?.[1].textContent).toContain('reportes diarios');
    expect(celdas?.[2].textContent).toContain('Excel');
    expect(celdas?.[3].textContent).toContain('Coincide');
    expect(celdas?.[4].textContent).toContain('Corregir');
  });

  it('el mensaje de brecha dice que no se encontró evidencia en tu perfil', () => {
    iniciarApp();
    pulsar('btn-empezar-demo');

    const filaPowerBi = Array.from(document.querySelectorAll('#filas-comparacion tr')).find((fila) =>
      fila.textContent?.includes('Power BI'),
    );
    expect(filaPowerBi).toBeDefined();
    expect(filaPowerBi?.textContent).toMatch(/no se encontró evidencia en tu perfil/i);
  });

  it('la corrección del usuario se guarda aparte y no toca la sugerencia', () => {
    iniciarApp();
    pulsar('btn-empezar-demo');

    const fila = Array.from(document.querySelectorAll('#filas-comparacion tr')).find((f) =>
      f.textContent?.includes('Power BI'),
    );
    fila?.querySelector<HTMLButtonElement>('.celda--correccion .boton')?.click();

    const dialogo = document.querySelector<HTMLDialogElement>('#dialogo-correccion');
    expect(dialogo?.open).toBe(true);

    const radio = dialogo?.querySelector<HTMLInputElement>('input[name="estado"][value="coincide"]');
    expect(radio).not.toBeNull();
    if (radio) radio.checked = true;

    dialogo
      ?.querySelector<HTMLFormElement>('#form-correccion')
      ?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

    const guardado = window.localStorage.getItem(CLAVE);
    expect(guardado).not.toBeNull();
    const datos = JSON.parse(guardado ?? '{}') as {
      correcciones: Record<string, { estado: string }>;
      referencias: Record<string, unknown>;
    };
    expect(Object.values(datos.correcciones)).toHaveLength(1);
    expect(Object.values(datos.correcciones)[0].estado).toBe('coincide');
    expect(datos.referencias).toEqual({});

    const filaCorregida = Array.from(document.querySelectorAll('#filas-comparacion tr')).find((f) =>
      f.textContent?.includes('Power BI'),
    );
    const sugerencia = filaCorregida?.querySelector('.celda--sugerencia')?.textContent ?? '';
    const correccion = filaCorregida?.querySelector('.celda--correccion')?.textContent ?? '';
    expect(sugerencia).toContain('Brecha de evidencia');
    expect(sugerencia).toContain('no disponible');
    expect(correccion).toContain('Corregido por ti');
  });
});

describe('interfaz: entrada de perfil en un solo paso', () => {
  beforeEach(() => {
    window.localStorage.clear();
    montarDocumento();
    window.confirm = () => true;
  });

  it('muestra cuántos fragmentos se añadirán antes de confirmar', () => {
    iniciarApp();
    pulsar('btn-empezar-mis-datos');
    escribir(
      'texto-perfil',
      'Experiencia:\n\n- Control de inventario en bodega\n- Control de inventario en bodega\n',
    );
    pulsar('btn-ver-fragmentos');

    const resumen = document.querySelector('#previa-resumen')?.textContent ?? '';
    expect(resumen).toMatch(/Se añadirá 1 evidencia nueva/);
    expect(resumen).toMatch(/repetida/);
    expect(resumen).toMatch(/encabezado/);
    expect(resumen).toMatch(/vacía/);
    // Todavía no se ha añadido nada.
    expect(document.querySelectorAll('#lista-evidencias .item-lista').length).toBe(0);
  });

  it('confirmar convierte los fragmentos en evidencias editables', () => {
    iniciarApp();
    pulsar('btn-empezar-mis-datos');
    escribir('texto-perfil', '- Control de inventario en bodega\n- Consultas SQL');
    pulsar('btn-ver-fragmentos');
    pulsar('btn-anadir-fragmentos');

    const textos = textosEvidencia();
    expect(textos.length).toBe(2);
    expect(textos[0]).toBe('Control de inventario en bodega');
    expect(textos[1]).toBe('Consultas SQL');
  });

  it('no se pierde ninguna evidencia propia al añadir fragmentos', () => {
    iniciarApp();
    pulsar('btn-empezar-mis-datos');

    // Una evidencia escrita a mano, antes de pegar nada.
    pulsar('btn-agregar-evidencia');
    const area = document.querySelector<HTMLTextAreaElement>('#lista-evidencias textarea');
    if (area) area.value = 'Curso de Excel en mi escuela';
    area?.dispatchEvent(new Event('change', { bubbles: true }));

    escribir('texto-perfil', 'Uso de Excel y tablas de cálculo en reportes diarios\nFragmento nuevo mío\n');
    pulsar('btn-ver-fragmentos');
    pulsar('btn-anadir-fragmentos');

    const textos = textosEvidencia();
    expect(textos.length).toBe(3);
    expect(textos).toContain('Curso de Excel en mi escuela');
    expect(textos).toContain('Uso de Excel y tablas de cálculo en reportes diarios');
    expect(textos).toContain('Fragmento nuevo mío');
  });

  it('en modo demo, pegar tu perfil reemplaza los datos de ejemplo (previa confirmación)', () => {
    iniciarApp();
    pulsar('btn-empezar-demo');
    expect(textosEvidencia().length).toBe(5);

    escribir('texto-perfil', 'Fragmento nuevo mío');
    pulsar('btn-ver-fragmentos');
    pulsar('btn-anadir-fragmentos');

    const textos = textosEvidencia();
    expect(textos.length).toBe(1);
    expect(textos[0]).toBe('Fragmento nuevo mío');
    // Y deja de ser una demo: el banner se esconde.
    expect(document.querySelector<HTMLElement>('#banner-demo')?.hidden).toBe(true);
  });

  it('el texto pegado con HTML se muestra literal, sin interpretarse', () => {
    iniciarApp();
    pulsar('btn-empezar-mis-datos');
    escribir('texto-perfil', '<img src=x onerror=alert(1)>\n<b>Excel</b>');
    pulsar('btn-ver-fragmentos');
    pulsar('btn-anadir-fragmentos');

    expect(textosEvidencia()).toContain('<img src=x onerror=alert(1)>');
    expect(textosEvidencia()).toContain('<b>Excel</b>');
    expect(document.querySelectorAll('#lista-evidencias img').length).toBe(0);
    expect(document.querySelectorAll('#lista-evidencias b').length).toBe(0);
  });

  it('recargar conserva lo guardado en el navegador', () => {
    iniciarApp();
    pulsar('btn-empezar-mis-datos');
    escribir('texto-perfil', '- Control de inventario en bodega');
    pulsar('btn-ver-fragmentos');
    pulsar('btn-anadir-fragmentos');

    // Simula una recarga: se vuelve a montar el documento y se reinicia la app.
    montarDocumento();
    iniciarApp();

    expect(document.querySelectorAll('#lista-evidencias .item-lista').length).toBe(1);
    expect(document.querySelector<HTMLElement>('#bienvenida')?.hidden).toBe(true);
  });
});
