/* anfitrion.js · Configuración de la partida: el código de sala se actualiza solo */
(function () {
  const { crear, vaciar } = Stop.dom;
  const almacen = Stop.almacenamiento;
  const NOMBRES_NIVEL = { inicial: 'Inicial', medio: 'Medio', dificil: 'Difícil', personalizada: 'Personalizada' };
  const $ = (id) => document.getElementById(id);

  // ---------- Estado (borrador guardado en localStorage) ----------
  function valoresIniciales() {
    return {
      dificultad: 'medio', rondas: 8,
      letras: Stop.letras.sortear('medio', 8),
      categorias: Stop.categorias.NIVELES.medio.slice(),
      reglas: { unica: 100, repetida: 50, invalida: 0, penalizacion: 2, gracia: 5 }
    };
  }
  const guardado = almacen.leer('anfitrion') || {};
  const base = valoresIniciales();
  const estado = {
    dificultad: guardado.dificultad || base.dificultad,
    rondas: guardado.rondas || base.rondas,
    letras: guardado.letras || base.letras,
    categorias: guardado.categorias || base.categorias,
    reglas: Object.assign({}, base.reglas, guardado.reglas)
  };
  // Un borrador antiguo puede traer valores que ya no existen
  estado.categorias = estado.categorias.filter(Stop.categorias.esValida);
  if (!estado.categorias.length) estado.categorias = Stop.categorias.NIVELES[estado.dificultad].slice();
  estado.letras = estado.letras.filter(Stop.letras.esValida);
  // Categorías propias: se guardan aparte para no perderlas al cambiar de nivel
  estado.propias = (Array.isArray(guardado.propias) ? guardado.propias : []).map(Stop.categorias.limpiarNombre).filter(Boolean).slice(0, Stop.categorias.MAXIMO_PROPIAS);
  sincronizarPropias();

  let codigoActual = '';
  const guardarBorrador = () => almacen.guardar('anfitrion', estado);

  function mostrarError(texto) {
    const caja = $('mensaje');
    caja.textContent = texto || '';
    caja.className = 'aviso';
  }

  // ---------- Código de sala (se recalcula con cada cambio) ----------
  function actualizarCodigo() {
    const boton = $('codigo-sala');
    const resultado = Stop.codigoSala.validarAjustes(estado) ? null : Stop.codigoSala.crear(estado);
    codigoActual = resultado && resultado.ok ? resultado.codigo : '';
    const visible = codigoActual ? Stop.codigoSala.formatear(codigoActual) : '----';
    boton.textContent = visible;
    boton.disabled = !codigoActual;
    boton.setAttribute('aria-label', codigoActual ? 'Código de sala ' + visible + '. Pulsa para copiarlo.' : 'Código de sala no disponible');
    boton.classList.toggle('codigo-grande--medio', codigoActual.length > 6 && codigoActual.length <= 10);
    boton.classList.toggle('codigo-grande--largo', codigoActual.length > 10 && codigoActual.length <= 24);
    boton.classList.toggle('codigo-grande--muy-largo', codigoActual.length > 24);
    $('boton-copiar').disabled = !codigoActual;
    $('mensaje-codigo').textContent = '';
  }

  async function copiarCodigo() {
    if (!codigoActual) return;
    const copiado = await Stop.portapapeles.copiar(codigoActual);
    $('mensaje-codigo').textContent = copiado ? 'Código copiado.' : 'No se pudo copiar. Anota el código: ' + Stop.codigoSala.formatear(codigoActual);
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
    sincronizarPropias();
    refrescar();
  }

  // ---------- Letras (solo las conoce el anfitrión; no viajan en el código) ----------
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
      ? 'Orden de las rondas: ' + estado.letras.join(' · ')
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
  // Se mantienen en el orden del catálogo (así coinciden con las del código de sala)
  function ordenarCategorias() {
    estado.categorias = Stop.categorias.ordenar(estado.categorias);
  }

  // Las categorías propias solo cuentan en el nivel "Personalizada"
  function sincronizarPropias() {
    estado.categorias = estado.categorias.filter((id) => !Stop.categorias.esPropia(id));
    if (estado.dificultad === 'personalizada') estado.categorias = estado.categorias.concat(estado.propias.map(Stop.categorias.crearId));
    ordenarCategorias();
  }

  function pintarPropias() {
    const editable = estado.dificultad === 'personalizada';
    $('bloque-propias').hidden = !editable;
    const lista = $('lista-propias');
    vaciar(lista);
    estado.propias.forEach((nombre) => {
      lista.append(crear('span', { clase: 'chip chip--propia' }, nombre,
        crear('button', { clase: 'boton-quitar', type: 'button', 'aria-label': 'Quitar la categoría ' + nombre, enClick: () => quitarPropia(nombre) },
          Stop.iconos.crear('cerrar', 'Quitar', 16))));
    });
    $('contador-propias').textContent = estado.propias.length + ' de ' + Stop.categorias.MAXIMO_PROPIAS;
  }

  function anadirPropia(evento) {
    evento.preventDefault();
    const aviso = $('mensaje-propia');
    const nombre = Stop.categorias.limpiarNombre($('entrada-propia').value);
    if (!nombre) { aviso.textContent = 'Escribe el nombre de la categoría.'; return; }
    if (estado.propias.length >= Stop.categorias.MAXIMO_PROPIAS) { aviso.textContent = 'Puedes añadir hasta ' + Stop.categorias.MAXIMO_PROPIAS + ' categorías propias.'; return; }
    if (Stop.categorias.existeNombre(nombre, estado.propias)) { aviso.textContent = 'Esa categoría ya existe.'; return; }
    estado.propias.push(nombre);
    aviso.textContent = '';
    $('entrada-propia').value = '';
    sincronizarPropias();
    guardarBorrador();
    pintarCategorias();
    actualizarCodigo();
    $('entrada-propia').focus();
  }

  function quitarPropia(nombre) {
    estado.propias = estado.propias.filter((otra) => otra !== nombre);
    sincronizarPropias();
    guardarBorrador();
    pintarCategorias();
    actualizarCodigo();
  }

  function pintarCategorias() {
    const grupo = $('grupo-categorias');
    vaciar(grupo);
    const editable = estado.dificultad === 'personalizada';
    Stop.categorias.CATALOGO.forEach((categoria) => {
      grupo.append(crear('button', {
        clase: 'chip', type: 'button', texto: categoria.nombre,
        'aria-pressed': String(estado.categorias.includes(categoria.id)), disabled: !editable,
        enClick: () => alternarCategoria(categoria.id)
      }));
    });
    pintarPropias();
    $('nota-categorias').textContent = editable
      ? 'Toca cada categoría para sumarla o quitarla.'
      : 'Las categorías las define el nivel. Elige "Personalizada" para escogerlas tú.';
  }

  function alternarCategoria(id) {
    const posicion = estado.categorias.indexOf(id);
    if (posicion >= 0) estado.categorias.splice(posicion, 1);
    else estado.categorias.push(id);
    ordenarCategorias();
    guardarBorrador();
    pintarCategorias();
    actualizarCodigo();
  }

  // ---------- Reglas ----------
  const CLAVES_REGLAS = ['unica', 'repetida', 'invalida', 'penalizacion', 'gracia'];

  function leerReglas() {
    CLAVES_REGLAS.forEach((clave) => { estado.reglas[clave] = Number($('regla-' + clave).value); });
    guardarBorrador();
    actualizarCodigo();
  }

  // ---------- Iniciar la partida ----------
  function iniciarPartida() {
    leerReglas();
    ordenarCategorias();
    const error = Stop.codigoSala.validar(estado);
    if (error) return mostrarError(error);
    const previa = almacen.leer('partida');
    const enCurso = previa && Array.isArray(previa.rondas) && previa.rondas.some((ronda) => ronda.inicio !== null);
    if (enCurso && !window.confirm('Ya hay una partida en curso. Si empiezas otra, la anterior se borra. ¿Continuar?')) return;
    almacen.guardar('sala', { codigo: codigoActual, config: JSON.parse(JSON.stringify(estado)) });
    almacen.borrar('partida');
    almacen.borrar('verificacion');
    window.location.href = 'partida.html';
  }

  // ---------- Arranque ----------
  function refrescar() {
    guardarBorrador();
    $('entrada-rondas').value = estado.rondas;
    pintarDificultad();
    pintarLetras();
    pintarCategorias();
    actualizarCodigo();
    mostrarError('');
  }

  function iniciar() {
    Stop.barra.montar('Configuración', 'anfitrion');
    CLAVES_REGLAS.forEach((clave) => {
      $('regla-' + clave).value = estado.reglas[clave];
      $('regla-' + clave).addEventListener('input', leerReglas);
    });
    refrescar();
    $('entrada-rondas').addEventListener('change', (evento) => ajustarRondas(evento.target.value));
    $('boton-sortear').addEventListener('click', sortearLetras);
    $('codigo-sala').addEventListener('click', copiarCodigo);
    $('boton-copiar').addEventListener('click', copiarCodigo);
    $('formulario-propia').addEventListener('submit', anadirPropia);
    $('boton-iniciar').addEventListener('click', iniciarPartida);
    const previa = almacen.leer('partida');
    $('enlace-continuar').hidden = !(previa && previa.version === 3);
  }

  iniciar();
})();
