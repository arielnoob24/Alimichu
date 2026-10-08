# Plan del proyecto Alimichu

> Documento vivo: se actualiza a medida que el proyecto avanza.
> Última actualización: 2026-10-06

## 1. Idea

Alimichu es un **armario digital para Alina**. Ella fotografía su ropa, la app guarda cada prenda con fondo blanco (como foto de producto para vender) y, al apretar un botón grande que dice **"Alina"**, la app le propone un outfit que combina bien.

- **Usuaria:** Alina, desde su **iPhone**.
- **Tipo:** **app web**. Se abre desde un link en Safari y se agrega a la pantalla de inicio para usarla como una app (ver "Instalación" más abajo).
- **Privacidad:** las fotos y los outfits se guardan solo en su iPhone y no se suben a ningún servidor.

### Regla principal: mobile first, pensada para iPhone

Todo se diseña y se programa **primero para el iPhone de Alina** y después se adapta a pantallas más grandes.

**Su iPhone.** Tiene entrada USB-C, así que es un iPhone 15 o más nuevo (15, 16, 16e, 17 o Air, en cualquier versión). No sabemos el modelo exacto, así que diseñamos para todo ese rango. Ella puede verlo en *Ajustes → General → Información → Nombre del modelo*.

| | Valor |
|---|---|
| Ancho de pantalla | de 390 a 440 puntos (CSS px) |
| Diseño base | **390 px**, el más angosto del rango |
| Navegador | Safari (WebKit). En iPhone, Chrome y los demás navegadores también usan WebKit |
| Sistema | iOS 17 o más nuevo |
| Parte de arriba | Dynamic Island, que tapa unos 59 px |
| Parte de abajo | Barra de inicio, unos 34 px |

**Reglas de diseño:**

- **CSS:** los estilos base son los del iPhone (390 px). Las pantallas más grandes se agregan con `@media (min-width: …)`, nunca al revés con `max-width`. La app ocupa siempre todo el ancho (sin franjas vacías a los lados, también en Android, plegables y tablets); en pantallas anchas el contenido se centra en una columna más ancha y Armario y Favoritos agregan columnas.
- **Bordes seguros:**
  - `viewport-fit=cover` en el `<meta viewport>`
  - `env(safe-area-inset-top)` para no quedar debajo de la Dynamic Island
  - `env(safe-area-inset-bottom)` para que el botón Alina y la barra de navegación no queden bajo la barra de inicio
- **Alto de pantalla:** `100dvh` en vez de `100vh`, porque en Safari la barra de direcciones cambia de tamaño.
- **Tamaño táctil:** botones y zonas táctiles de al menos 44 × 44 pt, como recomienda Apple. Lo importante va abajo, al alcance del pulgar.
- **Campos de texto:** letra de 16 px o más; si es menor, Safari hace zoom automático al tocar el campo.
- **Toques:**
  - nada depende del hover
  - se quita el resaltado gris al tocar (`-webkit-tap-highlight-color: transparent`)
  - `touch-action: manipulation` evita el retraso del doble toque
- **Rebote:** `overscroll-behavior: none` para que la app no "rebote" como página web.
- **Vibración:** Safari no permite hacer vibrar el iPhone desde una web, así que la respuesta al apretar botones es solo visual (animación y brillos).
- **Prefijos `-webkit-`:** se usan donde Safari los necesita, como en el texto con degradado del nombre (`-webkit-background-clip: text`).

### Instalación en el iPhone (PWA)

- iPhone no muestra un aviso de "instalar app". Alina tiene que abrir el link en Safari y usar *Compartir → Agregar a pantalla de inicio*. La app le muestra una pantalla de bienvenida que le explica cómo hacerlo.
- Para que se vea como app nativa:
  - `manifest.json` con `"display": "standalone"`
  - un ícono `apple-touch-icon` de 180 × 180 px
  - la barra de estado transparente sobre el fondo oscuro (`apple-mobile-web-app-status-bar-style: black-translucent`)
- **Importante para los datos:**
  - Safari puede borrar los datos de una página web si no se abre en 7 días. Esa regla no aplica a las apps agregadas a la pantalla de inicio, así que **Alina debe usarla instalada** para no perder su armario. Además pedimos `navigator.storage.persist()`.
  - La app instalada y Safari guardan los datos por separado. Lo que guarde en Safari no aparece en la app instalada, y viceversa.

### Cómo probamos (desarrollamos en Windows, sin Safari)

