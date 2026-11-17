# Privacidad — CalzaCV (documento provisional, sujeto a revisión)

## Qué hace esta versión

CalzaCV es, en esta etapa, una **aplicación web estática que se ejecuta en el navegador**.
No hay backend, no hay cuentas, no hay servidor que reciba datos.

## Reglas de la versión actual

1. **Todo se queda en tu equipo.** El texto de la oferta que pegas, las evidencias de tu
   perfil, las correcciones y las comparaciones se guardan en el almacenamiento local del
   navegador (`localStorage`), bajo la clave `calzacv:estado:v1`.
2. **No hay llamadas de red desde la aplicación.** El sitio se sirve como archivos estáticos.
   La aplicación no hace `fetch`, ni envía analítica, ni reporta errores a ningún servicio.
3. **No se envía ni se publica ninguna postulación.** CalzaCV no contacta bolsas de empleo,
   no hace scraping de sitios de ofertas y no envía tu CV a terceros.
4. **Exportar/importar es manual y local.** El botón «Exportar JSON» descarga un archivo en tu
   equipo. «Importar JSON» lo lee desde tu equipo. Nada sale de tu equipo en ese proceso.
5. **Los datos de ejemplo son ficticios.** Los datos precargados en la demo son inventados para
   ilustrar el flujo; no describen a ninguna persona real.

## Qué debería decidir la persona responsable del proyecto (pendiente)

- Periodo de retención: hoy los datos viven en el navegador hasta que la persona borra el
  estado con «Vaciar todo» o limpia el almacenamiento del navegador.
- Qué ocurre al limpiar datos del navegador (la información se pierde; conviene recomendar
  exportar con regularidad).
- Si en el futuro se incorpora telemetría, debe ser una decisión explícita, opt-in y
  documentada aquí antes de existir en el código.
- Si en el futuro se incorpora IA externa, este documento debe describir qué datos salen del
  equipo, con qué proveedor y bajo qué base de consentimiento.

## Cómo revisar este documento

Este texto es un borrador para revisión. No tiene valor legal y no ha sido validado por
asesoría. Cualquier cambio debe quedar registrado aquí.
