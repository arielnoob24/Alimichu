# Auditoría de Alimichu

- **Fecha:** 8 de octubre de 2026
- **Commit revisado:** `7bd0cf9` (rama `main`)
- **Hecha por:** el agente `auditor`, que solo leyó el código y no modificó archivos

**Veredicto: ⚠️ Se puede seguir publicando, pero no conviene entregársela a Alina todavía.** La app no tiene fallas de seguridad y pasa todas las validaciones. Antes de dársela hay que resolver tres cosas:

- el riesgo de que pierda su armario: no hay copia de seguridad y la app no se instala como app de verdad;
- el motor de outfits, que se pone lento y repite siempre el mismo conjunto;
- los errores de la base de datos, que hoy aparecen como si el armario estuviera vacío.

**Resultado de `npm run check`: pasa.** ESLint y html-validate no reportan nada y las 36 pruebas pasan. Las últimas 5 publicaciones del CI en GitHub terminaron bien.

**Cómo se verificó:** se leyó todo el código. Además:

- se probó el motor en Node con armarios de distintos tamaños;
- se midió la barra superior en Chrome sin ventana a 360, 390, 402, 440, 600 y 900 px, con capturas;
- se revisó el árbol de accesibilidad de Chrome, que es lo que lee un lector de pantalla.

**Orden recomendado:** 1 → 2 → 3 → 6 → 4 → 5. Primero, que Alina no pierda su ropa; después, que el botón Alina funcione bien con un armario grande.

---

## 🔴 Gravedad alta

### 1. No hay copia de seguridad: si se borran los datos, Alina pierde todo su armario

- **Dónde:** no existe ningún código para exportar o importar. El plan lo deja para "después" (`PLAN.md:206`, `PLAN.md:287`).
- **Qué falla:** las prendas, fotos y favoritos viven solo en IndexedDB (`js/armario.js`). Alina los pierde si pasa cualquiera de estas cosas:
  - cambia de iPhone;
  - borra la app de la pantalla de inicio;
  - borra los datos de Safari;
  - iOS los borra solo (ver el punto 2).
- **Otro problema:** la app instalada y Safari guardan los datos por separado. Si Alina empieza a cargar ropa en Safari y después instala la app, la app aparece vacía y no hay forma de pasar los datos.
- **Escenario:** Alina carga 60 prendas, cambia de iPhone y su armario ya no está.
- **Lo que está bien:**
  - `persist()` sí se llama (`js/armario.js:87-89`). Pero se pide recién al guardar, nadie revisa la respuesta y Safari puede rechazarlo sin avisar.
  - El espacio no es problema: unas 300 fotos de 800 px pesan alrededor de 30 a 45 MB.

**Opciones:**

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Botones "Guardar copia", que descarga un archivo `.json` con las fotos en base64, y "Restaurar" | Funciona en Safari y en Chrome, no necesita servidor y sirve para cambiar de teléfono | El archivo pesa decenas de MB y Alina tiene que acordarse de hacerlo |
| **B** | Compartir la copia con `navigator.share({ files })` para mandarla a Archivos, iCloud o WhatsApp | En iPhone es muy natural: aparece la hoja de compartir | No existe en todos los navegadores, así que igual hace falta la A |
| **C** | Recordatorio dentro de la app ("Hace 30 días que no guardas una copia") | Evita que se le olvide | No sirve sin la A |

👉 **Recomendado: A + B, y después C.** La lógica de armar y leer el archivo debería ir en un módulo puro con pruebas.

### 2. La app no se puede instalar como app: falta el `manifest` y las etiquetas `apple-mobile-web-app-*`

- **Dónde:**
  - `index.html:3-19` no tiene `<link rel="manifest">`, `apple-mobile-web-app-capable` ni `apple-mobile-web-app-status-bar-style`.
  - No existe un `manifest.json`, y el paso "Preparar sitio" del workflow (`.github/workflows/ci-cd.yml:37-38`) tampoco lo copiaría.
  - Siguen sin marcar en `PLAN.md:272-274` la instalación y la pantalla de bienvenida.
- **Qué falla:** en iOS 17 y 18, sin estas etiquetas, el ícono que Alina agregue a la pantalla de inicio abre una pestaña de Safari en vez de una app. La protección contra el borrado a los 7 días sin uso es para las apps instaladas. En iOS 26 cualquier sitio agregado a la pantalla de inicio se abre como app, pero el plan dice iOS 17 o más nuevo, así que no conviene depender de eso.
- **Otro detalle:** sin `start_url`, el ícono guarda la dirección exacta en la que estaba. Si Alina lo agrega estando en Armario, la app abre siempre en Armario.
- **Escenario:** Alina usa el ícono, que en realidad abre Safari. Se va de vacaciones 8 días y, al volver, Safari pudo haber borrado su armario.

**Opciones:**

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Agregar `manifest.json` (`"display": "standalone"`, `"start_url": "./"`, `"scope": "./"`, íconos de 192 y 512 px) y las etiquetas `apple-mobile-web-app-capable` y `apple-mobile-web-app-status-bar-style: black-translucent`; agregar `manifest.json` al paso "Preparar sitio" | Es lo estándar y además sirve para instalar en Android | Hay que probarlo en el iPhone real, sobre todo los bordes seguros con la barra de estado transparente |
| **B** | Lo de A, más una pantalla de bienvenida que detecte si no está instalada (`navigator.standalone` o `matchMedia('(display-mode: standalone)')`) y explique "Compartir → Agregar a pantalla de inicio" | Evita que Alina use la versión de Safari sin darse cuenta | Más trabajo |

