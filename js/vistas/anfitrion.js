/* anfitrion.js · Configuración de la partida y generación del código de sala */
(function () {
  const { crear, vaciar } = Stop.dom;
  const almacen = Stop.almacenamiento;
  const NOMBRES_NIVEL = { inicial: 'Inicial', medio: 'Medio', dificil: 'Difícil', personalizada: 'Personalizada' };

  // ---------- Estado (borrador guardado en localStorage) ----------
  function valoresIniciales() {
    return {
      nombre: 'Sala', dificultad: 'medio', rondas: 8,
      letras: Stop.letras.sortear('medio', 8),
      categorias: Stop.categorias.NIVELES.medio.slice(),
      reglas: { unica: 100, repetida: 50, invalida: 0, penalizacion: 2, gracia: 5 }
    };
  }
  let estado = almacen.leer('anfitrion') || valoresIniciales();

  const $ = (id) => document.getElementById(id);
  const guardarBorrador = () => almacen.guardar('anfitrion', estado);

  function mostrarError(texto, esAviso = false) {
    const caja = $('mensaje');
    caja.textContent = texto || '';
    caja.className = esAviso ? 'aviso aviso--ok' : 'aviso';
  }

  // ---------- Dificultad ----------
  function pintarDificultad() {
    const grupo = $('grupo-dificultad');
    vaciar(grupo);
    Object.keys(NOMBRES_NIVEL).forEach((nivel) => {
      grupo.append(crear('button', {
        clase: 'chip', type: 'button', texto: NOMBRES_NIVEL[nivel],
        'aria-pressed': String(estado.dificultad === nivel),
        enClick: () => cambiarDificultad(nivel)
      }));
    });
  }

  function cambiarDificultad(nivel) {
    estado.dificultad = nivel;
    if (nivel !== 'personalizada') {
      estado.categorias = Stop.categorias.NIVELES[nivel].slice();
      estado.letras = Stop.letras.sortear(nivel, estado.rondas);
    }
    refrescar();
  }

  // ---------- Letras ----------
  function pintarLetras() {
    const rejilla = $('cuadricula-letras');
    vaciar(rejilla);
    Stop.letras.ALFABETO.forEach((letra) => {
      const posicion = estado.letras.indexOf(letra);
      rejilla.append(crear('button', {
        clase: 'letra-chip', type: 'button', texto: letra,
        'aria-pressed': String(posicion >= 0),
        'aria-label': 'Letra ' + letra + (posicion >= 0 ? ', ronda ' + (posicion + 1) : ''),
        enClick: () => alternarLetra(letra)
      }));
    });
    $('orden-letras').textContent = estado.letras.length
      ? 'Orden de rondas: ' + estado.letras.join(' · ')
      : 'Aún no hay letras elegidas.';
    $('contador-letras').textContent = estado.letras.length + ' de ' + estado.rondas;
  }

  function alternarLetra(letra) {
    const posicion = estado.letras.indexOf(letra);
    if (posicion >= 0) estado.letras.splice(posicion, 1);
    else if (estado.letras.length < estado.rondas) estado.letras.push(letra);
    else return mostrarError('Ya elegiste ' + estado.rondas + ' letras; quita una antes de añadir otra.');
    mostrarError('');
    guardarBorrador();
    pintarLetras();
  }

  function sortearLetras() {
    estado.letras = Stop.letras.sortear(estado.dificultad, estado.rondas);
    mostrarError('');
    guardarBorrador();
    pintarLetras();
  }

  function ajustarRondas(valor) {
    const rondas = Math.min(Stop.letras.MAXIMO_RONDAS, Math.max(1, Math.round(Number(valor)) || 1));
    estado.rondas = rondas;
    estado.letras = estado.letras.slice(0, rondas);
    const faltan = rondas - estado.letras.length;
    if (faltan > 0) estado.letras = estado.letras.concat(Stop.letras.sortear(estado.dificultad, faltan, estado.letras));
    refrescar();
  }

  // ---------- Categorías ----------
  function pintarCategorias() {
    const grupo = $('grupo-categorias');
    vaciar(grupo);
    const editable = estado.dificultad === 'personalizada';
    Stop.categorias.CATALOGO.forEach((categoria) => {
      const activa = estado.categorias.includes(categoria.id);
      grupo.append(crear('button', {
        clase: 'chip', type: 'button', texto: categoria.nombre,
        'aria-pressed': String(activa), disabled: !editable,
        enClick: () => alternarCategoria(categoria.id)
      }));
    });
    $('nota-categorias').textContent = editable
      ? 'Selecciona cada categoría que quieras usar.'
      : 'Las categorías las define el nivel. Elige "Personalizada" para escogerlas.';
  }

  function alternarCategoria(id) {
    const posicion = estado.categorias.indexOf(id);
    if (posicion >= 0) estado.categorias.splice(posicion, 1);
    else estado.categorias.push(id);
    guardarBorrador();
    pintarCategorias();
  }

  // ---------- Reglas ----------
  function leerReglas() {
    ['unica', 'repetida', 'invalida', 'penalizacion', 'gracia'].forEach((clave) => {
      estado.reglas[clave] = Number($('regla-' + clave).value);
    });
    guardarBorrador();
  }

  function pintarReglas() {
    Object.keys(estado.reglas).forEach((clave) => { $('regla-' + clave).value = estado.reglas[clave]; });
  }

  // ---------- Sala ----------
  function enlaceJugador(codigo) {
    return new URL('jugador.html', window.location.href).href + '#' + codigo;
  }

  function mostrarSala(sala) {
    $('sala-titulo').textContent = 'Sala lista';
    $('sala-subtitulo').textContent = 'Comparte este código con los jugadores';
    $('sala-id').textContent = sala.identificador;
    $('entrada-codigo').value = sala.codigo;
    $('sala-resultado').hidden = false;
    $('enlace-verificacion').hidden = false;
  }

  function generarSala() {
    estado.nombre = $('entrada-nombre').value;
    leerReglas();
    const resultado = Stop.codigoSala.crear(estado);
    if (!resultado.ok) return mostrarError(resultado.error);
    mostrarError('');
    const sala = { codigo: resultado.codigo, identificador: resultado.identificador, config: estado };
    almacen.guardar('sala', sala);
    almacen.borrar('verificacion'); // una sala nueva empieza una verificación nueva
    mostrarSala(sala);
  }

  async function copiar(texto, mensaje) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch (error) {
      $('entrada-codigo').select();
      document.execCommand('copy');
    }
    mostrarError(mensaje, true);
  }

  // ---------- Arranque ----------
  function refrescar() {
    guardarBorrador();
    $('entrada-rondas').value = estado.rondas;
    pintarDificultad();
    pintarLetras();
    pintarCategorias();
    mostrarError('');
  }

  function iniciar() {
    Stop.barra.montar('Anfitrión');
    $('entrada-nombre').value = estado.nombre;
    pintarReglas();
    refrescar();

    $('entrada-nombre').addEventListener('input', (evento) => { estado.nombre = evento.target.value; guardarBorrador(); });
    $('entrada-rondas').addEventListener('change', (evento) => ajustarRondas(evento.target.value));
    $('boton-sortear').addEventListener('click', sortearLetras);
    ['unica', 'repetida', 'invalida', 'penalizacion', 'gracia'].forEach((clave) => $('regla-' + clave).addEventListener('change', leerReglas));
    $('boton-generar').addEventListener('click', generarSala);
    $('boton-copiar-codigo').addEventListener('click', () => copiar($('entrada-codigo').value, 'Código copiado.'));
    $('boton-copiar-enlace').addEventListener('click', () => copiar(enlaceJugador($('entrada-codigo').value), 'Enlace copiado.'));
    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter' && evento.target.tagName !== 'BUTTON' && evento.target.tagName !== 'A') generarSala();
    });

    const salaGuardada = almacen.leer('sala');
    if (salaGuardada && salaGuardada.codigo) mostrarSala(salaGuardada);
  }

  iniciar();
})();
