# Stop

Juego tradicional de **Stop** (Basta / Tutti Frutti) que funciona **100 % en el navegador**, sin servidor ni cuentas. Todo se guarda en `localStorage`.

---

## 1. Utilidades

- El anfitrión configura la partida y obtiene un **código de sala** muy corto que los jugadores escriben en su celular.
- El anfitrión lleva la partida en la computadora: dicta la letra, mide el tiempo y registra las palabras con su puntuación.
- Cada jugador escribe sus palabras en su celular, con la hora con segundos y el botón **STOP** siempre visibles. El jugador **no ve la letra**: la dicta el anfitrión.
- Al final se audita al jugador que declare más puntos, comparando sus palabras con el registro y descontando la penalización por tiempo.
- Modo claro/oscuro, color de acento a gusto y accesibilidad completa.

---

## 2. Vistas

| Vista | Archivo | Quién la usa | Función |
|---|---|---|---|
| Inicio | `index.html` | Todos | Elegir rol (anfitrión o jugador) y abrir la guía "Cómo jugar", explicada de forma sencilla para ambos roles. |
| Configuración | `anfitrion.html` | Anfitrión (PC) | Elegir rondas, dificultad, letras, categorías y puntos. Muestra el código de sala. |
| Partida | `partida.html` | Anfitrión (PC) | Muestra la letra, el orden de las rondas y el cronómetro; registra las palabras de cada ronda con su puntuación. |
| Verificación de victoria | `verificacion.html` | Anfitrión (PC) | Audita al jugador que declara más puntos. Solo se llega desde la partida. |
| Jugador | `jugador.html` | Jugador (celular) | Ingresar código, escribir palabras, STOP y puntaje propio. |

---

## 3. Código de sala

Es un código de **4 caracteres** en el caso normal y de hasta 15 cuando se cambian las categorías y las reglas. Se muestra en la tarjeta de configuración y se copia al tocarlo.

- Lleva solo lo que necesita el jugador: número de rondas, categorías y reglas de puntos.
- **No lleva las letras** ni un nombre de sala: las letras las guarda únicamente el anfitrión.
- Se actualiza solo cuando cambia la configuración.
- No distingue mayúsculas de minúsculas, ignora espacios y guiones, y evita caracteres confusables (no usa O, I, L ni U).
- Los 2 últimos caracteres detectan códigos mal escritos o incompletos.

---

## 4. Dificultad y categorías

| Nivel | Letras | Categorías |
|---|---|---|
| Inicial | Letras comunes | Nombre, animal, país, cosa, color. |
| Medio | Casi todas | Se suman fruta, profesión, ciudad, marca. |
| Difícil | Todas, incluidas las raras | Se suman personaje famoso y película. |
| Personalizada | Aleatoria de una lista o elegida letra por letra | El anfitrión selecciona cada categoría del catálogo. |

Las letras se sortean sin repetir de la lista de la dificultad, o se eligen una a una. Cada ronda tiene su letra, en el orden elegido.

---

## 5. Flujo de una partida

1. **Anfitrión**: en la configuración elige rondas, dificultad, letras, categorías y puntos. El código de sala aparece solo.
2. **Anfitrión**: pulsa *Ir a la partida* y comparte el código con los jugadores.
3. **Jugador**: escribe el código y su nombre. Su pantalla muestra el número de ronda, pero no la letra.
4. **Anfitrión**: dicta la letra y pulsa *Iniciar ronda*; el cronómetro empieza a correr.
5. **Jugador**: pulsa *Iniciar ronda* en su celular (se guarda la hora de inicio) y escribe una palabra por categoría.
6. **STOP**: el jugador pulsa STOP, se bloquea la escritura y se guarda su hora final. El anfitrión pulsa *STOP oficial* y se guarda la hora de cierre.
7. **Registro**: el anfitrión copia las palabras de la ronda y les asigna su puntuación.
8. **Siguiente ronda** o, tras la última, **verificación de victoria**.

---

## 6. Partida del anfitrión

Es la pantalla que dicta el ritmo. Siempre muestra:

- La **letra de la ronda** en grande y el estado de la ronda.
- El **orden de la partida**: todas las rondas con su letra, la actual resaltada y las terminadas marcadas.
- El **cronómetro** de la ronda, la hora con segundos y el botón de la acción principal.