👉 **Recomendado: B.** Sin eso, el riesgo del punto 1 es mucho mayor.

### 3. Si la base de datos falla, la app dice "tu armario está vacío"

- **Dónde:**
  - `js/vista-armario.js:18-30`: el error deja `prendas = []` y muestra "Todavía no hay prendas en tu armario".
  - `js/vista-favoritos.js:29`: `.catch(() => [])` hace aparecer "Todavía no tienes outfits favoritos".
  - `js/vista-outfit.js:90`: `.catch(() => [])` hace aparecer "Agrega una parte de arriba…".
  - `js/armario.js:10-38`: la conexión se guarda una sola vez y solo se reinicia en `onversionchange`. No hay `onclose` ni un segundo intento.
- **Qué falla:** se ha visto en Safari que se pierde la conexión con IndexedDB al volver de segundo plano (error "Connection to Indexed Database server lost"). La conexión guardada queda muerta, todo falla hasta recargar y la app le dice a Alina que no tiene ropa.
- **Escenario:** Alina vuelve a la app después de un rato y ve el armario vacío. Cree que perdió todo y vuelve a cargar las prendas, que terminan duplicadas.

**Opciones:**

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Mostrar un estado de error propio ("No pude abrir tu armario. Toca para reintentar") en vez del mensaje de vacío | Simple y honesto | No arregla la causa |
| **B** | En `armario.js`, poner `base.onclose = () => conexion = null` y reintentar una vez si `transaction()` lanza `InvalidStateError` | Se recupera sola | Un poco más de código y es difícil de probar sin un iPhone |

👉 **Recomendado: A + B.** La A evita el susto y la B resuelve el problema la mayoría de las veces.

### 4. El motor de outfits se vuelve muy lento con un armario real

- **Dónde:** `js/outfits.js:110-141`. `combinaciones()` genera todas las combinaciones posibles y `generarOutfit()` (`:144-160`) le pone puntaje a cada una.
- **Lo que se midió en el PC con Node** (en el iPhone puede ser parecido o peor):

  | Armario (arriba / abajo / zapatos / extras / vestidos) | Combinaciones | Tiempo |
  |---|---|---|
  | 15 / 10 / 6 / 8 / 4 | 8.316 | 0,3 s |
  | 30 / 20 / 10 / 15 / 8 | 97.280 | 2,4 s |
  | 40 / 25 / 12 / 20 / 10 | 254.520 | 6,8 s |

- **Qué falla:** mientras calcula, la pantalla se congela. No se puede tocar nada y las animaciones se detienen.
- **Escenario:** con 80 prendas, Alina aprieta "Otra combinación" y la app queda pegada 2 o 3 segundos cada vez.

**Opciones:**

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Sortear una muestra (por ejemplo 2.000 combinaciones al azar) en vez de probarlas todas | Tiempo fijo y bajo; cambia poco el código y las pruebas siguen sirviendo | Podría no encontrar la mejor combinación absoluta, aunque con 2.000 casi no se nota |
| **B** | Elegir por partes: primero la parte de arriba, después la de abajo que mejor combine con ella, y así | Muy rápido | Hay que reescribir el puntaje y las pruebas |
| **C** | Mover el cálculo a un Web Worker | La pantalla no se congela | Igual tarda varios segundos y agrega complejidad |

👉 **Recomendado: A.** Además, calcular el HSL una vez por prenda en vez de en cada par, y agregar una prueba que exija menos de cierto tiempo con 100 prendas.

### 5. Los conjuntos salen casi siempre, y algunos conjuntos bloquean todo

- **Dónde:**
  - `js/outfits.js:68-73`: el bono por conjunto suma +1,5 por cada prenda del conjunto, o sea +3 en un conjunto de 2 piezas. Solo se sortea entre las combinaciones que están a 1,5 puntos de la mejor (`:157`).
  - `js/outfits.js:79-90`: la regla de conjuntos.
- **Qué falla (verificado en Node):**
  - Con 43 prendas y un solo conjunto de 2 piezas, **el conjunto salió 100 de 100 veces**, aun con la regla que evita repetir. Las variantes con otros zapatos o extras cuentan como outfits distintos.
  - Un conjunto con dos extras (por ejemplo, chaqueta y cartera del mismo set) o con dos prendas del mismo lugar nunca puede salir completo, así que esas prendas no aparecen nunca.
  - Si esas son las únicas prendas que combinan, la app dice "No hay combinaciones con las prendas fijas. Quita algún candado." aunque Alina no haya puesto ningún candado.
- **Escenario:** Alina marca su set rosado como conjunto y desde ese momento el botón Alina siempre le propone el set rosado.

**Opciones:**

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Bajar el bono a un valor fijo pequeño (+0,5 por conjunto completo, no por prenda) y mostrar el mensaje del candado solo si hay candados | Cambio mínimo | El problema de los dos extras sigue |
| **B** | Lo de A, y además que la regla de conjuntos exija solo las piezas que caben, o que se permita más de un extra | Arregla los dos problemas | Hay que pensar bien la regla y escribir más pruebas |

👉 **Recomendado: B**, con pruebas nuevas en `tests/outfits.test.js`: "con un conjunto, salen también otros outfits" y "un conjunto con dos accesorios sigue apareciendo".

