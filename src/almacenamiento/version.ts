/**
 * Versión del formato de datos persistidos.
 * Si cambia, la carga detecta la incompatibilidad y no intenta adivinar una migración.
 */
export const VERSION_DATOS = 1;

/** Clave del almacenamiento local del navegador. Incluye la versión del formato. */
export const CLAVE_ESTADO = 'calzacv:estado:v1';