1. **En la computadora:** Chrome con DevTools en modo dispositivo y los tamaños de iPhone: 390 × 844, 402 × 874 y 440 × 956.
1. **En el Android de Ariel (pruebas del día a día):** es la misma app web, abierta desde el mismo link en Chrome, así que no hay una versión aparte. Sirve para probar:
   - diseño, navegación, el generador de outfits, favoritos y conjuntos
   - la cámara en general

   No reemplaza al iPhone en: la Dynamic Island, la instalación, el borrado de datos de iOS y la velocidad para quitar el fondo. Por eso la app solo usa funciones que existen tanto en Safari como en Chrome.
2. **En el iPhone real:**
   - se abre la versión publicada en GitHub Pages
   - o, para probar antes de publicar, se usa Live Server con la IP de la computadora, estando en la misma red Wi-Fi
3. Todo lo de la cámara, las fotos y la instalación **se prueba sí o sí en el iPhone**, porque Chrome en Windows no se comporta igual que Safari.

### Lo que pidió Alina

| # | Pedido | Cómo lo resolvemos |
|---|---|---|
| 1 | Que tenga brillos y su nombre en brillos rosados | "Alina" en letras de cromo plateado con borde rosa, reflejos y mariposas que titilan (ver sección 3) |
| 2 | Que genere combinaciones de outfit que combinen bien, no aleatorias | Motor de combinación con reglas de color, estilo y tipo de prenda (ver sección 4) |
| 3 | Guardar prendas tomándoles fotos | Botón "Agregar prenda" que abre la cámara del iPhone |
| 4 | Que la foto se guarde con fondo blanco, como para vender | Quitar el fondo automáticamente y poner la prenda sobre blanco (ver sección 5) |
| 5 | Si le sale un outfit que le gusta, poder guardarlo | Botón "Guardar" (corazón) en cada outfit generado, más una sección de Favoritos |
| 6 | Opción de tener un conjunto | Marcar prendas que forman un conjunto (por ejemplo, top y falda del mismo set) para que siempre salgan juntas ✅ confirmado |
| 7 | Un botón grande que diga "Alina", al centro, arriba o abajo | Píldora de cromo con mariposas, centrada al entrar y con una invitación debajo ("Aprieta Alina para que se genere tu combinación"). Al apretarla lleva a la vista "Tu outfit" ✅ |
| 8 | Poder armar sus propias combinaciones | En Favoritos, "Crear combinación": elige una prenda de cada parte entre las de su armario |
| 9 | Que el texto no se pueda seleccionar ni copiar | Toda la app tiene la selección de texto desactivada, como una app nativa; los campos para escribir funcionan normal ✅ |

## 2. Pantallas

La app funciona como una app de iPhone:
- **Pestañas:** hay tres, Armario · Inicio · Favoritos, en la barra de abajo. Cada una tiene:
  - arriba, un título de cromo con mariposas
  - Inicio: el botón Alina centrado; Armario y Favoritos: su contenido directo, con un botón de píldora flotante para agregar o crear
- **Vistas:** cada botón lleva a una vista de detalle.
  - entra desde la derecha
  - tiene una barra superior con **‹ Volver** y el título al centro
  - la barra de abajo se esconde
  - el gesto de volver del iPhone también funciona
- **Nombre "Alina":** aparece solo en el botón de Inicio, porque Alina pidió que no se repita.

1. **Inicio**
   - **Arriba:** un saludo según la hora ("Buenos días", "Buenas tardes" o "Buenas noches").
   - **Al centro:** el botón **Alina**, con la invitación "Aprieta Alina para que se genere tu combinación".
   - **Vista "Tu outfit":** se abre al apretar Alina, después de las mariposas.
     - el cuadro con las fotos de las prendas: arriba, abajo, zapatos y extra
     - **Otra combinación** para generar otro outfit
     - más adelante, un corazón para guardarlo en Favoritos
     - opcional: un candado en cada prenda para dejarla fija y que cambie solo el resto
2. **Armario** (título "Mi armario")
   - Se ven directamente los filtros por categoría y las prendas en cuadrícula. Si no hay prendas, aparece un mensaje con una mariposa.
   - **Vista "Agregar prenda"**, desde el botón flotante **Agregar prenda**:
     - tomar la foto y procesarla a fondo blanco
     - elegir la categoría, revisar el color detectado y elegir el estilo
     - opcional: agregarla a un conjunto
3. **Favoritos** (título "Favoritos")
   - Se ven directamente los outfits guardados, con opción de borrarlos.
   - **Vista "Nuevo outfit"**, desde el botón flotante **Crear combinación**: Alina elige una prenda de cada parte (arriba, abajo, zapatos y extra opcional) entre las de su armario, y la guarda en Favoritos.