---

## 🟡 Gravedad media

### 6. `capture="environment"` no deja elegir fotos de la galería

- **Dónde:** `index.html:189`. Además, `PLAN.md:192` dice lo contrario ("También deja elegir una foto de la galería").
- **Qué falla:** con `capture`, tanto iOS como Chrome en Android abren directo la cámara, sin el menú de "Fototeca / Tomar foto / Elegir archivo". En Android, abrir la cámara también puede hacer que Chrome cierre la pestaña por falta de memoria.
- **Escenario:** Alina quiere agregar una prenda de la que ya tiene una foto, o una foto de una tienda, y no puede.

**Opciones:**

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Quitar `capture` | iOS muestra el menú con cámara y galería; es un cambio de una línea | Un toque más para llegar a la cámara |
| **B** | Dos botones: "Tomar foto" (con `capture`) y "Elegir de mis fotos" (sin `capture`), que usen el mismo código | Claro y rápido para las dos cosas | Un poco más de HTML y CSS |

👉 **Recomendado: B.** Si se quiere algo inmediato, la A.

### 7. La actualización automática puede recargar la app en medio de algo

- **Dónde:** `js/app.js:31-46` (revisa la versión en cada `visibilitychange`) y `js/app.js:19-23` (recarga con `controllerchange`).
- **Qué falla:** si hay una versión nueva, al volver a la app se recarga sin preguntar. Se pierden:
  - la foto recién preparada y el formulario de "Agregar prenda";
  - el outfit que estaba viendo;
  - la selección de "Nuevo outfit".
- **Escenario:** Ariel toca "Tocar para tomar una foto" y se abre la cámara, así que la página pasa a segundo plano. Saca la foto y vuelve. Si justo se publicó un cambio, la app se recarga y la foto se pierde. Pasa seguido porque cada commit se publica.

**Opciones:**

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | No recargar si está en una vista (`#agregar`, `#crear`, `#prenda`) o si el formulario tiene datos; esperar a que vuelva a una pestaña | Simple y no molesta | La versión nueva tarda un poco más en aparecer |
| **B** | Revisar la versión solo al abrir la app, no al volver de segundo plano | Lo más simple | Si la app queda abierta muchos días, no se actualiza |
| **C** | Mostrar un aviso "Hay una versión nueva. Toca para actualizar" | Alina decide | Le agrega una decisión que no tiene por qué entender |

👉 **Recomendado: A.**

### 8. Los lectores de pantalla leen los títulos y botones tres veces, y leen la barra escondida

- **Dónde:** `css/styles.css:174-181` (`content: attr(data-texto)` en `::before` y `::after` de `.cromo`) y `css/styles.css:455-459` (en las vistas, la barra de abajo solo se hace transparente).
- **Lo que se verificó en el árbol de accesibilidad de Chrome:**
  - el botón se lee "Alina Alina Alina";
  - el título y el enlace "Agregar prenda" también se leen tres veces;
  - en `#agregar` siguen apareciendo los enlaces invisibles "Armario", "Inicio" y "Favoritos".
- **Escenario:** con VoiceOver activado, todo se repite y se puede llegar a botones que no se ven.

**Opciones:**

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Texto alternativo vacío en el CSS: `content: attr(data-texto) / ""` | Arregla todo de una vez | Funciona desde Safari 17.4, así que en iOS 17.0 a 17.3 se seguiría repitiendo |
| **B** | Poner `aria-label` en cada elemento `.cromo`, o en el botón o título que lo contiene | Funciona en todas partes | Hay que acordarse de ponerlo en cada uno |

Para la barra escondida: ponerle `visibility: hidden` (con un retraso para no cortar la animación) o el atributo `inert` desde `app.js`.

👉 **Recomendado: B + `inert`.** Es lo más seguro para iOS 17.

### 9. Las letras no funcionan sin conexión y quedan invisibles con internet lento

- **Dónde:** `index.html:16` (Google Fonts con `display=block`) y `sw.js:22` (el service worker no guarda archivos de otros dominios).
- **Qué falla:**
  - Sin conexión, si el navegador ya borró su copia de la hoja de Google (dura cerca de un día), Shrikhand no carga y el iPhone muestra otra letra cursiva.
  - Con internet lento, `display=block` deja el texto invisible hasta 3 segundos.
  - Cada vez que Alina abre la app, su iPhone le pide algo a Google.

**Opciones:**

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Guardar las fuentes `.woff2` en `assets/fonts/` y cargarlas con `@font-face` desde `styles.css` (`font-display: swap`) | Funciona sin conexión, es más rápido y más privado | Pesan unos 50 a 100 KB; la licencia (OFL) lo permite |
| **B** | Que `sw.js` también guarde las respuestas de `fonts.googleapis.com` y `fonts.gstatic.com` | No hay que tocar el HTML | Sigue dependiendo de Google y complica el service worker |

👉 **Recomendado: A.**

### 10. Tocar dos veces "Guardar prenda" mientras se prepara la foto guarda la prenda dos veces

- **Dónde:** `js/vista-armario.js:132` (`await preparando`) ocurre antes de `boton.disabled = true` (`:148`).
- **Escenario:** Alina elige una foto grande y ve "Preparando foto…". Toca "Guardar prenda", no pasa nada y vuelve a tocar. Quedan dos prendas iguales.

