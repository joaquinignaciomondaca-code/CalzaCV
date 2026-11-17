# CalzaCV

> **Nombre provisional.** CalzaCV es un prototipo en español, local y sin costo, para comparar
> una oferta laboral con tu perfil **requisito por requisito**, mostrando la evidencia de los
> dos lados. No promete resultados de búsqueda, entrevistas ni empleo.

![Estado](https://img.shields.io/badge/estado-prototipo-amber) · ![Sin backend](https://img.shields.io/badge/sin%20backend-2563eb)

---

## Qué hace

1. **Pegas** el texto de una oferta laboral y pulsas **Analizar**: la segmenta en requisitos con
   reglas simples (viñetas, encabezados, frases de requisito) y te deja **revisar, corregir o
   agregar requisitos a mano**.
2. **Pegas tu perfil de una vez**: un resumen o los fragmentos del CV que te interesen. Cada
   línea se convierte en una **evidencia editable**; antes de confirmar te dice **cuántas se
   van a añadir**.
3. **Comparas**: cada fila muestra el requisito, la frase de la oferta, la evidencia de tu
   perfil, la **sugerencia explicable** del sistema y **tu corrección**.
4. **Guardas todo en tu navegador** y, si quieres, exportas/importas un JSON.

Los datos de ejemplo (oferta y perfil) son **totalmente ficticios** y la interfaz lo dice
siempre que están en pantalla.

## El flujo de primer uso

En la primera visita **no se guarda nada** hasta que eliges por dónde empezar:

| Opción | Qué pasa |
|---|---|
| **Probar con la demo** | Se carga una oferta y un perfil inventados. Un banner visible recuerda que son ficticios y ofrece «Empezar con mis datos». |
| **Empezar con mis datos** | Estado vacío. Pegas una oferta, analizas, pegas un resumen de tu perfil y ya tienes comparación. |

El camino más corto hasta la primera comparación útil, con tus propios datos:

1. Pegar la oferta en «Texto de la oferta» → **Analizar oferta** *(1 campo, 1 botón)*.
2. Pegar el resumen de tu CV en «Resumen o fragmentos de tu CV» → **Ver fragmentos sugeridos**
   *(1 campo, 1 botón)*.
3. **Añadir N evidencias** → **1 botón*, con la cuenta visible antes de confirmar.
4. Revisar la comparación y, si hace falta, **Corregir** un requisito.

No hay que rellenar campos de experiencia, ubicación ni preferencias, ni subir archivos, ni
crear cuentas. En total: **dos pegados, cuatro acciones y un campo opcional por requisito**
(el respaldo de cada evidencia, que puede quedar vacío).

## Alcance y límites (importante)

| CalzaCV **sí** | CalzaCV **no** |
|---|---|
| Compara términos entre oferta y perfil | No calcula un puntaje general ni porcentaje de encaje |
| Muestra la evidencia de los dos lados | No predice ni estima un resultado ATS |
| Permite corregir cada requisito | No decide por ti si una habilidad existe o no |
| Convierte un resumen pegado en evidencias | No lee archivos, no hace OCR, no usa IA |
| Funciona sin cuentas y sin servidor | No envía postulaciones ni contacta bolsas de empleo |
| No usa IA externa | No hace scraping de sitios de ofertas |
| | No inventa «verdades de referencia»: no hay benchmark |

El estado **«Brecha»** significa que **no se encontró evidencia en tu perfil**. No afirma que
carezcas de la habilidad: significa que, con lo que hay registrado hoy, no hay nada que lo
sustente.

## Cómo ejecutar

Requisitos: **Node.js 22** o superior (probado con Node 22.22.3) y npm 10 o superior.

```bash
npm ci          # instala exactamente lo que dice package-lock.json
npm run dev     # servidor local de desarrollo → http://localhost:5173
npm run build   # genera el sitio estático en dist/
npm run preview # sirve dist/ para revisión local
```

Comprobaciones de calidad (las mismas que corre la CI):

```bash
npm run typecheck   # tsc --noEmit
npm run test        # vitest run  (65 pruebas)
npm run build       # vite build
npm run verificar   # las tres, en orden
```

La CI (`.github/workflows/ci.yml`) se dispara en cada *pull request* y en cada *push* a `main`,
con `permissions: contents: read`, sin secretos y sin despliegue.

> Para revisar la demo desde otro equipo con el servidor de desarrollo, habilita hosts extra:
> `CALZACV_HOSTS=mi-host.example npm run dev`. Por defecto solo se acepta el host local.

## Cómo entra el perfil

Un solo paso: pegas un resumen o fragmentos del CV en un área de texto y la aplicación los
convierte en evidencias (`src/dominio/ingesta.ts`):

- cada línea no vacía es una evidencia (se le quita la viñeta inicial: `-`, `•`, `*`, `1.`, `1)`);
- las líneas vacías o con solo espacios se ignoran;
- los **encabezados de CV** (`Experiencia:`, `IDIOMAS`, `Educación`, `Contacto:`, …) se ignoran;
- las líneas **repetidas** se descartan, y también las que ya coinciden con una evidencia tuya;
- antes de confirmar se muestra **cuántas evidencias se van a añadir** y cuáles son;
- después se pueden **editar o eliminar** como cualquier otra evidencia.

El texto pegado se trata como **texto plano**: se inserta con `textContent`, nunca como HTML, y
no se envía a ninguna red. La app no pide el CV completo: con un resumen basta, y la propia
interfaz sugiere **no incluir datos de contacto** (correo, teléfono, RUT) si no hacen falta.

## Cómo decide el estado de cada requisito

La comparación es **literal y conservadora** (`src/dominio/normalizacion.ts`):

- normaliza mayúsculas/minúsculas, acentos, puntuación y espacios;
- descarta palabras vacías (`de`, `con`, `para`…) y palabras genéricas de encabezado
  (`experiencia`, `conocimientos`, `manejo`…);
- aplica un **diccionario de alias explícito y pequeño**: `js ↔ javascript`, `ts ↔ typescript`,
  `node ↔ nodejs`, `postgres ↔ postgresql`, `mssql ↔ sqlserver`.

**No** hay stemming (`inventarios` no se unifica con `inventario`), ni similitud difusa, ni
relaciones semánticas implícitas. Una habilidad solo se considera equivalente a otra si está
declarada en ese diccionario.

Sobre los términos comparables del requisito y de la evidencia del perfil:

| Resultado | Regla |
|---|---|
| **Coincide** | Todos los términos del requisito aparecen en alguna evidencia del perfil. |
| **Coincidencia posible** | Aparece al menos un término, pero no todos. Se listan los que faltan. |
| **Brecha** | No aparece ningún término: no se encontró evidencia en tu perfil. |
| **Información insuficiente** | El requisito no deja términos comparables (es demasiado general). |

### Tres planos que nunca se mezclan

| Plano | Dónde vive | Qué es |
|---|---|---|
| Sugerencia del sistema | Derivada, se recalcula en cada render | Lo que propone el matcher, con su explicación y los términos comparados. |
| Tu corrección | `estado.correcciones[requisitoId]` | Tu juicio. **No** sobrescribe la sugerencia ni las evidencias. |
| Referencia externa | `estado.referencias[requisitoId]` | Etiqueta de un benchmark externo. **No existe todavía**: se muestra «no disponible». |

Las correcciones se guardan en un campo aparte del estado, con su nota y su fecha; la
sugerencia del matcher nunca se persiste ni se altera por una corrección.

### Demo y datos propios

El estado guardado lleva un campo `origen` (`demo` | `usuario`):

- Con `origen: 'demo'` la interfaz muestra un **banner visible** que dice que los datos son
  ficticios y ofrece «Empezar con mis datos»;
- La primera visita **ofrece una elección explícita** entre «Probar con la demo» y «Empezar con
  mis datos», y no persiste nada hasta que elijas;
- Si estás en la demo y pegas tu propia oferta o tu propio perfil, la aplicación **te pide
  confirmación** antes de reemplazar los datos de ejemplo (nunca borra nada sin preguntar).

El formato de datos guardados es versionado (`calzacv:estado:v2`). Un estado del formato
anterior se **migra** automáticamente: si su oferta era exactamente la de la demo, se marca
como demo; si no, como datos propios.

## Estructura

```
.
├── index.html                 # documento de la aplicación (esqueleto accesible)
├── vite.config.ts             # build estático, base relativa
├── tsconfig.json              # TypeScript estricto
├── .github/workflows/ci.yml   # CI: typecheck + test + build
├── PRIVACIDAD.md              # borrador de privacidad (para revisar)
├── src/
│   ├── main.ts                # punto de entrada
│   ├── estilos.css            # hoja de estilos única (responsive, claro/oscuro)
│   ├── dominio/
│   │   ├── tipos.ts           # modelo de datos y sus tres planos de provenance
│   │   ├── normalizacion.ts   # normalización conservadora + alias declarados
│   │   ├── segmentacion.ts    # oferta → requisitos (reglas simples)
│   │   ├── ingesta.ts         # texto pegado → evidencias (reglas simples)
│   │   ├── matching.ts        # requisito + evidencias → sugerencia explicable
│   │   ├── evaluacion.ts      # sugerencia + corrección + referencia → fila
│   │   ├── datos-demo.ts      # oferta y perfil ficticios de ejemplo
│   │   └── ids.ts
│   ├── almacenamiento/
│   │   ├── version.ts         # versión del formato y clave del almacenamiento
│   │   ├── migraciones.ts     # migración v1 → v2
│   │   └── local.ts           # persistencia local + exportar/importar JSON
│   └── ui/
│       ├── app.ts             # controlador (estado, acciones, guardado)
│       ├── vistas.ts          # construcción del DOM de los tres paneles
│       └── dom.ts             # ayudantes de DOM (texto siempre con textContent)
└── tests/
    ├── normalizacion.test.ts
    ├── segmentacion.test.ts
    ├── ingesta.test.ts
    ├── matching.test.ts
    ├── evaluacion.test.ts
    ├── almacenamiento.test.ts
    ├── demo.test.ts
    └── ui.test.ts             # prueba de humo de la interfaz en DOM
```

## Privacidad

Todo se procesa y se guarda **en tu navegador**. La aplicación no hace `fetch` a ningún
servicio, no incluye telemetría ni analítica, y no envía postulaciones. El bundle compilado
no contiene ninguna llamada de red (comprobable con `grep -E "fetch\(|XMLHttpRequest" dist/assets/*.js`).

Lee [PRIVACIDAD.md](./PRIVACIDAD.md) — es un borrador para revisar.

## Accesibilidad y diseño

- Interfaz en español, responsive (una columna en móvil, dos en mediana, dividida
  oferta/evidencia ↔ resultado en pantallas anchas).
- Navegable por teclado, con enlace «saltar al contenido», foco visible y `dialog` nativo para
  corregir un requisito.
- La vista previa de la ingesta anuncia la cuenta por `role="status"` y recibe el foco; tras
  confirmar, el foco pasa a la primera evidencia para seguir editando sin ratón.
- Los estados se muestran con **símbolo y texto**, nunca solo con color.
- Se respeta `prefers-reduced-motion` y `prefers-color-scheme`.

## Decisiones pendientes de revisión

- **Licencia: no se ha elegido ninguna.** Falta decidirla (por ejemplo, MIT) antes de
  distribuir; por eso este repositorio todavía no tiene archivo `LICENSE`.
- El nombre «CalzaCV» es provisional y las afirmaciones del sitio son descriptivas, no
  promesas de resultados.
- Falta definir qué pasa si el almacenamiento del navegador se limpia (hoy se pierde todo;
  por eso existe la exportación manual).
- `PRIVACIDAD.md` es un borrador sin validación legal.
- **El flujo de entrada se diseñó para reducir fricción, pero aún no se ha observado con
  personas reales**: no hay datos de uso, ni tiempos medidos, ni tests de usabilidad.

## Estado de la CI

`.github/workflows/ci.yml` corre `npm ci` + `npm run typecheck` + `npm run test` +
`npm run build` en cada *pull request* y en cada *push* a `main`. Sin secretos, sin
permisos de escritura y **sin despliegue**: publicar el sitio es un paso posterior y aparte.