| Fase | Qué hace el anfitrión |
|---|---|
| Lista | Dicta la letra y pulsa *Iniciar ronda*. |
| Ronda en marcha | Espera el STOP y pulsa *STOP oficial*. |
| Registro de palabras | Por cada categoría añade **todas las palabras que necesite** y asigna su puntuación. |
| Final | Ve la suma de la partida y los puntos por ronda, y pasa a verificar la victoria. |

**Registro de palabras**

- No hay lista de jugadores ni límite de palabras.
- Cada palabra queda guardada con su valor: única (por defecto 100), repetida (50) o inválida (0).
- La app sugiere el valor: repetida si la palabra se anotó más de una vez, inválida si no empieza con la letra de la ronda. El anfitrión puede cambiarlo a mano.
- Los puntos se suman por ronda y por partida.

---

## 7. Verificación de victoria

1. El anfitrión anota el nombre y los puntos que declara cada jugador. No hay límite de jugadores.
2. La app elige al que declara **más puntos** (se puede elegir a otro con *Auditar*).
3. El anfitrión escribe, ronda por ronda, las palabras que ese jugador dice y muestra.
4. Cada palabra se **busca en el registro** de la partida (misma ronda y categoría). Si no está, vale 0 y se avisa. Se puede corregir el valor a mano.
5. Se anota la hora final que marca el celular del jugador. Los segundos que pasen de la hora de cierre oficial más el margen restan puntos según la tasa de la sala.
6. La app compara lo declarado con lo que suman sus palabras menos la penalización: si coincide, la victoria se confirma; si no, indica la diferencia y permite auditar al siguiente jugador.

---

## 8. Temas y colores

- **Claro/oscuro** con variables CSS. Sigue la preferencia del sistema y se puede cambiar con un botón.
- **Acento**: 5 colores predefinidos y un selector libre. Se guarda en `localStorage`.
- El acento se aplica a botones principales, iconos activos y elementos destacados.
- **Contraste dinámico**: el texto sobre el acento se calcula según su luminosidad para mantener la legibilidad.

---

## 9. Diseño y accesibilidad

- Icono de la app en `img/icono.svg`, usado también como icono de la pestaña.
- Resto de iconos e ilustraciones en **SVG inline** que heredan los colores del tema, todos con `aria-label`.
- Solo **fuentes del sistema**; sin librerías ni fuentes externas.
- Contraste suficiente en ambos modos.
- Soporte de áreas seguras (notch y barra inferior).
- Transiciones breves, desactivadas con `prefers-reduced-motion`.
- Diseño pensado primero para celular en la vista de jugador.

---

## 10. Estructura del proyecto

```
stop/
├── index.html
├── anfitrion.html
├── partida.html
├── verificacion.html
├── jugador.html
├── README.md
├── css/
│   ├── style.css        # Estructura y componentes
│   └── tono.css         # Variables de tema, acento y contraste
├── js/
│   ├── tono.js          # Tema claro/oscuro, acento y contraste
│   ├── barra.js         # Barra superior y guía "Cómo jugar"
│   ├── nucleo/          # Lógica sin interfaz
│   │   ├── almacenamiento.js   # Lectura/escritura en localStorage
│   │   ├── codigo-sala.js      # Generar, validar y leer el código
│   │   ├── letras.js           # Listas por dificultad y sorteo
│   │   ├── categorias.js       # Catálogo y niveles
│   │   ├── puntuacion.js       # Puntos, registro y penalización por tiempo
│   │   ├── tiempo.js           # Hora con segundos y cronómetro
│   │   ├── dom.js              # Creación segura de elementos
│   │   └── iconos.js           # Iconos SVG inline
│   └── vistas/          # Interacción de cada pantalla
│       ├── inicio.js
│       ├── anfitrion.js
│       ├── partida.js
│       ├── verificacion.js
│       └── jugador.js
└── img/
    └── icono.svg
```

La lógica (`nucleo/`) está separada de lo visual (`vistas/`).

---

## 11. Datos en localStorage

Todas las claves llevan el prefijo `stop:`. Se guardan: tema, acento, borrador y sala del anfitrión (con las letras), la partida (rondas, horas y palabras con su valor), la verificación y la sesión del jugador (palabras, horas y puntaje).

---

## 12. Seguridad y robustez

- Todo texto del usuario se muestra como texto plano, nunca como HTML.
- El código de sala se valida (formato, resumen de error y valores permitidos) antes de usarse.
- Lecturas de `localStorage` protegidas contra datos corruptos o ausentes.
- Sin dependencias ni peticiones externas.