**Opciones:**

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Desactivar el botón al principio de `alGuardar` y volver a activarlo si la validación falla | Dos líneas | Ninguno relevante |
| **B** | Una variable `guardando` que ignore el segundo toque | Igual de simple | El botón no se ve desactivado y Alina no sabe que la app está trabajando |

👉 **Recomendado: A**, más el texto "Guardando…" en el botón.

### 11. El título de la barra superior se pisa con "‹ Volver" en celulares angostos

- **Dónde:** `css/styles.css:468` (columnas laterales iguales), `:479-484` (título de 1.2rem que no se corta) y `:487-503`.
- **Cuánto se mete el botón sobre el título:**
  - "‹ Armario" con "Agregar prenda": 23 px a 360 px de ancho, 8 px a 390 y 2 px a 402;
  - "‹ Favoritos" con "Nuevo outfit": 15 px a 360;
  - a 440 px o más, no se tocan.
- **Lo que está bien:** el margen `calc(50% - 50vw)` del último cambio funciona. La barra va de borde a borde en todos los anchos y no hay scroll horizontal entre 360 y 900 px.
- **Escenario:** en el Android de Ariel se ve encimado. Muchos Samsung miden 360 o 384 px.

**Opciones:**

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Achicar el título en pantallas angostas (por ejemplo `clamp(1rem, 4.6vw, 1.2rem)`) y bajar el padding del botón Volver | En el iPhone se ve igual | A 360 px el título queda más chico |
| **B** | Como en iOS: dejar solo la flecha "‹" (con `aria-label`) y nombrar el destino únicamente para lectores de pantalla | Nunca se pisa | Se pierde el texto que ayuda a orientarse |
| **C** | Cortar el título con `text-overflow: ellipsis` | Se corta solo | No se lleva bien con el texto de cromo, que usa pseudoelementos |

👉 **Recomendado: A**, midiendo de nuevo a 360 px.

---

## 🟢 Gravedad baja

### 12. Un outfit puede quedar guardado varias veces en Favoritos

- **Dónde:** `js/vista-outfit.js:96` (`favoritoId = null` en cada generación) y `js/armario.js:71-76`, que no revisa si ya existe.
- **Escenario:** vuelve a salir un outfit que ya era favorito y el corazón dice "Guardar". Alina lo toca y queda repetido. Lo mismo pasa con "Nuevo outfit".

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Al generar, buscar si `claveOutfit` coincide con un favorito y marcar el corazón como guardado | Lo que se ve es real | Hay que leer los favoritos |
| **B** | Al guardar, no duplicar | Simple | El corazón sigue diciendo "Guardar" |

👉 **Recomendado: A**, con una función pura y su prueba.

### 13. Navegación: se pierde el lugar y la selección, y el botón Volver dice otra cosa

- **Dónde:**
  - `js/app.js:80`: `window.scrollTo(0, 0)` en cada cambio de pantalla;
  - `js/vista-favoritos.js:80`: `seleccion = {}` cada vez que se entra a "Nuevo outfit";
  - `index.html:181`: el botón Volver dice siempre "Armario";
  - `index.html:166` y `:288`: enlaces a `#agregar` desde "Tu outfit" y desde "Nuevo outfit".
- **Qué falla:**
  - Al volver del detalle de una prenda, el armario vuelve al principio. En iOS se mantiene el lugar.
  - Si desde "Nuevo outfit" va a "+ Agregar prendas" y vuelve, pierde lo que había elegido.
  - En ese caso el botón dice "‹ Armario" pero la lleva a "Nuevo outfit".

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Guardar la posición de scroll de cada pestaña y no borrar la selección al volver de `#agregar` | Se siente como una app nativa | Hay que llevar un poco de estado |
| **B** | Que el texto de Volver muestre de dónde viene (como ya hace `volver-outfit-texto`) | Barato | No arregla lo del scroll |

👉 **Recomendado: A + B.**

### 14. Rendimiento visual: animaciones que nunca paran, sombras y fotos grandes en la cuadrícula

- **Dónde:**
  - `css/styles.css:959-963`: las alas de las mariposas del botón aletean cada 0,6 s dentro de un SVG con dos `drop-shadow` (`:901`).
  - `css/styles.css:264-270` y `:302-309`: mariposas del encabezado con `drop-shadow` y animación infinita, visibles también en Armario y Favoritos.
  - `css/styles.css:208` y `:916`: brillos que recorren el texto moviendo `background-position`.
  - `js/vista-armario.js:40-45`: cada tarjeta carga la foto completa de 800 px, sin miniatura y sin `loading="lazy"`.
- **Qué falla:** animar partes de un SVG con filtros obliga a redibujarlo en cada cuadro, lo que gasta batería y puede trabar en un Android de gama media. Con 100 a 200 prendas, la cuadrícula decodifica cientos de fotos de 800 px y usa mucha memoria. Falta confirmarlo en un celular.
- **Lo que está bien:** "reducir movimiento" sí se respeta (`css/styles.css:1606-1614`, `js/app.js:104` y `:125`).

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Pausar las animaciones de lo que no se ve y quitar `drop-shadow` de los elementos animados (dejar la sombra dibujada dentro del SVG) | Menos batería | Hay que revisar que se vea igual |
| **B** | Guardar una miniatura de unos 300 px al agregar la prenda, usarla en la cuadrícula y en los collages, y agregar `loading="lazy"` | Gran ahorro de memoria | Las prendas ya guardadas necesitan una migración (crear sus miniaturas una vez) |

