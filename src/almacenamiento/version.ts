/**
 * Versión del formato de datos persistidos.
 * Si cambia, la carga detecta la incompatibilidad y aplica la migración que exista
 * (ver `migraciones.ts`); nunca intenta adivinar una migración automática.
 */
export const VERSION_DATOS = 2;

/** Clave del almacenamiento local del navegador. Incluye la versión del formato. */
export const CLAVE_ESTADO = 'calzacv:estado:v2';

/** Clave del formato anterior: se lee una sola vez para migrar a la versión actual. */
export const CLAVE_ESTADO_V1 = 'calzacv:estado:v1';