## 3. Estilo visual

**Y2K de los 2000, tipo Bratz:** cromo líquido rosa y plata sobre negro. **Mariposas en vez de estrellas** en todo el diseño.

Referencias:
- [docs/referencia-letras.png](docs/referencia-letras.png): letras de cromo plateado con borde de cromo rosa y relieve
- [docs/referencia-estrellas.png](docs/referencia-estrellas.png): estilo de contorno de cromo rosa (en la app se usa con mariposas, no con estrellas)
- [docs/referencia-estilo.png](docs/referencia-estilo.png): la primera referencia

**Lo que va y lo que no:**
- **Sin puntitos de glitter.** El brillo viene de los reflejos del cromo; las mariposas van en rosado pastel, sin plateado (lo pidió Alina).
- **Colores:**
  - **rosado pastel en toda la app** (lo eligió Alina; nada de plateado ni rosa tan fuerte): degradados de `#fff2f8` a `#ffd9eb` y `#ffbedd`, bordes de blanco a `#ffaed4`
  - texto sobre pastel en vino (`#3d0421`); títulos sobre fondo oscuro en letras pastel con borde rosa `#d6408a`
  - mariposas del botón Alina en un rosa más intenso (`#ff5fae`) para que resalten
  - destellos blancos y un brillo que recorre "Alina" en el botón
  - fondo negro (`#050006`) con un resplandor rosa arriba
- **Tipografía:** Shrikhand, gruesa, inclinada y retro, para los textos de cromo (el botón "Alina", los botones de píldora y los títulos de las vistas). Rubik o la letra del sistema para el resto. La eligió la dueña; Pacifico no le gustó.
- **Texto de cromo** (clase `.cromo`): relleno plateado, borde rosa grueso con relieve oscuro, un filo claro y un reflejo de luz que lo recorre cada pocos segundos.
- **Decoración:**
  - grupos de mariposas Y2K de cromo rosa con contorno, que flotan en las esquinas del encabezado
  - mariposas pequeñas rosado pastel que titilan alrededor del nombre
- **Botones de píldora** (Alina, Agregar prenda, Crear combinación): fondo en degradado rosado pastel, sin metal, con brillo de vidrio arriba. El texto va en letras vino con borde blanco, para que se lea bien. Lo eligió Alina. El botón Alina tiene además dos mariposas rosado pastel posadas que aletean.
  - Al apretarlo, las mariposas salen volando y vuelven, y salen mariposas en dos tonos de rosado pastel hacia todos lados.
- **Marcos:** bordes finos de cromo rosa sobre fondo negro.
- **Mezcla con Apple (iOS 26):** la estructura y la forma de interactuar son de Apple; la decoración sigue siendo Y2K. Se sigue la skill `apple-design`, instalada en `.claude/skills/`.
  - **Barra de abajo:** cápsula de vidrio flotante con borde de cromo rosa y una burbuja que se desliza a la pestaña activa.
  - **Vistas de detalle:** entran desde la derecha y tienen una barra superior de vidrio con ‹ Volver. La barra de abajo se esconde. Volver usa el historial, así que funciona el gesto del iPhone.
  - **Respuesta inmediata al tocar:** los botones se achican apenas se tocan y no se selecciona su texto al mantenerlos presionados.
  - **Bajo la barra:** el contenido se desvanece en lugar de cortarse.
  - **Movimiento:** resorte sin rebote para todo lo que no viene de un gesto con impulso.
- **Tarjetas de prenda con foto:** fondo blanco, como foto de producto.
- **Animaciones suaves:** se respeta la opción "reducir movimiento" del iPhone.

## 4. Cómo se generan outfits que combinen

La idea es **no elegir al azar**. Cada prenda guarda estos datos:

| Dato | Valores | Cómo se obtiene |
|---|---|---|
| Categoría | parte de arriba, parte de abajo, vestido/enterito, zapatos, abrigo, accesorio | Lo elige Alina |
| Color principal | color en HSL | Se detecta de la foto y ella puede corregirlo |
| Estilo | casual, elegante, deportivo, fiesta | Lo elige Alina (se puede marcar más de uno) |
| Conjunto | id del conjunto (opcional) | Lo elige Alina |

Al apretar **Alina**:

1. **Estructura:** se arma con *arriba + abajo + zapatos* o con *vestido + zapatos*. El abrigo y los accesorios son opcionales.
2. **Conjuntos:** si sale una prenda que es parte de un conjunto, entran también las demás prendas del set.
3. **Puntaje de cada combinación posible:**
   - **Colores:**
     - los neutros (blanco, negro, gris, beige, mezclilla) combinan con todo
     - suman puntos los colores análogos (cercanos en la rueda) y los complementarios
     - restan puntos más de dos colores fuertes a la vez
   - **Estilo:** suman puntos las prendas del mismo estilo y restan los estilos que chocan (por ejemplo, deportivo con fiesta).
   - **Variedad:** baja el puntaje de los outfits que salieron hace poco, para no repetir.
4. **Elección:** se escoge al azar entre las combinaciones con mejor puntaje. Así cada vez sale algo distinto, pero siempre algo que combina.

Toda esta lógica va en módulos de JavaScript sin DOM (`js/outfits.js`, `js/colores.js`) y con tests, porque es el corazón de la app.

## 5. Fotos con fondo blanco

Es la parte técnicamente más difícil.

1. **Tomar la foto:** con `<input type="file" accept="image/*" capture="environment">`, que abre la cámara trasera del iPhone.
2. **Quitar el fondo:** con un modelo de inteligencia artificial que corre dentro del navegador y se carga desde un CDN, así que no necesita servidor ni build. Candidatos a probar:
   - [Transformers.js](https://huggingface.co/docs/transformers.js) con un modelo de segmentación de fondo (por ejemplo, RMBG-1.4)
   - la librería `@imgly/background-removal`

   La primera vez el modelo tarda en descargarse; después queda en caché.
3. **Componer:** la prenda recortada se centra sobre un lienzo blanco cuadrado con un margen y una sombra suave.
4. **Plan B:** si el modelo es muy pesado o falla, Alina toma la foto sobre una superficie lisa y la app aclara el fondo hasta dejarlo blanco. También se puede recortar a mano.
5. **Tamaño:** cada imagen se reduce a unos 800 px y se guarda comprimida (JPEG).

**Qué cambia en el iPhone:**

- **Cámara:** el `<input capture>` abre la cámara de iOS. También deja elegir una foto de la galería, que es útil para prendas que ya tenga fotografiadas.
- **Fotos enormes:** las cámaras de los iPhone Pro sacan fotos de hasta 48 MP, y Safari limita la memoria y el tamaño máximo de un `canvas`. Por eso la foto **se achica apenas se toma**, antes de quitar el fondo.
- **Quitar el fondo:**
  - en iOS 26 Safari tiene WebGPU, que hace que el modelo corra rápido
  - en versiones anteriores corre con WebAssembly, más lento pero funciona
  - la prueba técnica tiene que medir el tiempo **en su iPhone**
  - el modelo tiene que ser lo bastante liviano para que Safari no cierre la página por falta de memoria

**Antes de la fase 4 hacemos una prueba técnica** para elegir la opción según la calidad del recorte, el tiempo en el iPhone y la licencia del modelo.

## 6. Dónde se guardan los datos

- **IndexedDB** guarda las prendas, sus fotos, los conjuntos y los outfits favoritos. `localStorage` tiene muy poco espacio para fotos.
- Todo queda en el iPhone de Alina. Si borra la app o los datos de Safari, se pierde.
- Más adelante: exportar e importar una copia de seguridad (ver sección 9).

## 7. Tecnologías

| Parte | Tecnología |
|---|---|
| Estructura | HTML |
| Diseño | CSS (variables, animaciones) |
| Lógica | JavaScript (ES modules) |
| Fotos | Cámara con `<input capture>` y `canvas` |
| Quitar fondo | Modelo de IA en el navegador cargado desde CDN (por elegir) |
| Datos | IndexedDB |
| Instalable | PWA (manifest + service worker) |
| Hosting | GitHub Pages |
| Calidad | ESLint, html-validate, `node --test` en el CI |

## 8. Fases

### Fase 0: Configuración ✅
- [x] Repositorio en GitHub
- [x] Pipeline de CI/CD y publicación en GitHub Pages
- [x] Agentes `codificador` y `auditor`
- [x] Plan del proyecto

### Fase 1: Confirmar con Alina
- [x] "Conjunto" = prendas de un mismo set que salen juntas
- [x] Posición del botón Alina: centrado al entrar, abajo después del primer outfit
- [x] Forma del botón Alina: píldora de cromo con mariposas
- [x] Estética: Y2K / Bratz con cromo rosa y plata (ver sección 3)
- [x] Letra de los textos de cromo: Shrikhand (elegida entre Bagel Fat One y Shrikhand)
- [x] Categorías y estilos: por ahora, los de la sección 4

### Fase 2: Estructura y estilo
- [x] Maqueta HTML de las 4 pantallas y la barra de navegación
- [x] Paleta, tipografías y variables en `css/styles.css`
- [x] "Alina" en cromo rosa y plata con mariposas animadas
- [x] Botón Alina grande, centrado, con animación al apretar
- [ ] Todo mobile first según la sección 1; probado a 390, 402 y 440 px
- [x] `viewport-fit=cover`, bordes seguros y `100dvh`
- [ ] Probar en el iPhone de Alina por primera vez

### Fase 3: Armario (sin quitar fondo todavía)
- [x] Guardar y leer prendas en IndexedDB (`js/armario.js`)
- [x] Agregar prenda: foto, categoría, estilo y color
- [x] Detectar el color principal de la foto (`js/colores.js`, con tests)
- [x] Ver, filtrar y borrar prendas (detalle de cada prenda con "Eliminar")
- [x] La foto se achica a 800 px apenas se elige (`js/fotos.js`) y se pide almacenamiento persistente al guardar
- [ ] Probar en el iPhone: cámara, fotos de 48 MP y que el armario siga ahí al cerrar y abrir la app

### Fase 4: Fondo blanco
- [ ] Prueba técnica de los candidatos de la sección 5 y elección
- [ ] Integrar el recorte y la composición sobre blanco
- [ ] Mensaje de "procesando…" mientras trabaja

### Fase 5: Generador de outfits
- [x] Motor de combinación (`js/outfits.js`, con tests)
- [x] Conjuntos
- [x] Botón Alina conectado y animación de entrada del outfit
- [x] Guardar outfit en Favoritos
- [x] Crear combinación a mano: elegir una prenda de cada parte entre las del armario y guardarla en Favoritos
- [x] Candado para dejar fija una prenda
- [x] Lista de favoritos (collage de cada outfit, abrirlo en "Tu outfit" y quitarlo)
- [ ] Probar con el armario real de Alina y ajustar las reglas de combinación si algo no le convence

### Fase 6: Pulido
- [x] Ícono de la app: mariposa rosado pastel (`assets/icono.svg`, `icono-32.png` para la pestaña y `icono-180.png` para la pantalla de inicio del iPhone)
- [x] Instalable en la pantalla de inicio del iPhone (manifest y barra de estado): `manifest.json`, etiquetas `apple-mobile-web-app-*` e íconos de 192 y 512 px. Safari y la app instalada guardan los datos por separado, así que Alina tiene que instalarla **antes** de cargar su ropa
- [ ] Probar en el iPhone que se abre a pantalla completa y que nada queda bajo la Dynamic Island
- [ ] Pantalla de bienvenida que explique cómo agregarla a la pantalla de inicio
- [x] `navigator.storage.persist()` para que iOS no borre el armario: se pide al abrir la app y al guardar (`js/armario.js`)
- [x] Service worker (`sw.js`): siempre carga la versión más nueva sin mezclar archivos y guarda copias para usar sin conexión
- [x] Accesibilidad: contraste revisado (AA), textos alternativos que describen cada prenda y outfit, el texto de cromo se lee una sola vez, la barra escondida no se lee y se respeta "reducir movimiento"
- [ ] Probar en el iPhone de Alina
- [x] Mensajes para cuando el armario está vacío o no hay prendas suficientes, y un mensaje distinto con "Reintentar" si no se puede abrir la base de datos (que se reconecta sola)

### Fase 7: Lanzamiento
- [ ] Revisión completa con el agente `auditor`
- [ ] Prueba completa en un iPhone **antes de entregarla**: instalar, fotografiar 5 prendas, generar outfits, guardar favoritos, cerrar y volver a abrir. Si no hay un iPhone a mano, usar uno remoto, por ejemplo con BrowserStack.
- [ ] Publicar la versión 1.0 y mandarle el link a Alina 💖

## 9. Ideas para después

- Exportar e importar una copia de seguridad del armario
- Filtrar el outfit por ocasión o clima ("hoy hace frío", "voy a una fiesta")
- Calendario de qué se puso cada día
- Compartir un outfit como imagen

## 10. Cómo trabajamos

Todo cambio se publica: se trabaja directo en `main` y cada push actualiza GitHub Pages.

1. Implementar, a mano o con el agente `codificador`.
2. Validar en local con `npm run check`.
3. En los cambios grandes (fin de cada fase), revisar con el agente `auditor`.
4. Hacer commit y `git push` a `main`.
5. El CI vuelve a validar y **solo publica si todo pasa**. Si algo falla, sigue en línea la versión anterior y se corrige con otro commit.
6. Revisar el resultado en https://arielnoob24.github.io/Alimichu/ desde el celular.