👉 **Recomendado: B primero**, porque el problema crece con el armario, **y A después de probar en el iPhone.**

### 15. Las fotos se achican en un solo paso y sin calidad alta

- **Dónde:** `js/fotos.js:8-18`.
- **Qué falla:**
  - Se dibuja directo de, por ejemplo, 4032 px a 800 px sin `imageSmoothingQuality = 'high'`. Las telas con rayas o texturas pueden verse serruchadas.
  - La foto completa se decodifica en memoria antes de achicarla. Con fotos de 24 a 48 MP, Safari puede fallar.

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | `contexto.imageSmoothingQuality = 'high'` y achicar en dos pasos (a la mitad y después a 800) | Mejor calidad con pocas líneas | Un poco más lento |
| **B** | `createImageBitmap(archivo, { resizeWidth, resizeQuality: 'high' })` cuando exista, con el código actual como respaldo | Achica al leer la foto y usa menos memoria | El soporte varía; hay que probarlo en Safari |

👉 **Recomendado: A ahora y probar B en el iPhone** (casilla pendiente en `PLAN.md:253`).

### 16. Con el celular en horizontal, el contenido queda bajo la Dynamic Island

- **Dónde:** `css/styles.css` no usa `env(safe-area-inset-left/right)`. Los bordes laterales son fijos: `.contenido` usa 16 px (`:344`) y `.barra-nav` 8 px (`:472`).
- **Escenario:** Alina gira el iPhone y "‹ Volver" queda debajo de la isla o del borde curvo.

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | `padding-inline: max(16px, env(safe-area-inset-left))`, y lo mismo a la derecha | Correcto | Hay que ajustar los márgenes negativos de `.filtros` y `.selector-prendas` |
| **B** | Fijar la orientación vertical en el manifest | Simple | iOS no siempre lo respeta |

👉 **Recomendado: A.**

### 17. Con internet muy lento, la app tarda mucho en abrir

- **Dónde:** `sw.js:26-35`. Siempre pide primero a la red y solo usa la copia guardada si la red falla del todo.
- **Escenario:** en un probador con poca señal, la app queda en blanco varios segundos esperando a GitHub.

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Darle a la red un tiempo límite (unos 3 s) y, si no responde, usar la copia guardada | Rápido con mala señal | Puede mostrar la versión anterior, aunque la recarga automática lo corrige después |
| **B** | Dejarlo así | Nunca se mezclan versiones | La espera con mala señal |

👉 **Recomendado: A**, cuidando de usar la copia completa de una misma versión.

### 18. El diseño y la documentación no coinciden con las reglas

- **Puntitos de glitter:** `css/styles.css:94-106` dibuja un "cielo de puntitos brillantes" sobre todo el fondo, pero CLAUDE.md y `PLAN.md:126` dicen "sin puntitos de glitter".
- **Saludo:** CLAUDE.md y `PLAN.md:99` dicen que Inicio muestra un saludo según la hora. El código esconde el título y lo deja solo para lectores de pantalla (`js/app.js:8`, `css/styles.css:232-245`).
- **"persist":** `PLAN.md:252` lo marca como hecho y `:274` lo deja sin marcar.
- **Colores viejos:** `PLAN.md:75` todavía habla de "cromo plateado".
- **Galería:** `PLAN.md:192` dice que se puede elegir de la galería (ver el punto 6).

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Quitar `body::before` (o preguntarle a Alina) y actualizar la documentación al estado real | Así nadie "arregla" algo que ya se decidió | Ninguno relevante |
| **B** | Implementar el saludo | Cumple lo que dicen los documentos | Contradice el commit `19a0369`, que lo quitó a propósito |

👉 **Recomendado: A**, confirmando con Alina lo de los puntitos.

### 19. Publicación: una publicación puede cortarse a la mitad

- **Dónde:** `.github/workflows/ci-cd.yml:13-15` (`cancel-in-progress: true`, que también afecta al trabajo `deploy`).
- **Qué falla:** si hay dos pushes seguidos, el segundo puede cancelar la publicación del primero a medio camino. GitHub recomienda no cancelar publicaciones a Pages que ya empezaron.
- **Lo que está bien:**
  - "Preparar sitio" copia todo lo público que existe hoy.
  - No hay rutas absolutas.
  - `version.json` y la etiqueta `version` se generan y se verifican.
  - No hay secretos ni riesgo de XSS: el único `innerHTML` usa textos fijos (`js/vista-outfit.js:34` y `:54`).

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Grupo de concurrencia aparte para `deploy` con `cancel-in-progress: false` | Es lo que recomienda GitHub | Una publicación puede esperar a la anterior |
| **B** | Dejarlo así | Menos cambios | De vez en cuando puede fallar una publicación, aunque el siguiente push la corrige |

👉 **Recomendado: A.** Cuando existan, agregar `manifest.json` y las fuentes al paso "Preparar sitio".

### 20. Pendientes del plan que conviene hacer antes de entregarla

Sin marcar en `PLAN.md`:

- probar a 390, 402 y 440 px y en el iPhone de Alina (`:243`, `:245`, `:253`, `:277`);
- la fase 4 completa, del fondo blanco (`:256-258`). Hoy el color se detecta del centro de una foto con cualquier fondo, así que puede salir el color de la cama;
- instalación, pantalla de bienvenida y accesibilidad (`:272-276`);
- probar con el armario real (`:268`), que es donde aparecerán los problemas de los puntos 4 y 5;
- la revisión final y la prueba completa (`:281-283`).

