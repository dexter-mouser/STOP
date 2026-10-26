/* jugador.js · Vista del jugador: ingreso, rondas, STOP, coordinación y puntos */
(function () {
  const { crear, vaciar } = Stop.dom;
  const almacen = Stop.almacenamiento;
  const $ = (id) => document.getElementById(id);
  const ETIQUETAS_MARCA = { unica: 'Única', repetida: 'Repetida', invalida: 'Inválida' };

  let sesion = almacen.leer('jugador'); // { codigo, nombre, config, ronda, fase, rondas: [...] }
  const guardar = () => almacen.guardar('jugador', sesion);

  // ---------- Pantallas ----------
  function mostrar(nombre) {
    $('pantalla-ingreso').hidden = nombre !== 'ingreso';
    $('pantalla-ronda').hidden = nombre !== 'ronda';
    $('pantalla-final').hidden = nombre !== 'final';
    $('barra-accion').hidden = nombre !== 'ronda';
    document.body.classList.toggle('con-barra-accion', nombre === 'ronda');
  }

  const rondaActual = () => sesion.rondas[sesion.ronda];
  const puntosDe = (ronda) => Stop.puntuacion.puntosRonda(sesion.config.categorias, ronda.respuestas, ronda.marcas, sesion.config.reglas);

  // ---------- Ingreso ----------
  function entrar(evento) {
    evento.preventDefault();
    const nombre = $('entrada-jugador').value.trim().slice(0, 20);
    const resultado = Stop.codigoSala.leer($('entrada-codigo').value);
    if (!resultado.ok) { $('mensaje-ingreso').textContent = resultado.error; return; }
    if (!nombre) { $('mensaje-ingreso').textContent = 'Escribe tu nombre.'; return; }
    sesion = {
      codigo: resultado.codigo, nombre,
      config: resultado.config, ronda: 0, fase: 'espera',
      rondas: Array.from({ length: resultado.config.rondas }, () => ({ respuestas: {}, marcas: {}, inicio: null, fin: null }))
    };
    guardar();
    pintarRonda();
  }

  // ---------- Ronda ----------
  function pintarRonda() {
    const ronda = rondaActual();
    $('ronda-sala').textContent = 'Sala ' + Stop.codigoSala.formatear(sesion.codigo) + ' · ' + sesion.nombre;
    $('ronda-numero').textContent = 'Ronda ' + (sesion.ronda + 1) + ' de ' + sesion.config.rondas;
    $('ronda-cifra').textContent = String(sesion.ronda + 1);
    $('ronda-insignia').setAttribute('aria-label', 'Ronda ' + (sesion.ronda + 1));
    $('hora-inicio').textContent = 'Inicio ' + Stop.tiempo.formatear(ronda.inicio);
    $('boton-iniciar').hidden = sesion.fase !== 'espera';
    $('boton-stop').disabled = sesion.fase !== 'jugando';
    pintarCampos();
    pintarCoordinacion();
    mostrar('ronda');
  }

  function pintarCampos() {
    const ronda = rondaActual();
    const contenedor = $('campos');
    vaciar(contenedor);
    contenedor.hidden = sesion.fase === 'coordinando';
    sesion.config.categorias.forEach((id) => {
      const entrada = crear('input', {
        id: 'campo-' + id, type: 'text', maxlength: '40', autocomplete: 'off', autocapitalize: 'words',
        value: ronda.respuestas[id] || '', disabled: sesion.fase !== 'jugando',
        enInput: (evento) => { ronda.respuestas[id] = evento.target.value; guardar(); }
      });
      contenedor.append(crear('label', { clase: 'campo' },
        crear('span', { clase: 'etiqueta', texto: Stop.categorias.nombrePorId(id) }), entrada));
    });
  }

  // ---------- Coordinación (después de STOP) ----------
  function pintarCoordinacion() {
    const zona = $('coordinacion');
    vaciar(zona);
    zona.hidden = sesion.fase !== 'coordinando';
    if (zona.hidden) return;
    const ronda = rondaActual();

    sesion.config.categorias.forEach((id) => {
      const palabra = (ronda.respuestas[id] || '').trim();
      const vacia = palabra === '';
      const marcas = crear('div', { clase: 'marcas', role: 'group', 'aria-label': 'Marcar ' + Stop.categorias.nombrePorId(id) });
      Stop.puntuacion.MARCAS.forEach((marca) => {
        marcas.append(crear('button', {
          clase: 'marca marca--' + marca, type: 'button', texto: ETIQUETAS_MARCA[marca], disabled: vacia,
          'aria-pressed': String((vacia ? 'invalida' : ronda.marcas[id]) === marca),
          enClick: () => { ronda.marcas[id] = marca; guardar(); pintarCoordinacion(); }
        }));
      });
      zona.append(crear('div', { clase: 'fila-palabra' },
        crear('span', { clase: 'etiqueta fila-palabra__nombre', texto: Stop.categorias.nombrePorId(id) }),
        crear('div', { clase: 'fila-palabra__palabra', texto: vacia ? '—' : palabra }),
        marcas,
        crear('span', { clase: 'puntos', texto: String(Stop.puntuacion.puntosPalabra(ronda.respuestas[id], ronda.marcas[id], sesion.config.reglas)) })));
    });

    zona.append(crear('div', { clase: 'total-ronda' },
      crear('span', { clase: 'etiqueta', texto: 'Puntos de la ronda' }),
      crear('strong', { texto: String(puntosDe(ronda)) })));

    const hayMas = sesion.ronda < sesion.rondas.length - 1;
    const acciones = crear('div', { clase: 'chips' });
    if (hayMas) acciones.append(crear('button', { clase: 'boton boton--primario', type: 'button', texto: 'Siguiente ronda', enClick: siguienteRonda }));
    acciones.append(crear('button', { clase: hayMas ? 'boton' : 'boton boton--primario', type: 'button', texto: 'Ver puntos totales', enClick: verTotales }));
    zona.append(acciones);
  }

  // ---------- Acciones ----------
  function iniciarRonda() {
    rondaActual().inicio = Date.now();
    sesion.fase = 'jugando';
    guardar();
    pintarRonda();
    const primero = document.querySelector('#campos input');
    if (primero) primero.focus();
  }

  function pulsarStop() {
    if (sesion.fase !== 'jugando') return;
    const ronda = rondaActual();
    ronda.fin = Date.now(); // hora final: se revisa en la verificación
    sesion.config.categorias.forEach((id) => {
      if (!(ronda.respuestas[id] || '').trim()) ronda.marcas[id] = 'invalida';
    });
    sesion.fase = 'coordinando';
    guardar();
    pintarRonda();
    window.scrollTo({ top: 0 });
  }

  function siguienteRonda() {
    sesion.ronda += 1;
    sesion.fase = 'espera';
    guardar();
    pintarRonda();
    window.scrollTo({ top: 0 });
  }

  // ---------- Puntos totales ----------
  function verTotales() {
    sesion.fase = 'final';
    guardar();
    pintarFinal();
  }

  function pintarFinal() {
    const total = sesion.rondas.reduce((suma, ronda) => suma + puntosDe(ronda), 0);
    $('final-jugador').textContent = sesion.nombre + ' · Sala ' + Stop.codigoSala.formatear(sesion.codigo);
    $('total-puntos').textContent = String(total);
    const detalle = $('detalle-final');
    vaciar(detalle);
    sesion.rondas.forEach((ronda, indice) => {
      if (ronda.inicio === null) return; // ronda que no se jugó
      const palabras = sesion.config.categorias
        .map((id) => Stop.categorias.nombrePorId(id) + ': ' + ((ronda.respuestas[id] || '').trim() || '—'))
        .join(' · ');
      detalle.append(crear('div', { clase: 'detalle-ronda' },
        crear('div', { clase: 'detalle-ronda__cabecera' },
          crear('span', { texto: 'Ronda ' + (indice + 1) }),
          crear('span', { texto: puntosDe(ronda) + ' pts' })),
        crear('div', { clase: 'detalle-ronda__datos', texto: 'Inicio ' + Stop.tiempo.formatear(ronda.inicio) + ' · Final ' + Stop.tiempo.formatear(ronda.fin) }),
        crear('div', { clase: 'detalle-ronda__datos', texto: palabras })));
    });
    mostrar('final');
  }

  function nuevaPartida() {
    if (!window.confirm('Se borrarán tus respuestas y puntos de esta partida. ¿Continuar?')) return;
    almacen.borrar('jugador');
    sesion = null;
    $('mensaje-ingreso').textContent = '';
    mostrar('ingreso');
  }

  // ---------- Arranque ----------
  function iniciar() {
    Stop.barra.montar('Jugador', 'jugador');
    Stop.tiempo.iniciarReloj($('hora-actual'));
    $('formulario-ingreso').addEventListener('submit', entrar);
    $('boton-iniciar').addEventListener('click', iniciarRonda);
    $('boton-stop').addEventListener('click', pulsarStop);
    $('boton-nueva').addEventListener('click', nuevaPartida);
    $('boton-volver').addEventListener('click', () => { sesion.fase = 'coordinando'; sesion.ronda = Math.min(sesion.ronda, sesion.rondas.length - 1); guardar(); pintarRonda(); });
    if (window.location.hash.length > 1) $('entrada-codigo').value = decodeURIComponent(window.location.hash.slice(1));

    if (sesion && sesion.config) {
      if (sesion.fase === 'final') pintarFinal();
      else pintarRonda();
    } else {
      mostrar('ingreso');
    }
  }

  iniciar();
})();
