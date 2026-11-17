/** Ayudantes mínimos de DOM. Todo el texto del usuario se inserta con `textContent`
 *  (nunca como HTML), para que pegar una oferta no pueda inyectar marcado. */

type Atributos = Record<string, string | number | boolean | undefined>;

export function crear<K extends keyof HTMLElementTagNameMap>(
  etiqueta: K,
  atributos: Atributos = {},
  hijos: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const nodo = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(atributos)) {
    if (valor === undefined || valor === false) continue;
    if (clave === 'class') nodo.className = String(valor);
    else if (clave === 'texto') nodo.textContent = String(valor);
    else if (valor === true) nodo.setAttribute(clave, '');
    else nodo.setAttribute(clave, String(valor));
  }
  for (const hijo of hijos) nodo.append(hijo);
  return nodo;
}

export function vaciar(nodo: HTMLElement): void {
  nodo.replaceChildren();
}

export function porId<T extends HTMLElement>(id: string): T {
  const nodo = document.getElementById(id);
  if (!nodo) throw new Error(`Falta el elemento #${id} en el documento`);
  return nodo as T;
}