Fuera del plan:

- faltan pruebas para la lógica de versiones de `js/app.js:31-41`; conviene pasarla a un módulo puro;
- la copia de seguridad del punto 1 debería pasar de "Ideas para después" a una fase antes del lanzamiento.

---

## Resumen

| # | Hallazgo | Gravedad | Recomendado |
|---|---|---|---|
| 1 | Sin copia de seguridad | 🔴 Alta | A + B (luego C) |
| 2 | No se instala como app | 🔴 Alta | B |
| 3 | Un error de la base de datos parece "armario vacío" | 🔴 Alta | A + B |
| 4 | Motor de outfits lento | 🔴 Alta | A |
| 5 | Los conjuntos ganan siempre o se bloquean | 🔴 Alta | B |
| 6 | No se puede elegir de la galería | 🟡 Media | B |
| 7 | La actualización recarga a mitad de algo | 🟡 Media | A |
| 8 | VoiceOver lee todo tres veces | 🟡 Media | B + `inert` |
| 9 | Letras de Google sin conexión | 🟡 Media | A |
| 10 | Doble toque guarda dos veces | 🟡 Media | A |
| 11 | Título pisado en pantallas angostas | 🟡 Media | A |
| 12 | Favoritos repetidos | 🟢 Baja | A |
| 13 | Se pierde el scroll y la selección | 🟢 Baja | A + B |
| 14 | Animaciones y fotos pesadas | 🟢 Baja | B, luego A |
| 15 | Fotos achicadas con poca calidad | 🟢 Baja | A, luego probar B |
| 16 | Dynamic Island en horizontal | 🟢 Baja | A |
| 17 | Lenta con mala señal | 🟢 Baja | A |
| 18 | Documentación desactualizada | 🟢 Baja | A |
| 19 | Publicación cortada a la mitad | 🟢 Baja | A |
| 20 | Pendientes del plan | 🟢 Baja | — |

---

## Seguimiento

- **8 de octubre de 2026 (Fase 6):**
  - ✅ **Punto 3** resuelto con A + B: mensaje de error con "Reintentar" en Armario, Favoritos y "Tu outfit", y la conexión con la base de datos se reabre sola si Safari la cierra.
  - ✅ **Punto 8** resuelto: el texto de cromo se lee una sola vez (`content: … / ''` y `aria-label` en botones y títulos) y la barra escondida queda `inert`.
  - 🟡 **Punto 5** en parte: sin candados, la app ya no pide quitar candados; explica que el problema son los conjuntos. Falta el bono de los conjuntos y la regla de los dos extras.
  - ✅ `persist()` ahora también se pide al abrir la app y se revisa si ya está concedido (punto 1, parte de "Lo que está bien").
- **8 de octubre de 2026:**
  - 🟡 **Punto 2** en parte (opción A): `manifest.json` con `start_url` y `scope` en `./`, etiquetas `apple-mobile-web-app-*` con barra de estado `black-translucent`, íconos de 192, 512 y maskable, y el workflow lo publica. Falta probarlo en el iPhone. La pantalla de bienvenida (opción B) se descartó por decisión del dueño.

---

# Revisión de lanzamiento (Fase 7)

- **Fecha:** 8 de octubre de 2026
- **Commit revisado:** `e80b07e` (rama `main`, lo publicado)
- **Hecha por:** el agente `auditor`, que solo leyó el código y no modificó archivos

## Veredicto: ✅ Se puede entregar, con condiciones

No hay nada en el código que impida entregarla: no hay fallas de seguridad, nada que borre datos y ningún error que rompa la app. Los cambios de la Fase 6 y de la instalación funcionan:

- la reconexión de la base de datos no puede quedar en bucle;
- `inert` funciona en iOS 17;
- el texto de cromo tiene respaldo para navegadores viejos;
- el manifest es válido bajo `/Alimichu/`.

**Condiciones antes de dársela a Alina:**

1. Hacer la prueba completa en un iPhone real (lista al final).
2. Arreglar los conjuntos (A1): hoy un conjunto sale el 100 % de las veces.
3. Decidir si se entrega sin el fondo blanco (A3).

**Conviene arreglar antes, porque son rápidos:** M5 (doble guardado), M4 (galería) y M1 (hora sobre las fotos).

**Riesgo aceptado por decisión del dueño:** no habrá pantalla de bienvenida ni copia de seguridad. Si Alina carga ropa en Safari antes de instalar la app, borra la app o cambia de iPhone, pierde lo que tenía.

**Validaciones:** `npm run check` pasa con 42 pruebas, las 3 últimas publicaciones terminaron bien y `manifest.json`, `version.json` y las etiquetas `apple-mobile-web-app-*` están en línea.

## 🔴 Gravedad alta

### A1. Un conjunto sale siempre (punto 5, parte que falta)

