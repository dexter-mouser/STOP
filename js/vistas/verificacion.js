/* verificacion.js · Verificación de victoria automática.
   Cada jugador comparte su resultado (palabras, tiempos y puntos) y el anfitrión lo pega.
   La app busca cada palabra en el registro de la partida, calcula la penalización por tiempo y
   revisa jugador por jugador, de mayor a menor puntaje declarado, hasta confirmar al ganador.
   El tiempo se mide como duración desde que se inició la ronda, así que no depende de los relojes. */
(function () {
  const { crear, vaciar } = Stop.dom;
  const almacen = Stop.almacenamiento;
  const $ = (id) => document.getElementById(id);
  const ETIQUETAS_MARCA = { unica: 'Única', repetida: 'Repetida', invalida: 'Inválida' };

  const partida = almacen.leer('partida'); // registro de palabras y tiempos oficiales
  const hayPartida = !!(partida && partida.version === 3 && partida.config && partida.rondas.some((ronda) => ronda.inicio !== null));

  let estado = almacen.leer('verificacion');
  if (!estado || estado.version !== 5) estado = { version: 5, declaraciones: [], siguienteId: 1, auditado: null, eleccionManual: false, auditorias: {} };
  let refs = {};
  const guardar = () => almacen.guardar('verificacion', estado);

  const nombreCategoria = (id) => Stop.categorias.nombrePorId(id);
  const reglas = () => partida.config.reglas;
  const rondasJugadas = () => partida.rondas.map((_ronda, indice) => indice).filter((indice) => partida.rondas[indice].inicio !== null);

  function mostrarMensaje(texto, esAviso) {
    const caja = $('mensaje-resultado');
    caja.textContent = texto || '';
    caja.className = esAviso ? 'aviso aviso--ok' : 'aviso';
  }

  // ---------- Cálculo de cada jugador ----------
  // Datos de la auditoría de un jugador: palabras por categoría (con su corrección a mano opcional) y tiempo por ronda
  function auditoria(id) {
    if (!estado.auditorias[id]) estado.auditorias[id] = { rondas: partida.rondas.map(() => ({ palabras: {}, tiempo: '' })) };
    return estado.auditorias[id];
  }

  function entradaDe(rondaAuditada, idCategoria) {
    return rondaAuditada.palabras[idCategoria] || (rondaAuditada.palabras[idCategoria] = { texto: '', marca: null });
  }

  // Duración oficial de la ronda en segundos: desde que el anfitrión la inició hasta el STOP oficial
  function tiempoOficial(indiceRonda) {
    const ronda = partida.rondas[indiceRonda];
    return ronda.inicio === null || ronda.cierre === null ? null : Stop.tiempo.segundosEntre(ronda.inicio, ronda.cierre);
  }

  // Valor de la palabra del jugador: corrección a mano, o el que consta en el registro
  function resolver(indiceRonda, idCategoria, entrada) {
    const texto = (entrada.texto || '').trim();
    if (!texto) return { valor: 0, origen: 'vacia', texto: 'Sin palabra' };
    if (entrada.marca) {
      return { valor: Stop.puntuacion.valorDeMarca(entrada.marca, reglas()), origen: 'manual', texto: 'Corregida a mano: ' + ETIQUETAS_MARCA[entrada.marca] };
    }
    const anotada = Stop.puntuacion.buscarEnRegistro(partida.rondas[indiceRonda].categorias[idCategoria], texto);
    if (anotada) return { valor: anotada.valor, origen: 'registro', texto: 'En el registro: ' + ETIQUETAS_MARCA[anotada.marca] + ' · ' + anotada.valor + ' pts' };
    return { valor: 0, origen: 'sin-registro', texto: 'No está en el registro: vale 0' };
  }

  function resultadoRonda(indiceRonda, auditada) {
    const rondaAuditada = auditada.rondas[indiceRonda];
    const detalle = {};
    let palabras = 0;
    let sinRegistro = 0;
    partida.config.categorias.forEach((id) => {
      detalle[id] = resolver(indiceRonda, id, entradaDe(rondaAuditada, id));
      palabras += detalle[id].valor;
      if (detalle[id].origen === 'sin-registro') sinRegistro += 1;
    });
    const oficial = tiempoOficial(indiceRonda);
    const delJugador = Stop.tiempo.aDuracion(rondaAuditada.tiempo);
    const exceso = Stop.puntuacion.excesoSegundos(delJugador, oficial, reglas().gracia);
    const penalizacion = Stop.puntuacion.penalizacion(exceso, reglas().penalizacion);
    return { detalle, palabras, sinRegistro, exceso, penalizacion, neto: Math.max(0, palabras - penalizacion), hayOficial: oficial !== null, hayTiempo: delJugador !== null };
  }

  function totales(auditada) {
    const suma = { neto: 0, palabras: 0, penalizacion: 0, sinRegistro: 0 };
    rondasJugadas().forEach((indice) => {
      const resultado = resultadoRonda(indice, auditada);
      suma.neto += resultado.neto;
      suma.palabras += resultado.palabras;
      suma.penalizacion += resultado.penalizacion;
      suma.sinRegistro += resultado.sinRegistro;
    });
    return suma;
  }

  // ---------- Revisión automática de todos los jugadores ----------
  const ranking = () => estado.declaraciones.slice().sort((a, b) => b.puntos - a.puntos || a.id - b.id);

  // De mayor a menor puntaje declarado: gana el primero cuyo puntaje coincide con lo que suman sus palabras
  function evaluar() {
    return ranking().map((declaracion) => {
      const suma = totales(auditoria(declaracion.id));
      return Object.assign({ declaracion, confirmado: suma.neto === declaracion.puntos }, suma);
    });
  }

  // El detalle muestra por defecto al ganador (o al que declara más si nadie coincide)
  function ajustarAuditado() {
    const evaluados = evaluar();
    if (!evaluados.length) { estado.auditado = null; estado.eleccionManual = false; return; }
    const existe = evaluados.some((evaluado) => evaluado.declaracion.id === estado.auditado);
    if (!estado.eleccionManual || !existe) {
      estado.auditado = (evaluados.find((evaluado) => evaluado.confirmado) || evaluados[0]).declaracion.id;
      estado.eleccionManual = false;
    }
  }

  // ---------- Entrada de resultados ----------
  function agregarResultado(texto) {
    const leida = Stop.resultado.leer(texto);
    if (!leida.ok) return mostrarMensaje(leida.error);
    const datos = leida.datos;
    const categorias = partida.config.categorias;
    if (datos.codigo !== partida.codigo) return mostrarMensaje('Ese resultado es de otra sala.');
    if (datos.rondas.length !== partida.rondas.length || datos.rondas.some((ronda) => ronda.palabras.length !== categorias.length)) {
      return mostrarMensaje('El resultado no coincide con las rondas o categorías de esta partida.');
    }
    // Si el jugador vuelve a enviar su resultado, se reemplaza el anterior
    let declaracion = estado.declaraciones.find((otra) => otra.nombre.toLowerCase() === datos.nombre.toLowerCase());
    if (!declaracion) {
      declaracion = { id: estado.siguienteId, nombre: datos.nombre, puntos: datos.puntos };
      estado.siguienteId += 1;
      estado.declaraciones.push(declaracion);
    }
    declaracion.puntos = datos.puntos;
    estado.auditorias[declaracion.id] = {
      rondas: partida.rondas.map((_ronda, indice) => ({
        palabras: Object.fromEntries(categorias.map((id, posicion) => [id, { texto: datos.rondas[indice].palabras[posicion], marca: null }])),
        tiempo: datos.rondas[indice].tiempo === null ? '' : Stop.tiempo.duracion(datos.rondas[indice].tiempo * 1000)
      }))
    };
    estado.eleccionManual = false;
    guardar();
    renderizar();
    mostrarMensaje('Resultado de ' + datos.nombre + ' añadido y revisado.', true);
  }

  async function pegarResultado() {
    const texto = await Stop.portapapeles.pegar();
    if (texto === null) {
      $('detalle-pegado').open = true;
      return mostrarMensaje('El navegador no permite pegar con el botón. Pega el resultado en el recuadro de abajo.');
    }
    agregarResultado(texto);
  }

  function enviarRecuadro(evento) {
    evento.preventDefault();
    agregarResultado($('entrada-resultado').value);
    if ($('mensaje-resultado').className.indexOf('--ok') >= 0) $('entrada-resultado').value = '';
  }

  // Alternativa: anotar a mano a un jugador que no puede enviar su resultado
  function anotarDeclaracion(evento) {
    evento.preventDefault();
    const nombre = $('entrada-nombre').value.trim().slice(0, 20);
    const puntos = Number($('entrada-puntos').value);
    const aviso = $('mensaje-declaracion');
    if (!nombre) { aviso.textContent = 'Escribe el nombre del jugador.'; return; }
    if ($('entrada-puntos').value === '' || !Number.isInteger(puntos) || puntos < 0) { aviso.textContent = 'Anota los puntos como un número entero.'; return; }
    estado.declaraciones.push({ id: estado.siguienteId, nombre, puntos });
    estado.siguienteId += 1;
    aviso.textContent = '';
    $('entrada-nombre').value = '';
    $('entrada-puntos').value = '';
    estado.eleccionManual = false;
    guardar();
    renderizar();
  }

  function quitarDeclaracion(declaracion) {
    estado.declaraciones = estado.declaraciones.filter((otra) => otra.id !== declaracion.id);
    delete estado.auditorias[declaracion.id];
    guardar();
    renderizar();
  }

  // ---------- Resumen automático ----------
  function pintarResumen() {
    const zona = $('resumen-verificacion');
    vaciar(zona);
    const evaluados = evaluar();
    if (!evaluados.length) {
      zona.append(crear('p', { clase: 'tarjeta__subtitulo', texto: 'Cuando pegues el resultado de un jugador, la app lo revisa sola y aquí verás quién gana.' }));
      return;
    }
    const ganador = evaluados.find((evaluado) => evaluado.confirmado);
    zona.append(
      crear('span', { clase: 'etiqueta', texto: ganador ? 'Ganador confirmado' : 'Todavía no hay ganador confirmado' }),
      crear('p', { clase: 'titulo-ganador', role: 'status', texto: ganador ? ganador.declaracion.nombre + ' · ' + ganador.declaracion.puntos + ' pts' : 'Ninguna victoria coincide' }));
    evaluados.forEach((evaluado, indice) => {
      const declaracion = evaluado.declaracion;
      const activo = declaracion.id === estado.auditado;
      const diferencia = declaracion.puntos - evaluado.neto;
      zona.append(crear('div', { clase: 'fila-resultado' },
        crear('span', { clase: 'puntos', texto: String(indice + 1) }),
        crear('span', { clase: 'fila-registro__texto', texto: declaracion.nombre }),
        crear('span', { clase: 'dato-resultado' }, crear('small', { clase: 'etiqueta', texto: 'Declara' }), crear('strong', { texto: declaracion.puntos + ' pts' })),
        crear('span', { clase: 'dato-resultado' }, crear('small', { clase: 'etiqueta', texto: 'Sus palabras' }), crear('strong', { texto: evaluado.neto + ' pts' })),
        crear('span', { clase: 'chip chip--suave ' + (evaluado.confirmado ? 'chip--ok' : 'chip--alerta'), texto: evaluado.confirmado ? 'Confirmado' : 'Declara ' + Math.abs(diferencia) + (diferencia > 0 ? ' de más' : ' de menos') }),
        crear('button', {
          clase: 'boton boton--pequeno', type: 'button', texto: activo ? 'Viendo detalle' : 'Ver detalle', 'aria-pressed': String(activo),
          enClick: () => { estado.auditado = declaracion.id; estado.eleccionManual = true; guardar(); renderizar(); }
        }),
        crear('button', { clase: 'boton-quitar', type: 'button', 'aria-label': 'Quitar a ' + declaracion.nombre, enClick: () => quitarDeclaracion(declaracion) },
          Stop.iconos.crear('cerrar', 'Quitar', 18))));
    });
  }

  // ---------- Detalle de un jugador (con corrección a mano opcional) ----------
  function crearTarjetaRonda(indiceRonda, auditada) {
    const rondaAuditada = auditada.rondas[indiceRonda];
    refs.filas[indiceRonda] = {};
    const contenedor = crear('div', { clase: 'contenido', style: 'width: 100%; gap: 0; padding: 0' });

    partida.config.categorias.forEach((id) => {
      const entrada = entradaDe(rondaAuditada, id);
      const campo = crear('input', {
        type: 'text', maxlength: '40', autocomplete: 'off', value: entrada.texto,
        'aria-label': 'Palabra de ' + nombreCategoria(id) + ' en la ronda ' + (indiceRonda + 1),
        enInput: (evento) => { entrada.texto = evento.target.value; guardar(); actualizar(); }
      });
      const botones = {};
      const marcas = crear('div', { clase: 'marcas', role: 'group', 'aria-label': 'Corregir el valor de ' + nombreCategoria(id) });
      [['auto', 'Registro'], ['unica', 'Única'], ['repetida', 'Repetida'], ['invalida', 'Inválida']].forEach(([clave, texto]) => {
        botones[clave] = crear('button', {
          clase: 'marca marca--' + clave, type: 'button', texto,
          enClick: () => { entrada.marca = clave === 'auto' ? null : clave; guardar(); actualizar(); }
        });
        marcas.append(botones[clave]);
      });
      const puntos = crear('span', { clase: 'puntos' });
      const estadoFila = crear('span', { clase: 'fila-auditoria__estado' });
      refs.filas[indiceRonda][id] = { botones, puntos, estado: estadoFila };
      contenedor.append(crear('div', { clase: 'fila-auditoria' }, crear('span', { clase: 'etiqueta', texto: nombreCategoria(id) }), campo, marcas, puntos, estadoFila));
    });

    const celdas = { exceso: crear('strong'), penalizacion: crear('strong'), neto: crear('strong', { texto: '0 pts' }) };
    refs.rondas[indiceRonda] = celdas;
    const campoTiempo = crear('input', {
      id: 'tiempo-jugador-' + indiceRonda, type: 'text', inputmode: 'numeric', placeholder: 'MM:SS', autocomplete: 'off', value: rondaAuditada.tiempo,
      enInput: (evento) => { rondaAuditada.tiempo = evento.target.value; guardar(); actualizar(); }
    });
    const oficial = tiempoOficial(indiceRonda);
    return crear('article', { clase: 'tarjeta' },
      crear('h2', { clase: 'tarjeta__titulo', texto: 'Ronda ' + (indiceRonda + 1) + ' · letra ' + partida.config.letras[indiceRonda] }),
      contenedor,
      crear('div', { clase: 'fila-tiempo' }, crear('span', { texto: 'Tiempo oficial de la ronda' }), crear('strong', { texto: oficial === null ? '--:--' : Stop.tiempo.duracion(oficial * 1000) })),
      crear('div', { clase: 'fila-tiempo' }, crear('label', { for: 'tiempo-jugador-' + indiceRonda, texto: 'Tiempo del jugador (MM:SS)' }), campoTiempo),
      crear('div', { clase: 'fila-tiempo' }, crear('span', { texto: 'Segundos fuera de tiempo (tras el margen)' }), celdas.exceso),
      crear('div', { clase: 'fila-tiempo' }, crear('span', { texto: 'Penalización por tiempo' }), celdas.penalizacion),
      crear('div', { clase: 'total-ronda' }, crear('span', { clase: 'etiqueta', texto: 'Puntos de la ronda' }), celdas.neto));
  }

  function pintarAuditoria() {
    const zona = $('zona-auditoria');
    vaciar(zona);
    refs = { filas: {}, rondas: {} };
    const declaracion = estado.declaraciones.find((otra) => otra.id === estado.auditado);
    if (!declaracion) return;
    const auditada = auditoria(declaracion.id);

    refs.declarado = crear('span', { clase: 'loseta__cifra' });
    refs.registro = crear('span', { clase: 'loseta__cifra' });
    refs.diferencia = crear('span', { clase: 'loseta__cifra' });
    refs.detalle = crear('p', { clase: 'tarjeta__subtitulo' });
    refs.veredicto = crear('p', { clase: 'veredicto', role: 'status' });

    zona.append(crear('article', { clase: 'tarjeta' },
      crear('h2', { clase: 'tarjeta__titulo', texto: 'Detalle de ' + declaracion.nombre }),
      crear('p', { clase: 'tarjeta__subtitulo', texto: 'Las palabras vienen de su resultado y se buscan en el registro. Si hace falta, corrige una palabra o su valor a mano.' }),
      crear('div', { clase: 'rejilla-3' },
        crear('div', { clase: 'loseta' }, crear('span', { clase: 'etiqueta', texto: 'Declara' }), refs.declarado),
        crear('div', { clase: 'loseta' }, crear('span', { clase: 'etiqueta', texto: 'Según sus palabras' }), refs.registro),
        crear('div', { clase: 'loseta' }, crear('span', { clase: 'etiqueta', texto: 'Diferencia' }), refs.diferencia)),
      refs.detalle, refs.veredicto));
    rondasJugadas().forEach((indice) => zona.append(crearTarjetaRonda(indice, auditada)));
    actualizar();
  }

  // Actualiza el detalle y el resumen sin reconstruir los campos (así no se pierde el cursor)
  function actualizar() {
    const declaracion = estado.declaraciones.find((otra) => otra.id === estado.auditado);
    if (!declaracion) return;
    const auditada = auditoria(declaracion.id);
    rondasJugadas().forEach((indice) => {
      const resultado = resultadoRonda(indice, auditada);
      partida.config.categorias.forEach((id) => {
        const fila = refs.filas[indice][id];
        const dato = resultado.detalle[id];
        const entrada = entradaDe(auditada.rondas[indice], id);
        fila.estado.textContent = dato.texto;
        fila.estado.className = 'fila-auditoria__estado' + (dato.origen === 'sin-registro' ? ' estado--alerta' : dato.origen === 'registro' ? ' estado--ok' : '');
        fila.puntos.textContent = String(dato.valor);
        Object.keys(fila.botones).forEach((clave) => fila.botones[clave].setAttribute('aria-pressed', String(clave === 'auto' ? !entrada.marca : entrada.marca === clave)));
      });
      const celdas = refs.rondas[indice];
      celdas.exceso.textContent = !resultado.hayOficial ? 'Sin tiempo oficial' : !resultado.hayTiempo ? 'Falta el tiempo del jugador' : resultado.exceso + ' s';
      celdas.penalizacion.textContent = '-' + resultado.penalizacion + ' pts';
      celdas.neto.textContent = resultado.neto + ' pts';
    });

    const suma = totales(auditada);
    const diferencia = declaracion.puntos - suma.neto;
    refs.declarado.textContent = declaracion.puntos + ' pts';
    refs.registro.textContent = suma.neto + ' pts';
    refs.diferencia.textContent = (diferencia > 0 ? '+' : '') + diferencia + ' pts';
    refs.detalle.textContent = 'Palabras: ' + suma.palabras + ' pts · Penalización por tiempo: -' + suma.penalizacion + ' pts' +
      (suma.sinRegistro ? ' · ' + suma.sinRegistro + (suma.sinRegistro === 1 ? ' palabra no está' : ' palabras no están') + ' en el registro' : '');
    if (diferencia === 0) refs.veredicto.textContent = 'Coincide: la victoria de ' + declaracion.nombre + ' queda confirmada.';
    else if (diferencia > 0) refs.veredicto.textContent = 'Declara ' + diferencia + ' puntos de más: no se confirma la victoria.';
    else refs.veredicto.textContent = 'Declara ' + Math.abs(diferencia) + ' puntos de menos: revisa si faltan palabras.';
    pintarResumen();
  }

  // ---------- Pantalla ----------
  function renderizar() {
    ajustarAuditado();
    pintarResumen();
    pintarAuditoria();
  }

  function iniciar() {
    Stop.barra.montar('Verificación', 'anfitrion');
    $('pantalla-sin-partida').hidden = hayPartida;
    $('pantalla-verificacion').hidden = !hayPartida;
    if (!hayPartida) return;
    $('boton-pegar-resultado').addEventListener('click', pegarResultado);
    $('formulario-resultado').addEventListener('submit', enviarRecuadro);
    $('formulario-declaracion').addEventListener('submit', anotarDeclaracion);
    renderizar();
  }

  iniciar();
})();
