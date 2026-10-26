# Stop

Juego tradicional de **Stop** (Basta / Tutti Frutti) que funciona **100 % en el navegador**, sin servidor ni cuentas. Todo se guarda en `localStorage`.

---

## 1. Utilidades

- El anfitrión configura la partida y obtiene un **código de sala** muy corto que copia con un botón; los jugadores lo pegan o lo escriben en su celular.
- El anfitrión lleva la partida en la computadora: dicta la letra, mide el tiempo y registra las palabras con su puntuación.
- Cada jugador escribe sus palabras en su celular, con la hora con segundos y el botón **STOP** siempre visibles. El jugador **no ve la letra**: la dicta el anfitrión.
- Además de las categorías del catálogo, el anfitrión puede escribir **categorías propias**.
- Al final cada jugador copia su **resultado** (palabras, tiempos y puntos) y el anfitrión lo pega: la app revisa sola las palabras contra el registro, aplica la penalización por tiempo y confirma al ganador.
- Modo claro/oscuro, color de acento a gusto y accesibilidad completa.

---

## 2. Vistas

| Vista | Archivo | Quién la usa | Función |
|---|---|---|---|
| Inicio | `index.html` | Todos | Elegir rol (anfitrión o jugador) y abrir la guía "Cómo jugar", explicada de forma sencilla para ambos roles. |
| Configuración | `anfitrion.html` | Anfitrión (PC) | Elegir rondas, dificultad, letras, categorías y puntos. Muestra el código de sala. |
| Partida | `partida.html` | Anfitrión (PC) | Muestra la letra, el orden de las rondas y el cronómetro; registra las palabras de cada ronda con su puntuación. |
| Verificación de victoria | `verificacion.html` | Anfitrión (PC) | Recibe los resultados de los jugadores y los revisa automáticamente. Solo se llega desde la partida. |
| Jugador | `jugador.html` | Jugador (celular) | Pegar el código, escribir palabras, STOP, puntaje propio y copiar el resultado para el anfitrión. |

---

## 3. Código de sala

Es un código de **4 caracteres** en el caso normal. Crece solo si se cambian las categorías (unos 15 caracteres) o se añaden categorías propias (cada nombre suma unos 20 caracteres más). Se muestra en la tarjeta de configuración.

- **Copiar**: botón *Copiar código* o tocar el código.
- **Pegar**: botón *Pegar código* en la pantalla del jugador. Si el navegador no permite leer el portapapeles, el jugador puede mantener pulsado el campo y elegir *Pegar*.
- Lleva solo lo que necesita el jugador: número de rondas, categorías (con el nombre de las propias) y reglas de puntos.
- **No lleva las letras** ni un nombre de sala: las letras las guarda únicamente el anfitrión.
- Se actualiza solo cuando cambia la configuración.
- No distingue mayúsculas de minúsculas, ignora espacios y guiones, y evita caracteres confusables (no usa O, I, L ni U; si se escribe O o I/L se entienden como 0 y 1).
- Los 2 últimos caracteres detectan códigos mal escritos o incompletos.

---

## 4. Dificultad y categorías

| Nivel | Letras | Categorías |
|---|---|---|
| Inicial | Letras comunes | Nombre, animal, país, cosa, color. |
| Medio | Casi todas | Se suman fruta, profesión, ciudad, marca. |
| Difícil | Todas, incluidas las raras | Se suman personaje famoso y película. |
| Personalizada | Aleatoria de una lista o elegida letra por letra | El anfitrión elige del catálogo y puede añadir categorías propias. |

- Las letras se sortean sin repetir de la lista de la dificultad, o se eligen una a una. Cada ronda tiene su letra, en el orden elegido.
- **Categorías propias**: en el nivel Personalizada se escriben hasta 3, de hasta 20 caracteres. No se admiten nombres que ya existan. Aparecen como un campo más en la pantalla del jugador y como una tarjeta más en la partida.

---

## 5. Flujo de una partida

1. **Anfitrión**: en la configuración elige rondas, dificultad, letras, categorías y puntos. El código de sala aparece solo.
2. **Anfitrión**: pulsa *Ir a la partida* y comparte el código con los jugadores.
3. **Jugador**: pega el código, escribe su nombre y entra. Su pantalla muestra el número de ronda, pero no la letra.
4. **Anfitrión**: dicta la letra y pulsa *Iniciar ronda*; el cronómetro empieza a correr.
5. **Jugador**: pulsa *Iniciar ronda* en su celular (se guarda la hora de inicio) y escribe una palabra por categoría.
6. **STOP**: el jugador pulsa STOP, se bloquea la escritura y se guarda su hora final y su tiempo. El anfitrión pulsa *STOP oficial* y se guarda el tiempo oficial de la ronda.
7. **Registro**: el anfitrión copia las palabras de la ronda y les asigna su puntuación.
8. **Siguiente ronda** o, tras la última, el anfitrión pulsa *Verificar victoria*.
9. **Jugador**: pulsa *Ver puntos totales*, copia su resultado (o lo comparte) y se lo manda al anfitrión.
10. **Anfitrión**: pega cada resultado en la verificación; la app confirma al ganador.

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

## 7. Verificación de victoria automática