- **Dónde:** `js/outfits.js:76-80` suma +1,5 por cada prenda del conjunto, y `:172` solo sortea entre los outfits que están a 1,5 puntos del mejor.
- **Qué pasa:** con 43 prendas y un conjunto de dos piezas, el conjunto salió 100 de 100 veces. Un conjunto de dos extras (chaqueta y cartera) nunca puede salir completo.

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Bono fijo pequeño (+0,5 por conjunto completo, no por prenda) | Una línea | No resuelve los conjuntos de dos extras |
| **B** | Lo de A, y además que la regla de conjuntos pida solo las piezas que caben | Arregla los dos problemas | Más pruebas |
| **C** | Sacar el bono y solo garantizar que el conjunto salga completo cuando sale | Lo más simple | El conjunto podría salir muy poco |

👉 **Recomendado: B**, o A si no hay tiempo.

### A2. El motor de outfits se pone lento con un armario grande (punto 4)

- **Dónde:** `js/outfits.js:117-148` y `:155`.
- **Medido en el PC:** con 43 prendas tarda 0,11 s, con 83 tarda 0,66 s y con 107 tarda 1,75 s. En el iPhone puede ser más lento.

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Sortear unas 2.000 combinaciones al azar | Tiempo fijo y bajo | Podría no encontrar la mejor absoluta |
| **B** | Elegir por partes | Muy rápido | Hay que reescribir el puntaje y las pruebas |
| **C** | Web Worker | La pantalla no se congela | Igual tarda y agrega complejidad |

👉 **Recomendado: A**, antes de que el armario pase de unas 60 prendas.

### A3. Todavía no está la foto con fondo blanco (pedido 4 de Alina)

- **Dónde:** la fase 4 está sin hacer (`PLAN.md:256-258`). `js/fotos.js` solo achica la foto y el color se detecta con el fondo incluido.

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Entregar la 1.0 así y pedirle que fotografíe sobre un fondo liso y claro | Se entrega ya | No cumple el pedido 4 |
| **B** | "Plan B" de `PLAN.md:187`: aclarar el fondo hasta dejarlo blanco | Más liviano | Falla con fondos con dibujos |
| **C** | Hacer la fase 4 completa, con un modelo que quita el fondo | Cumple el pedido | Es lo más difícil; hay que probarlo en el iPhone |

👉 **Recomendado: A ahora y C como versión 1.1.** La decisión es del dueño.

## 🟡 Gravedad media

### M1. (Nuevo) En la app instalada, las fotos pasan detrás de la hora y la batería al bajar

- **Dónde:** `index.html:20` (barra de estado `black-translucent`), `css/styles.css:79` y `.encabezado` (`:227-232`), que no se queda arriba. En las vistas no pasa, porque `.barra-nav` tapa esa zona.

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Franja fija del alto de `env(safe-area-inset-top)`, con degradado negro o vidrio | Pocas líneas | Hay que probarlo en el iPhone |
| **B** | Encabezado fijo con vidrio, como el título grande de iOS | Muy "Apple" | Más trabajo |
| **C** | Barra de estado `black` (opaca) | Una palabra | Se pierde la pantalla completa |

👉 **Recomendado: A.**

### M2. (Nuevo, hay que confirmarlo en el iPhone) "Reintentar" podría no recuperar nada y no muestra que lo intentó

- **Dónde:** `js/vista-armario.js:184`, `js/vista-favoritos.js:156` y `js/vista-outfit.js:79` y `:148` vuelven a llamar al mismo código sin ningún cambio visible.

| | Solución | A favor | En contra |
|---|---|---|---|
| **A** | Si el reintento también falla, recargar la página | Recargar siempre arregla la conexión | La app parpadea al recargar |
| **B** | "Abriendo…" en el botón y un aviso si vuelve a fallar | Alina ve que la app hizo algo | Solo, no arregla el caso de fondo |
| **C** | Recargar sola una vez apenas falle | Ni siquiera tiene que tocar el botón | Es una recarga sorpresa |

👉 **Recomendado: A + B.**

### M3. La actualización automática puede recargar la app a mitad de algo (punto 7)

- **Dónde:** `js/app.js:32-47`.
- **Opciones:**
  - **A)** no recargar si está en una vista;
  - **B)** revisar la versión solo al abrir la app;
  - **C)** mostrar un aviso "Toca para actualizar".

👉 **Recomendado: A.**

### M4. No se puede elegir una foto de la galería (punto 6)

- **Dónde:** `index.html:204` (`capture="environment"`).
- **Opciones:**
  - **A)** quitar `capture`, que es una línea;
  - **B)** dos botones, "Tomar foto" y "Elegir de mis fotos".

👉 **Recomendado: B**, o A si se quiere algo inmediato.

### M5. Tocar dos veces "Guardar prenda" la guarda dos veces (punto 10)

- **Dónde:** `js/vista-armario.js:135` espera la foto antes de desactivar el botón en `:151`.
- **Opciones:**
  - **A)** desactivar el botón al principio, con el texto "Guardando…";
  - **B)** una variable `guardando` que ignore el segundo toque.

👉 **Recomendado: A.**

### M6. Las letras dependen de Google (punto 9)

- **Dónde:** `index.html:23` y `sw.js:22`.
- **Opciones:**
  - **A)** guardar los `.woff2` en `assets/fonts/`;
  - **B)** que el service worker guarde las letras de Google.

👉 **Recomendado: A.**

### M7. El título de la barra superior choca con "‹ Armario" a 390 px (punto 11)

- **Dónde:** `css/styles.css:491-496` y `:499-515`. Pasa en el ancho del iPhone de Alina.
- **Opciones:**
  - **A)** título con `clamp(1rem, 4.6vw, 1.2rem)` y menos espacio en el botón Volver;
  - **B)** dejar solo la flecha "‹".

