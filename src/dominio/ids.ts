/** Identificador local, sin dependencias externas. */
export function nuevoId(prefijo = 'id'): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return `${prefijo}_${c.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }
  return `${prefijo}_${Math.random().toString(36).slice(2, 10)}`;
}
