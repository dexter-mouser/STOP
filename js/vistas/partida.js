/* partida.js · Pantalla de partida del anfitrión.
   Muestra el orden de juego con el cronómetro, marca el ritmo de cada ronda y, al terminarla,
   registra cada palabra con su puntuación (sin límite de palabras). Los puntos se suman. */
(function () {
  const { crear, vaciar } = Stop.dom;
  const almacen = Stop.almacenamiento;
  const $ = (id) => document.getElementById(id);

  const ETIQUETAS_MARCA = { unica: 'Única', repetida: 'Repetida', invalida: 'Inválida' };
  const ESTADOS = { lista: 'Lista para empezar', juego: 'Ronda en marcha', palabras: 'Registrando palabras', final: 'Partida terminada' };

  let estado = almacen.leer('partida');
  if (estado && estado.version !== 3) estado = null;
  let refs = {}; // elementos de la fase actual que se actualizan sin reconstruir la pantalla
  const guardar = () => almacen.guardar('partida', estado);

  // ---------- Estado ----------
  function crearEstado(sala) {
    return {
      version: 3, codigo: sala.codigo, config: sala.config, ronda: 0, fase: 'lista',
      rondas: sala.config.letras.map(() => ({ inicio: null, cierre: null, categorias: {} }))
    };
  }

  const rondaActual = () => estado.rondas[estado.ronda];
  const letraActual = () => estado.config.letras[estado.ronda];
  const reglas = () => estado.config.reglas;
  const esUltimaRonda = () => estado.ronda === estado.rondas.length - 1;
  const nombreCategoria = (id) => Stop.categorias.nombrePorId(id);
  const valorDeMarca = (marca) => Stop.puntuacion.valorDeMarca(marca, reglas());

  // ---------- Registro de palabras: [{ texto, marca, valor, manual }] por categoría ----------
  function palabrasDe(ronda, idCategoria) {
    return ronda.categorias[idCategoria] || (ronda.categorias[idCategoria] = []);
  }

  // Sugiere el valor de cada palabra (repetida si se anotó más de una vez, inválida si no empieza
  // con la letra), salvo las que el anfitrión fijó a mano
  function recalcular(idCategoria) {
    const palabras = palabrasDe(rondaActual(), idCategoria);
    const entradas = {};
    palabras.forEach((palabra, indice) => { entradas[indice] = { palabra: palabra.texto }; });
    const sugeridas = Stop.puntuacion.sugerirMarcas(entradas, letraActual());
    palabras.forEach((palabra, indice) => {
      if (!palabra.manual) palabra.marca = sugeridas[indice];
      palabra.valor = valorDeMarca(palabra.marca);
    });
  }

  function sumaRonda(ronda) {
    return estado.config.categorias.reduce((total, id) => total + (ronda.categorias[id] || []).reduce((suma, palabra) => suma + palabra.valor, 0), 0);
  }
  const sumaPartida = () => estado.rondas.reduce((total, ronda) => total + sumaRonda(ronda), 0);

  // ---------- Cabecera ----------
  function pintarOrden() {
    const contenedor = $('orden-juego');
    vaciar(contenedor);
    const final = estado.fase === 'final';
    estado.config.letras.forEach((letra, indice) => {
      const hecha = final || indice < estado.ronda;
      const actual = !final && indice === estado.ronda;
      contenedor.append(crear('div', {
        clase: 'orden__ronda' + (hecha ? ' orden__ronda--hecha' : '') + (actual ? ' orden__ronda--actual' : ''),
        role: 'listitem', 'aria-current': actual ? 'step' : false,
        'aria-label': 'Ronda ' + (indice + 1) + ', letra ' + letra + (hecha ? ', terminada' : actual ? ', actual' : ', pendiente')
      }, crear('small', { texto: 'Ronda ' + (indice + 1) }), crear('strong', { texto: letra })));
    });
  }

  function pintarCronometro() {
    if (!estado) return;
    const ronda = rondaActual();
    let texto = '00:00';
    if (estado.fase === 'final') texto = '--:--';
    else if (ronda.inicio !== null) texto = Stop.tiempo.duracion((ronda.cierre !== null ? ronda.cierre : Date.now()) - ronda.inicio);
    $('cronometro').textContent = texto;
  }

  function pintarCabecera() {
    const final = estado.fase === 'final';
    const ronda = rondaActual();
    $('sala-codigo').textContent = 'Sala ' + Stop.codigoSala.formatear(estado.codigo);
    $('letra-grande').textContent = final ? 'FIN' : letraActual();
    $('letra-grande').classList.toggle('insignia__letra--texto', final);
    $('letra-insignia').setAttribute('aria-label', final ? 'Partida terminada' : 'Letra de la ronda: ' + letraActual());
    $('ronda-titulo').textContent = final ? 'Partida terminada' : 'Ronda ' + (estado.ronda + 1) + ' de ' + estado.rondas.length;
    $('estado-ronda').textContent = ESTADOS[estado.fase];
    let detalle = 'Ronda sin iniciar';
    if (final) detalle = 'Todas las rondas jugadas';
    else if (ronda.inicio !== null) detalle = 'Inicio ' + Stop.tiempo.formatear(ronda.inicio) + (ronda.cierre === null ? '' : ' · Cierre ' + Stop.tiempo.formatear(ronda.cierre) + ' · Tiempo oficial ' + Stop.tiempo.duracion(ronda.cierre - ronda.inicio));
    $('cronometro-detalle').textContent = detalle;
    pintarOrden();
    pintarCronometro();
    configurarAccion();
  }

  function configurarAccion() {
    const boton = $('boton-accion');
    vaciar(boton);
    const acciones = {
      lista: ['Iniciar ronda', 'reproducir', iniciarRonda],
      juego: ['STOP oficial', 'parada', detenerRonda],
      palabras: [esUltimaRonda() ? 'Terminar partida' : 'Siguiente ronda', 'siguiente', avanzar],
      final: ['Verificar victoria', 'trofeo', irAVerificacion]
    };
    const [texto, icono, manejador] = acciones[estado.fase];
    boton.append(Stop.iconos.crear(icono, texto), texto);
    boton.onclick = manejador;
  }

  const accionPrincipal = () => $('boton-accion').click();

  // ---------- Fases ----------
  function chipsCategorias() {
    return crear('div', { clase: 'chips' }, estado.config.categorias.map((id) => crear('span', { clase: 'chip', texto: nombreCategoria(id) })));
  }

  function pintarLista(zona) {
    zona.append(crear('article', { clase: 'tarjeta tarjeta--centro' },
      crear('span', { clase: 'etiqueta', texto: 'Dicta esta letra en voz alta' }),
      crear('p', { clase: 'codigo-grande', texto: letraActual() }),
      crear('p', { clase: 'tarjeta__subtitulo', texto: 'Cuando todos estén listos, pulsa "Iniciar ronda".' }),
      chipsCategorias()));
  }

  function pintarJuego(zona) {
    zona.append(crear('article', { clase: 'tarjeta tarjeta--centro' },
      crear('span', { clase: 'etiqueta', texto: 'La ronda está en marcha' }),
      crear('p', { clase: 'tarjeta__subtitulo', texto: 'Cuando alguien cante STOP, pulsa "STOP oficial" para guardar la hora de cierre.' }),
      chipsCategorias()));
  }

  // Una tarjeta por categoría: lista de palabras con su valor y formulario para añadir más
  function crearTarjetaCategoria(idCategoria) {
    const ronda = rondaActual();
    const lista = crear('div', { clase: 'contenido', style: 'width: 100%; gap: 0; padding: 0' });
    const campo = crear('input', { type: 'text', maxlength: '40', autocomplete: 'off', 'aria-label': 'Nueva palabra de ' + nombreCategoria(idCategoria) });

    function pintarLista() {
      vaciar(lista);
      const palabras = palabrasDe(ronda, idCategoria);
      if (!palabras.length) lista.append(crear('p', { clase: 'tarjeta__subtitulo', texto: 'Todavía no hay palabras en esta categoría.' }));
      palabras.forEach((palabra, indice) => lista.append(crearFila(palabra, indice)));
    }

    function crearFila(palabra, indice) {
      const botones = {};
      const puntos = crear('span', { clase: 'puntos', texto: String(palabra.valor) });
      const marcas = crear('div', { clase: 'marcas', role: 'group', 'aria-label': 'Puntuación de ' + palabra.texto });
      Stop.puntuacion.MARCAS.forEach((marca) => {
        botones[marca] = crear('button', {
          clase: 'marca marca--' + marca, type: 'button', texto: ETIQUETAS_MARCA[marca] + ' ' + valorDeMarca(marca),
          'aria-pressed': String(palabra.marca === marca),
          enClick: () => {
            palabra.manual = true;
            palabra.marca = marca;
            palabra.valor = valorDeMarca(marca);
            guardar();
            Object.keys(botones).forEach((otra) => botones[otra].setAttribute('aria-pressed', String(otra === marca)));
            puntos.textContent = String(palabra.valor);
            actualizarTotales();
          }
        });
        marcas.append(botones[marca]);
      });
      const quitar = crear('button', {
        clase: 'boton-quitar', type: 'button', 'aria-label': 'Quitar ' + palabra.texto,
        enClick: () => {
          palabrasDe(ronda, idCategoria).splice(indice, 1);
          recalcular(idCategoria);
          guardar();
          pintarLista();
          actualizarTotales();
        }
      }, Stop.iconos.crear('cerrar', 'Quitar', 18));
      return crear('div', { clase: 'fila-registro' }, crear('span', { clase: 'fila-registro__texto', texto: palabra.texto }), marcas, puntos, quitar);
    }

    function anadir(evento) {
      evento.preventDefault();
      const texto = campo.value.trim().slice(0, 40);
      if (!texto) return;
      palabrasDe(ronda, idCategoria).push({ texto, marca: 'unica', valor: 0, manual: false });
      recalcular(idCategoria);
      campo.value = '';
      guardar();
      pintarLista();
      actualizarTotales();
      campo.focus();
    }

    pintarLista();
    return crear('article', { clase: 'tarjeta' },
      crear('h2', { clase: 'tarjeta__titulo', texto: nombreCategoria(idCategoria) + ' · letra ' + letraActual() }),
      lista,
      crear('form', { clase: 'formulario-palabra', enSubmit: anadir }, campo,
        crear('button', { clase: 'boton boton--pequeno boton--primario', type: 'submit', texto: 'Añadir palabra' })));
  }

  function pintarPalabras(zona) {
    refs.totalRonda = crear('span', { clase: 'loseta__cifra' });
    refs.totalPartida = crear('span', { clase: 'loseta__cifra' });
    zona.append(crear('article', { clase: 'tarjeta' },
      crear('h2', { clase: 'tarjeta__titulo', texto: 'Registro de palabras' }),
      crear('p', { clase: 'tarjeta__subtitulo', texto: 'Cuando cada jugador diga y muestre sus palabras, cópialas aquí y asígnales su puntuación. Puedes añadir todas las que necesites.' }),
      crear('div', { clase: 'rejilla-3' },
        crear('div', { clase: 'loseta' }, crear('span', { clase: 'etiqueta', texto: 'Suma de la ronda' }), refs.totalRonda),
        crear('div', { clase: 'loseta' }, crear('span', { clase: 'etiqueta', texto: 'Suma de la partida' }), refs.totalPartida),
        crear('div', { clase: 'loseta' }, crear('span', { clase: 'etiqueta', texto: 'Tiempo oficial' }), crear('span', { clase: 'loseta__cifra', texto: Stop.tiempo.duracion(rondaActual().cierre - rondaActual().inicio) })))));
    estado.config.categorias.forEach((id) => zona.append(crearTarjetaCategoria(id)));
    actualizarTotales();
  }

  function actualizarTotales() {
    if (!refs.totalRonda) return;
    refs.totalRonda.textContent = sumaRonda(rondaActual()) + ' pts';
    refs.totalPartida.textContent = sumaPartida() + ' pts';
  }

  function pintarFinal(zona) {
    const maximo = Math.max(1, ...estado.rondas.map(sumaRonda));
    const filas = crear('div', { clase: 'contenido', style: 'width: 100%; gap: 0; padding: 0' });
    estado.rondas.forEach((ronda, indice) => {
      filas.append(crear('div', { clase: 'fila-barra' },
        crear('span', { texto: 'Ronda ' + (indice + 1) + ' · ' + estado.config.letras[indice] }),
        crear('div', { clase: 'barra-puntos', 'aria-hidden': 'true' }, crear('span', { style: 'width: ' + Math.round(sumaRonda(ronda) / maximo * 100) + '%' })),
        crear('strong', { clase: 'puntos', texto: String(sumaRonda(ronda)) })));
    });
    zona.append(
      crear('article', { clase: 'tarjeta tarjeta--centro' },
        crear('span', { clase: 'etiqueta', texto: 'Suma de la partida' }),
        crear('p', { clase: 'codigo-grande', texto: sumaPartida() + ' pts' }),
        crear('p', { clase: 'tarjeta__subtitulo', texto: 'Ahora pregunta quién dice tener más puntos y verifica su victoria.' })),
      crear('article', { clase: 'tarjeta' }, crear('h2', { clase: 'tarjeta__titulo', texto: 'Puntos por ronda' }), filas),
      crear('div', { clase: 'chips' },
        crear('button', { clase: 'boton boton--primario', type: 'button', texto: 'Verificar victoria', enClick: accionPrincipal }),
        crear('button', { clase: 'boton', type: 'button', texto: 'Volver a la última ronda', enClick: () => irA('palabras') }),
        crear('button', { clase: 'boton boton--pequeno', type: 'button', texto: 'Nueva partida', enClick: reiniciar })));
  }

  // ---------- Acciones ----------
  function irA(fase) {
    estado.fase = fase;
    guardar();
    renderizar();
    window.scrollTo({ top: 0 });
  }

  function iniciarRonda() {
    const ronda = rondaActual();
    ronda.inicio = Date.now();
    ronda.cierre = null;
    irA('juego');
  }

  function detenerRonda() {
    rondaActual().cierre = Date.now(); // hora oficial de cierre
    irA('palabras');
  }

  function avanzar() {
    if (esUltimaRonda()) { irA('final'); return; }
    estado.ronda += 1;
    irA('lista');
  }

  function irAVerificacion() { window.location.href = 'verificacion.html'; }

  function reiniciar() {
    if (!window.confirm('Se borrarán las rondas y las palabras registradas. ¿Empezar una partida nueva?')) return;
    estado = crearEstado({ codigo: estado.codigo, config: estado.config });
    almacen.borrar('verificacion');
    irA('lista');
  }

  // ---------- Pantalla ----------
  function pintarFase() {
    const zona = $('zona-fase');
    vaciar(zona);
    refs = {};
    ({ lista: pintarLista, juego: pintarJuego, palabras: pintarPalabras, final: pintarFinal })[estado.fase](zona);
  }

  function renderizar() {
    pintarCabecera();
    pintarFase();
  }

  function iniciar() {
    Stop.barra.montar('Partida', 'anfitrion');
    Stop.tiempo.iniciarReloj($('hora-actual'));
    setInterval(pintarCronometro, 250); // 4 veces por segundo para que el cronómetro no se atrase
    if (!estado) {
      const sala = almacen.leer('sala'); // la guarda la pantalla de configuración
      if (sala && sala.config && Array.isArray(sala.config.letras) && sala.config.letras.length) {
        estado = crearEstado(sala);
        guardar();
      }
    }
    const hay = !!(estado && estado.config);
    $('pantalla-sin-sala').hidden = hay;
    $('pantalla-partida').hidden = !hay;
    if (hay) renderizar();
  }

  iniciar();
})();