👉 **Recomendado: A.**

## 🟢 Gravedad baja

| # | Hallazgo | Opciones | Recomendado |
|---|---|---|---|
| B1 | Un outfit puede quedar varias veces en Favoritos (punto 12) | A) marcar el corazón si ya está guardado · B) solo evitar duplicar al guardar | A |
| B2 | Se pierde el lugar y la selección, y Volver dice otra cosa (punto 13) | A) recordar el scroll y la selección · B) que Volver diga de dónde viene | A + B |
| B3 | Fotos y animaciones pesadas (punto 14) | A) miniaturas de 300 px y `loading="lazy"` · B) pausar animaciones y quitar `drop-shadow` | A primero |
| B4 | Fotos achicadas en un paso y sin calidad alta (punto 15) | A) `imageSmoothingQuality = 'high'` y achicar en dos pasos · B) `createImageBitmap` con `resizeWidth` | A |
| B5 | En horizontal, la Dynamic Island tapa contenido; `"orientation"` no sirve en iOS (punto 16) | A) `env(safe-area-inset-left/right)` · B) aceptarlo | A, sin apuro |
| B6 | Con mala señal tarda en abrir (punto 17) | A) tiempo límite de 3 s en `sw.js` · B) dejarlo así | A |
| B7 | Una publicación puede cortarse a la mitad (punto 19) | A) grupo de concurrencia aparte con `cancel-in-progress: false` · B) dejarlo así | A |
| B8 | (Nuevo) "Nuevo outfit" no tiene botón Reintentar (`js/vista-favoritos.js:89-104`) | A) el mismo bloque de error con Reintentar · B) texto "Vuelve atrás y entra de nuevo" | A |
| B9 | (Nuevo) Con lector de pantalla, muchas prendas se leen igual porque falta el color | A) nombre aproximado del color en `colores.js` · B) número de la prenda | A, sin apuro |
| B10 | La documentación no coincide con el código (punto 18) | A) actualizar PLAN.md y decidir sobre los puntitos del fondo · B) solo una nota de "Decisiones" | A |
| B11 | Faltan pruebas para la comparación de versiones y para la reconexión | A) pasar la comparación de versiones a un módulo puro con prueba · B) probar la reconexión con una base falsa | A |

## Estado de los puntos de la primera auditoría

| # | Hallazgo | Estado |
|---|---|---|
| 1 | Sin copia de seguridad | ⛔ Descartado por decisión del dueño (riesgo aceptado) |
| 2 | No se instala como app | 🟡 En parte: ya es instalable (A); la pantalla de bienvenida se descartó; falta probarlo en el iPhone |
| 3 | Un error de la base de datos parecía "armario vacío" | ✅ Resuelto (queda M2 por confirmar en el iPhone) |
| 4 | Motor lento | Abierto (A2) |
| 5 | Conjuntos | 🟡 En parte (A1) |
| 6 | Galería | Abierto (M4) |
| 7 | Recarga a mitad de algo | Abierto (M3) |
| 8 | VoiceOver lee todo tres veces | ✅ Resuelto |
| 9 | Letras de Google | Abierto (M6) |
| 10 | Doble guardado | Abierto (M5) |
| 11 | Título pisado | Abierto (M7) |
| 12 | Favoritos repetidos | Abierto (B1) |
| 13 | Scroll y selección | Abierto (B2) |
| 14 | Animaciones y fotos pesadas | Abierto (B3) |
| 15 | Calidad de las fotos | Abierto (B4) |
| 16 | Horizontal | Abierto (B5) |
| 17 | Mala señal | Abierto (B6) |
| 18 | Documentación | 🟡 En parte (B10) |
| 19 | Publicación cortada | Abierto (B7) |
| 20 | Pendientes del plan | 🟡 En parte: falta la fase 4 y las pruebas en el iPhone |

## Qué probar sí o sí en el iPhone real

1. **Instalación.** En Safari, toca Compartir → "Agregar a pantalla de inicio" estando en `#armario`. Revisa que:
   - el ícono sea la mariposa y el nombre sea "Alina";
   - abra sin la barra de Safari y en **Inicio**;
   - no haya un destello blanco al abrir.
2. **Dynamic Island y barra de inicio.** En Inicio, Armario bajado, Favoritos, Agregar, Tu outfit y Nuevo outfit, nada debe quedar bajo la hora o la isla (M1) ni chocar con la barra de inicio.
3. **Cámara en la app instalada.** Toma 5 fotos, incluida una de 48 MP si es un Pro. La app no debe cerrarse ni recargarse al volver de la cámara (M3).
4. **Datos.**
   - Cierra la app desde el selector de apps y vuelve a abrirla: todo debe seguir ahí.
   - Déjala en segundo plano un buen rato y vuelve: no debe aparecer "No pude abrir tu armario". Si aparece, Reintentar tiene que funcionar (M2).
5. **Sin conexión.** En modo avión, la app abre y las letras son Shrikhand (M6).
6. **Volver.** En la app instalada, el gesto de deslizar desde el borde puede no funcionar. Confirma que "‹ Volver" siempre funciona.
7. **Botón Alina.** Genera varios outfits con un conjunto marcado (A1) y mira cuánto tarda con el armario real (A2).
8. **Primera vez.** Alina instala la app **antes** de cargar su ropa.