El anfitrión no escribe nada: cada jugador envía su resultado y la app lo revisa sola.

**Resultado del jugador**

- Al terminar, el jugador pulsa *Ver puntos totales* y copia su resultado con *Copiar resultado* (o *Compartir*, en los celulares que lo permiten) y se lo manda al anfitrión por el medio que quiera.
- Lleva el código de la sala, el nombre, los puntos que declara y, por ronda, su tiempo y sus palabras.
- Tiene un resumen de error: si llega incompleto o alterado, la app lo rechaza con un mensaje claro.

**Revisión automática**

1. El anfitrión pulsa *Pegar resultado* por cada jugador (si el navegador no deja leer el portapapeles, usa el recuadro de texto). Si un jugador vuelve a enviar su resultado, reemplaza el anterior.
2. Se rechazan los resultados de otra sala o que no coinciden con las rondas y categorías de la partida.
3. Cada palabra se **busca en el registro** de la partida (misma ronda y categoría, sin importar tildes ni mayúsculas). Si no está, vale 0 y se avisa.
4. Se calcula la penalización por tiempo con el tiempo del jugador.
5. Se revisa a los jugadores de mayor a menor puntaje declarado: **gana el primero cuyo puntaje coincide** con lo que suman sus palabras menos la penalización.
6. El resumen muestra a cada jugador con lo que declara, lo que suman sus palabras y si queda confirmado o por cuánto se pasa o se queda corto.

**Detalle y correcciones**

- *Ver detalle* abre las palabras, los valores y los tiempos de un jugador, con las mismas reglas.
- Si hace falta, se puede corregir una palabra o su valor a mano, y volver al valor del registro.
- Si un jugador no puede enviar su resultado, se puede anotar a mano su nombre y sus puntos.

**Penalización por tiempo**

El tiempo se mide como **duración desde que se inició la ronda**, no como hora del reloj. Por eso no importa que los relojes de los celulares estén desfasados.

- Tiempo oficial: lo que dura la ronda desde que el anfitrión la inicia hasta el *STOP oficial*.
- Tiempo del jugador: lo que tarda desde que pulsa *Iniciar ronda* hasta su STOP.
- Los segundos que el jugador pase del tiempo oficial más el margen de la sala restan puntos según la tasa de la sala. El puntaje de una ronda no baja de 0.
- El margen (por defecto 5 s) cubre la diferencia de reacción al iniciar la ronda.

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
- Diseño pensado primero para celular en la vista de jugador; en pantallas pequeñas la barra superior se compacta en una sola fila.

---

## 10. Estructura del proyecto

```
stop/
├── index.html
├── anfitrion.html
├── partida.html
├── verificacion.html
├── jugador.html
├── package.json         # Atajo: npm test
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
│   │   ├── categorias.js       # Catálogo, niveles y categorías propias
│   │   ├── puntuacion.js       # Puntos, registro y penalización por tiempo
│   │   ├── tiempo.js           # Hora con segundos, duraciones y cronómetro
│   │   ├── portapapeles.js     # Copiar y pegar
│   │   ├── resultado.js        # Resultado que el jugador envía al anfitrión
│   │   ├── dom.js              # Creación segura de elementos
│   │   └── iconos.js           # Iconos SVG inline
│   └── vistas/          # Interacción de cada pantalla
│       ├── inicio.js
│       ├── anfitrion.js
│       ├── partida.js
│       ├── verificacion.js
│       └── jugador.js
├── pruebas/             # Pruebas automáticas
│   ├── ejecutor.js             # Mini ejecutor (Node y navegador)
│   ├── ejecutar.js             # Entrada para Node
│   ├── index.html              # Corre la lógica en el navegador
│   ├── dom-falso.js            # DOM simulado para recorrer las pantallas
│   └── *.prueba.js             # Pruebas por módulo y del flujo completo
└── img/
    └── icono.svg
```

La lógica (`nucleo/`) está separada de lo visual (`vistas/`).

---

## 11. Pruebas automáticas

Cubren el código de sala, el resultado del jugador, las categorías (incluidas las propias), las letras, el tiempo, la puntuación y la penalización, y recorren las pantallas (configuración, jugador, partida y verificación automática) con un DOM simulado.

- **En Node** (versión 18 o superior, sin instalar nada): `node pruebas/ejecutar.js` o `npm test`. Termina con código de error si algo falla.
- **En el navegador**, incluido el celular: abre `pruebas/index.html` (desde un servidor local o publicado) y muestra cuántas pruebas pasan y cuáles fallan.

Conviene correrlas después de cada cambio en `js/nucleo/`.

---

## 12. Datos en localStorage

Todas las claves llevan el prefijo `stop:`. Se guardan: tema, acento, borrador y sala del anfitrión (con las letras), la partida (rondas, horas y palabras con su valor), la verificación (resultados recibidos) y la sesión del jugador (palabras, horas y puntaje).

---

## 13. Seguridad y robustez

- Todo texto del usuario se muestra como texto plano, nunca como HTML.
- El código de sala se valida (formato, resumen de error y valores permitidos) antes de usarse; los nombres de categorías propias se limpian y se limitan.
- Lecturas de `localStorage` protegidas contra datos corruptos o ausentes.
- Sin dependencias ni peticiones externas.
