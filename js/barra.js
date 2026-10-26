/* barra.js · Barra superior (marca, acento, ayuda y tema) y diálogo "Cómo jugar" */
window.Stop = window.Stop || {};

Stop.barra = (function () {
  const { crear, vaciar } = Stop.dom;
  let dialogo = null;
  let mostrarGuia = null;
  let guiaInicial = 'anfitrion';

  // Explicaciones sencillas, pensadas para que las entienda un niño de 5 años
  const GUIAS = {
    anfitrion: {
      titulo: 'Soy anfitrión',
      pasos: [
        'Tú eres el jefe del juego. Eliges cuántas rondas hay y qué cosas hay que buscar: animales, colores, frutas...',
        'La computadora te da un código secreto. Díselo a tus amigos para que entren al juego.',
        'Dices una letra bien fuerte. ¡Todos piensan palabras que empiecen con esa letra!',
        'Aprietas el botón para empezar y el reloj empieza a correr.',
        'Cuando un amigo grita ¡STOP!, tú aprietas el botón STOP. Todos dejan de escribir.',
        'Cada amigo dice sus palabras y tú las anotas. Si nadie más dijo esa palabra, vale 100 puntos. Si otro amigo dijo la misma, vale 50. Si no sirve, vale 0.',
        'Al final, el amigo que dice que tiene más puntos te enseña sus palabras. Tú miras si dijo la verdad. ¡Y gana el que no hizo trampa!'
      ]
    },
    jugador: {
      titulo: 'Soy jugador',
      pasos: [
        'Tú juegas con tu celular. Pídele el código secreto al anfitrión y escríbelo con tu nombre.',
        'El anfitrión dice una letra en voz alta. ¡Escúchala bien! Tu celular no la dice: es un secreto.',
        'Aprieta Iniciar ronda. Escribe una palabra para cada cosa: un animal, un color... Todas tienen que empezar con la letra.',
        'Cuando termines, aprieta STOP y grita ¡STOP! ¡Tu celular se queda quieto!',
        'Dices tus palabras en voz alta y las enseñas en tu celular. El anfitrión las anota.',
        'Marca cada palabra: Única si nadie más la dijo, Repetida si otro amigo dijo la misma, Inválida si no sirve. Tu celular suma tus puntos.',
        'Si tienes más puntos que todos, el anfitrión revisa tus palabras. ¡Siempre di la verdad!'
      ]
    }
  };

  function crearDialogo() {
    const botones = {};
    const pestanas = crear('div', { clase: 'chips', role: 'group', 'aria-label': 'Elige tu papel' });
    const lista = crear('ol', {});
    mostrarGuia = (clave) => {
      Object.keys(GUIAS).forEach((otra) => botones[otra].setAttribute('aria-pressed', String(otra === clave)));
      vaciar(lista);
      GUIAS[clave].pasos.forEach((paso) => lista.append(crear('li', { texto: paso })));
    };
    Object.keys(GUIAS).forEach((clave) => {
      botones[clave] = crear('button', { clase: 'chip', type: 'button', texto: GUIAS[clave].titulo, enClick: () => mostrarGuia(clave) });
      pestanas.append(botones[clave]);
    });
    dialogo = crear('dialog', { 'aria-labelledby': 'titulo-ayuda' },
      crear('h2', { id: 'titulo-ayuda', clase: 'tarjeta__titulo', texto: 'Cómo jugar' }),
      pestanas, lista,
      crear('button', { clase: 'boton boton--primario boton--pequeno', type: 'button', texto: 'Entendido', enClick: () => dialogo.close() }));
    document.body.append(dialogo);
  }

  // clave: 'anfitrion' o 'jugador' (si no se indica, la de la página)
  function abrirAyuda(clave) {
    if (!dialogo) crearDialogo();
    mostrarGuia(GUIAS[clave] ? clave : guiaInicial);
    if (typeof dialogo.showModal === 'function') dialogo.showModal();
    else dialogo.setAttribute('open', '');
  }

  function crearAcentos() {
    const grupo = crear('div', { clase: 'acentos', role: 'group', 'aria-label': 'Color de acento' });
    function marcar() {
      const actual = Stop.tono.acentoActual();
      grupo.querySelectorAll('.punto-acento').forEach((boton) => {
        boton.setAttribute('aria-pressed', String(boton.dataset.color.toUpperCase() === actual));
      });
    }
    Stop.tono.ACENTOS.forEach((acento) => {
      grupo.append(crear('button', {
        clase: 'punto-acento', type: 'button', 'aria-label': 'Acento ' + acento.nombre,
        'data-color': acento.color, style: '--color: ' + acento.color,
        enClick: () => Stop.tono.aplicarAcento(acento.color)
      }));
    });
    // Selector libre de color
    const libre = crear('input', {
      type: 'color', 'aria-label': 'Elegir otro color de acento', value: Stop.tono.acentoActual(),
      enInput: (evento) => Stop.tono.aplicarAcento(evento.target.value)
    });
    grupo.append(crear('span', { clase: 'punto-libre' }, libre));
    document.addEventListener('acentocambiado', marcar);
    marcar();
    return grupo;
  }

  function crearBotonTema() {
    const boton = crear('button', { clase: 'boton-circular', type: 'button', enClick: () => Stop.tono.alternarTema() });
    function pintar() {
      const oscuro = Stop.tono.temaActual() === 'oscuro';
      const etiqueta = oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
      boton.setAttribute('aria-label', etiqueta);
      boton.replaceChildren(Stop.iconos.crear(oscuro ? 'sol' : 'luna', etiqueta));
    }
    document.addEventListener('temacambiado', pintar);
    pintar();
    return boton;
  }

  // Monta la barra dentro del contenedor #barra
  function montar(titulo, guia) {
    if (GUIAS[guia]) guiaInicial = guia;
    const ayuda = crear('button', { clase: 'boton-circular', type: 'button', 'aria-label': 'Ayuda: cómo jugar', enClick: () => abrirAyuda() });
    ayuda.append(Stop.iconos.crear('ayuda', 'Ayuda'));
    const marca = crear('a', { clase: 'barra__marca', href: 'index.html' }, Stop.iconos.crearLogo(), crear('span', { texto: titulo }));
    document.getElementById('barra').append(crear('header', { clase: 'barra' }, marca, crearAcentos(), ayuda, crearBotonTema()));
  }

  return { montar, abrirAyuda };
})();
