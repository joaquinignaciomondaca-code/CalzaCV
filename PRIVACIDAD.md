# Privacidad — CalzaCV (documento provisional, sujeto a revisión)

## Qué hace esta versión

CalzaCV es, en esta etapa, una **aplicación web estática que se ejecuta en el navegador**.
No hay backend, no hay cuentas, no hay servidor que reciba datos.

## Reglas de la versión actual

1. **Todo se queda en tu equipo.** El texto de la oferta que pegas, el resumen o los fragmentos
   del CV que pegas, las evidencias, las correcciones y las comparaciones se guardan en el
   almacenamiento local del navegador (`localStorage`), bajo la clave `calzacv:estado:v2`.
2. **No hay llamadas de red desde la aplicación.** El sitio se sirve como archivos estáticos.
   La aplicación no hace `fetch`, ni envía analítica, ni reporta errores a ningún servicio.
   Tampoco lee archivos de tu disco: el perfil se pega como texto.
3. **El texto pegado se trata como texto plano.** No se interpreta como HTML ni se ejecuta nada
   de lo que pegues.
4. **No se envía ni se publica ninguna postulación.** CalzaCV no contacta bolsas de empleo,
   no hace scraping de sitios de ofertas y no envía tu CV a terceros.
5. **Exportar/importar es manual y local.** El botón «Exportar JSON» descarga un archivo en tu
   equipo. «Importar JSON» lo lee desde tu equipo. Nada sale de tu equipo en ese proceso.
6. **Los datos de ejemplo son ficticios.** Los datos precargados en la demo son inventados para
   ilustrar el flujo; no describen a ninguna persona real. Mientras están en pantalla, un
   banner visible lo indica y ofrece pasar a tus propios datos.
7. **No se borra nada sin confirmación.** Cambiar de la demo a tus datos, vaciar el estado o
   reemplazar los datos de ejemplo siempre pide confirmación.

## Qué conviene hacer (recomendación, no una obligación técnica)

- **No pegues datos de contacto** (correo, teléfono, RUT, dirección) si no son necesarios para
  comparar: la interfaz lo sugiere en el paso de pegar el perfil. Tampoco hace falta pegar el
  CV completo; con un resumen de tu experiencia y tus estudios basta.
- Recuerda que el almacenamiento del navegador **no está cifrado**: quien tenga acceso a tu
  perfil de navegador puede leer lo que guardaste. Exporta con regularidad y borra el estado
  cuando ya no lo necesites («Vaciar todo»).
- Si usas un equipo compartido o un perfil de navegador público, asume que lo que pegues queda
  accesible en ese perfil.

## Cambios de formato y migración

El formato de datos guardados es versionado. Un estado guardado con el formato anterior
(`calzacv:estado:v1`) se **migra** automáticamente al abrir la aplicación: se guarda en la
clave actual y la copia del formato anterior se elimina, porque ya quedó superada. La migración
no modifica ni pierde datos: solo agrega la marca de si lo que hay en pantalla venía de la demo
o son tus datos.

## Qué debería decidir la persona responsable del proyecto (pendiente)

- Periodo de retención: hoy los datos viven en el navegador hasta que la persona borra el
  estado con «Vaciar todo» o limpia el almacenamiento del navegador.
- Si en el futuro se incorpora telemetría, debe ser una decisión explícita, opt-in y
  documentada aquí antes de existir en el código.
- Si en el futuro se incorpora IA externa, este documento debe describir qué datos salen del
  equipo, con qué proveedor y bajo qué base de consentimiento.
- Si en el futuro se ofrece cifrado local de los datos guardados, hay que documentarlo aquí.

## Cómo revisar este documento

Este texto es un borrador para revisión. No tiene valor legal y no ha sido validado por
asesoría. Cualquier cambio debe quedar registrado aquí.
