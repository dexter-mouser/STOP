# Stop

Juego tradicional de **Stop** (Basta / Tutti Frutti) que funciona **100 % en el navegador**, sin servidor ni cuentas. Todo se guarda en `localStorage`.

---

## 1. Utilidades

- Un anfitrión crea una sala y obtiene un **código de sala** (con un identificador de 4 caracteres) que contiene toda la configuración; también se puede compartir como enlace.
- Los jugadores entran con ese código y solo escriben su nombre; no configuran nada.
- Cada jugador escribe sus palabras en su celular, con la hora con segundos y un botón **STOP** siempre visibles en la parte inferior.
- El anfitrión audita al jugador con más puntos reescribiendo y juzgando sus palabras.
- Modo claro/oscuro, color de acento configurable y accesibilidad completa.

---

## 2. Vistas

| Vista | Archivo | Quién la usa | Función |
|---|---|---|---|
| Inicio | `index.html` | Todos | Elegir rol: crear sala (anfitrión) o unirse (jugador). |
| Anfitrión | `anfitrion.html` | Anfitrión (PC) | Configurar la partida y generar el código de sala. |
| Jugador | `jugador.html` | Jugador (celular) | Ingresar código, escribir palabras, STOP y puntaje propio. |
| Verificación | `verificacion.html` | Anfitrión | Auditar al ganador y calcular el resultado final. |

---

## 3. Código de sala

Cadena corta y copiable (también compartible como enlace) que lleva codificada la configuración:

- Nombre de la sala.
- Dificultad y **secuencia de letras** (una por ronda).
- Categorías de la partida.
- Número de rondas.
- Puntos por palabra: única, repetida e inválida/vacía.
- Penalización por segundo fuera de ronda y gracia (5 s por ronda).

El código incluye una **verificación de integridad**: si está mal escrito o alterado, la app lo rechaza con un mensaje claro.

---

## 4. Dificultad y categorías

| Nivel | Letras | Categorías |
|---|---|---|
| Inicial | Letras comunes | Pocas y básicas (nombre, animal, país, cosa, color). |
| Medio | Casi todas | Se suman fruta, profesión, ciudad, marca. |
| Difícil | Todas, incluidas las raras | Se suman personaje famoso, película, elemento, accidente geográfico. |
| Personalizada | Aleatoria de una lista o elegida letra por letra | El anfitrión selecciona cada categoría del catálogo. |

En los niveles predefinidos la letra se sortea de una lista preseleccionada según la dificultad, sin repetir. En el modo personalizado se puede elegir manualmente cada letra.

---

## 5. Flujo de una partida

1. **Anfitrión**: configura la partida y comparte el código de sala.
2. **Jugador**: ingresa el código y su nombre. La vista muestra la letra de la ronda 1.
3. **Ronda**: el jugador pulsa *Iniciar ronda* (se guarda la hora de inicio con segundos) y escribe sus palabras por categoría.
4. **STOP**: al pulsarlo se **bloquea la escritura**, se guarda la hora final y aparecen dos botones: *Siguiente ronda* o *Ver puntos totales*.
5. **Coordinación**: tras cada ronda los jugadores comparan palabras y cada uno marca las suyas (única, repetida o inválida). El puntaje se acumula en su celular.
6. **Final**: se identifica al jugador con más puntos y pasa a la vista de verificación.

---

## 6. Verificación de victoria

El anfitrión audita al jugador con más puntos:

1. Se muestra una **mini pantalla por ronda y letra**.
2. En cada una, el anfitrión **reescribe las palabras** del jugador y las juzga (única, repetida, inválida).
3. Se compara la hora final del jugador con la hora oficial de cierre de la ronda; los segundos que excedan la **gracia de 5 s** restan puntos según la tasa de la sala.
4. Al terminar, se calcula el puntaje auditado y se confirma o corrige el ganador.
5. Si el puntaje auditado baja, se revisa al siguiente jugador en la tabla.

---

## 7. Temas y colores

- **Claro/oscuro** con variables CSS. Sigue la preferencia del sistema y se puede cambiar con un botón.
- **Acento**: 5 colores predefinidos y un selector libre. Se guarda en `localStorage`.
- El acento se aplica a botones principales, iconos activos y elementos destacados.
- **Contraste dinámico**: el texto sobre el acento se calcula según su luminosidad (claro u oscuro) para mantener la legibilidad.

---

## 8. Diseño y accesibilidad

- Icono de la app en `img/icono.svg`, usado también como icono de la pestaña.
- Resto de iconos e ilustraciones en **SVG inline** que heredan los colores del tema, todos con `aria-label`.
- Solo **fuentes del sistema**; sin librerías ni fuentes externas.
- Contraste suficiente en ambos modos.
- Soporte de áreas seguras (notch y barra inferior).
- Transiciones breves, desactivadas con `prefers-reduced-motion`.
- Diseño pensado primero para celular en la vista de jugador.

---

## 9. Estructura del proyecto

```
stop/
├── index.html
├── anfitrion.html
├── jugador.html
├── verificacion.html
├── README.md
├── css/
│   ├── style.css        # Estructura y componentes
│   └── tono.css         # Variables de tema, acento y contraste
├── js/
│   ├── tono.js          # Tema claro/oscuro, acento y contraste
│   ├── barra.js         # Barra superior y diálogo "Cómo jugar"
│   ├── nucleo/          # Lógica sin interfaz
│   │   ├── almacenamiento.js   # Lectura/escritura en localStorage
│   │   ├── codigo-sala.js      # Generar, validar y leer el código
│   │   ├── letras.js           # Listas por dificultad y sorteo
│   │   ├── categorias.js       # Catálogo y niveles
│   │   ├── puntuacion.js       # Puntos y penalización por tiempo
│   │   ├── tiempo.js           # Hora con segundos y reloj
│   │   ├── dom.js              # Creación segura de elementos
│   │   └── iconos.js           # Iconos SVG inline
│   └── vistas/          # Interacción de cada pantalla
│       ├── inicio.js
│       ├── anfitrion.js
│       ├── jugador.js
│       └── verificacion.js
└── img/
    └── icono.svg
```

La lógica (`nucleo/`) está separada de lo visual (`vistas/`).

---

## 10. Datos en localStorage

Todas las claves llevan el prefijo `stop:`. Se guardan: tema, acento, sala activa, nombre del jugador, rondas (palabras, hora de inicio y fin) y puntaje acumulado.

---

## 11. Seguridad y robustez

- Todo texto del usuario se muestra como texto plano, nunca como HTML.
- El código de sala se valida (formato, integridad y valores permitidos) antes de usarse.
- Lecturas de `localStorage` protegidas contra datos corruptos o ausentes.
- Sin dependencias ni peticiones externas.
