/* barra.js · Barra superior (marca, acento, ayuda y tema) y diálogo "Cómo jugar" */
window.Stop = window.Stop || {};

Stop.barra = (function () {
  const { crear } = Stop.dom;
  let dialogo = null;

  const PASOS = [
    'El anfitrión crea la sala, ajusta las reglas y comparte el código.',
    'Cada jugador entra con el código y su nombre.',
    'En cada ronda hay una letra: inicia, escribe una palabra por categoría y pulsa STOP.',
    'Entre todos coordinan las palabras y cada jugador marca las suyas: única, repetida o inválida.',
    'Al final, el anfitrión audita al jugador con más puntos en la verificación.'
  ];

  function crearDialogo() {
    const cerrar = crear('button', { clase: 'boton boton--primario boton--pequeno', type: 'button', texto: 'Entendido', enClick: () => dialogo.close() });
    dialogo = crear('dialog', { 'aria-labelledby': 'titulo-ayuda' },
      crear('h2', { id: 'titulo-ayuda', clase: 'tarjeta__titulo', texto: 'Cómo jugar' }),
      crear('ol', {}, PASOS.map((paso) => crear('li', { texto: paso }))),
      cerrar);
    document.body.append(dialogo);
  }

  function abrirAyuda() {
    if (!dialogo) crearDialogo();
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
      const boton = crear('button', {
        clase: 'punto-acento', type: 'button', 'aria-label': 'Acento ' + acento.nombre,
        'data-color': acento.color, style: '--color: ' + acento.color,
        enClick: () => Stop.tono.aplicarAcento(acento.color)
      });
      grupo.append(boton);
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
  function montar(titulo) {
    const ayuda = crear('button', { clase: 'boton-circular', type: 'button', 'aria-label': 'Ayuda: cómo jugar', enClick: abrirAyuda });
    ayuda.append(Stop.iconos.crear('ayuda', 'Ayuda'));
    const marca = crear('a', { clase: 'barra__marca', href: 'index.html' }, Stop.iconos.crearLogo(), crear('span', { texto: titulo }));
    document.getElementById('barra').append(crear('header', { clase: 'barra' }, marca, crearAcentos(), ayuda, crearBotonTema()));
  }

  return { montar, abrirAyuda };
})();
