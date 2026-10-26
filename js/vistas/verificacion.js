/* verificacion.js · Verificación de victoria.
   Se audita al jugador que declara más puntos: el anfitrión escribe las palabras que dice y
   muestra, la app las busca en el registro de la partida (se puede corregir a mano) y compara
   el resultado con lo declarado, descontando la penalización por tiempo. */
(function () {
  const { crear, vaciar } = Stop.dom;
  const almacen = Stop.almacenamiento;
  const $ = (id) => document.getElementById(id);
  const ETIQUETAS_MARCA = { unica: 'Única', repetida: 'Repetida', invalida: 'Inválida' };

  const partida = almacen.leer('partida'); // registro de palabras y horas de cierre
  const hayPartida = !!(partida && partida.version === 3 && partida.config && partida.rondas.some((ronda) => ronda.inicio !== null));

  let estado = almacen.leer('verificacion');
  if (!estado || estado.version !== 3) estado = { version: 3, declaraciones: [], siguienteId: 1, auditado: null, eleccionManual: false, auditorias: {} };
  let refs = {};
  const guardar = () => almacen.guardar('verificacion', estado);

  const nombreCategoria = (id) => Stop.categorias.nombrePorId(id);
  const reglas = () => partida.config.reglas;
  const rondasJugadas = () => partida.rondas.map((_ronda, indice) => indice).filter((indice) => partida.rondas[indice].inicio !== null);

  // ---------- Declaraciones ----------
  const ranking = () => estado.declaraciones.slice().sort((a, b) => b.puntos - a.puntos || a.id - b.id);

  // Por defecto se audita al que declara más; el anfitrión puede elegir a otro
  function ajustarAuditado() {
    const orden = ranking();
    if (!orden.length) { estado.auditado = null; estado.eleccionManual = false; return; }
    const existe = orden.some((declaracion) => declaracion.id === estado.auditado);
    if (!estado.eleccionManual || !existe) { estado.auditado = orden[0].id; estado.eleccionManual = false; }
  }

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
    ajustarAuditado();
    guardar();
    renderizar();
    $('entrada-nombre').focus();
  }

  function quitarDeclaracion(declaracion) {
    estado.declaraciones = estado.declaraciones.filter((otra) => otra.id !== declaracion.id);
    delete estado.auditorias[declaracion.id];
    ajustarAuditado();
    guardar();
    renderizar();
  }

  function pintarDeclaraciones() {
    const lista = $('lista-declaraciones');
    vaciar(lista);
    const orden = ranking();
    if (!orden.length) lista.append(crear('p', { clase: 'tarjeta__subtitulo', texto: 'Todavía no hay jugadores anotados.' }));
    orden.forEach((declaracion, indice) => {
      const activo = declaracion.id === estado.auditado;
      lista.append(crear('div', { clase: 'fila-declaracion' },
        crear('span', { clase: 'puntos', texto: String(indice + 1) }),
        crear('span', {}, crear('span', { clase: 'fila-registro__texto', texto: declaracion.nombre + ' ' }),
          indice === 0 ? crear('span', { clase: 'chip chip--suave', texto: 'Declara más puntos' }) : null),
        crear('strong', { clase: 'puntos', texto: declaracion.puntos + ' pts' }),
        crear('button', {
          clase: 'boton boton--pequeno', type: 'button', texto: activo ? 'Auditando' : 'Auditar', 'aria-pressed': String(activo),
          enClick: () => { estado.auditado = declaracion.id; estado.eleccionManual = true; guardar(); renderizar(); }
        }),
        crear('button', { clase: 'boton-quitar', type: 'button', 'aria-label': 'Quitar a ' + declaracion.nombre, enClick: () => quitarDeclaracion(declaracion) },
          Stop.iconos.crear('cerrar', 'Quitar', 18))));
    });
  }

  // ---------- Auditoría ----------
  function auditoria(id) {
    if (!estado.auditorias[id]) estado.auditorias[id] = { rondas: partida.rondas.map(() => ({ palabras: {}, final: '' })) };
    return estado.auditorias[id];
  }

  function entradaDe(rondaAuditada, idCategoria) {
    return rondaAuditada.palabras[idCategoria] || (rondaAuditada.palabras[idCategoria] = { texto: '', marca: null });
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
    const cierre = partida.rondas[indiceRonda].cierre === null ? null : Stop.tiempo.segundosDelDia(partida.rondas[indiceRonda].cierre);
    const final = Stop.tiempo.aSegundos(rondaAuditada.final);
    const exceso = Stop.puntuacion.excesoSegundos(final, cierre, reglas().gracia);
    const penalizacion = Stop.puntuacion.penalizacion(exceso, reglas().penalizacion);
    return { detalle, palabras, sinRegistro, exceso, penalizacion, neto: Math.max(0, palabras - penalizacion), hayCierre: cierre !== null, hayFinal: final !== null };
  }

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
    const horaFinal = crear('input', {
      id: 'hora-final-' + indiceRonda, type: 'text', inputmode: 'numeric', placeholder: 'HH:MM:SS', autocomplete: 'off', value: rondaAuditada.final,
      enInput: (evento) => { rondaAuditada.final = evento.target.value; guardar(); actualizar(); }
    });
    return crear('article', { clase: 'tarjeta' },
      crear('h2', { clase: 'tarjeta__titulo', texto: 'Ronda ' + (indiceRonda + 1) + ' · letra ' + partida.config.letras[indiceRonda] }),
      contenedor,
      crear('div', { clase: 'fila-tiempo' }, crear('span', { texto: 'Cierre oficial' }), crear('strong', { texto: Stop.tiempo.formatear(partida.rondas[indiceRonda].cierre) })),
      crear('div', { clase: 'fila-tiempo' }, crear('label', { for: 'hora-final-' + indiceRonda, texto: 'Hora final que marca su celular' }), horaFinal),
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
    refs.siguiente = crear('button', { clase: 'boton boton--pequeno', type: 'button', texto: 'Auditar al siguiente jugador', enClick: auditarSiguiente });

    zona.append(crear('article', { clase: 'tarjeta' },
      crear('h2', { clase: 'tarjeta__titulo', texto: 'Auditoría de ' + declaracion.nombre }),
      crear('p', { clase: 'tarjeta__subtitulo', texto: 'Escribe cada palabra que dice y muestra. Se busca en el registro del anfitrión; si hace falta, corrige el valor a mano.' }),
      crear('div', { clase: 'rejilla-3' },
        crear('div', { clase: 'loseta' }, crear('span', { clase: 'etiqueta', texto: 'Declara' }), refs.declarado),
        crear('div', { clase: 'loseta' }, crear('span', { clase: 'etiqueta', texto: 'Según sus palabras' }), refs.registro),
        crear('div', { clase: 'loseta' }, crear('span', { clase: 'etiqueta', texto: 'Diferencia' }), refs.diferencia)),
      refs.detalle, refs.veredicto, refs.siguiente));
    rondasJugadas().forEach((indice) => zona.append(crearTarjetaRonda(indice, auditada)));
    actualizar();
  }

  function auditarSiguiente() {
    const orden = ranking();
    const posicion = orden.findIndex((declaracion) => declaracion.id === estado.auditado);
    if (posicion < 0 || posicion + 1 >= orden.length) return;
    estado.auditado = orden[posicion + 1].id;
    estado.eleccionManual = true;
    guardar();
    renderizar();
  }

  function actualizar() {
    const declaracion = estado.declaraciones.find((otra) => otra.id === estado.auditado);
    if (!declaracion) return;
    const auditada = auditoria(declaracion.id);
    let neto = 0;
    let palabras = 0;
    let penalizacion = 0;
    let sinRegistro = 0;

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
      celdas.exceso.textContent = !resultado.hayCierre ? 'Sin hora de cierre' : !resultado.hayFinal ? 'Falta la hora final' : resultado.exceso + ' s';
      celdas.penalizacion.textContent = '-' + resultado.penalizacion + ' pts';
      celdas.neto.textContent = resultado.neto + ' pts';
      neto += resultado.neto;
      palabras += resultado.palabras;
      penalizacion += resultado.penalizacion;
      sinRegistro += resultado.sinRegistro;
    });

    const diferencia = declaracion.puntos - neto;
    refs.declarado.textContent = declaracion.puntos + ' pts';
    refs.registro.textContent = neto + ' pts';
    refs.diferencia.textContent = (diferencia > 0 ? '+' : '') + diferencia + ' pts';
    refs.detalle.textContent = 'Palabras: ' + palabras + ' pts · Penalización por tiempo: -' + penalizacion + ' pts' +
      (sinRegistro ? ' · ' + sinRegistro + (sinRegistro === 1 ? ' palabra no está' : ' palabras no están') + ' en el registro' : '');
    if (diferencia === 0) refs.veredicto.textContent = 'Coincide: la victoria de ' + declaracion.nombre + ' queda confirmada.';
    else if (diferencia > 0) refs.veredicto.textContent = 'Declara ' + diferencia + ' puntos de más: no se confirma la victoria.';
    else refs.veredicto.textContent = 'Declara ' + Math.abs(diferencia) + ' puntos de menos: revisa si faltan palabras.';
    const orden = ranking();
    const hayOtro = orden.findIndex((otra) => otra.id === estado.auditado) + 1 < orden.length;
    refs.siguiente.hidden = diferencia === 0 || !hayOtro;
  }

  // ---------- Pantalla ----------
  function renderizar() {
    pintarDeclaraciones();
    pintarAuditoria();
  }

  function iniciar() {
    Stop.barra.montar('Verificación', 'anfitrion');
    $('pantalla-sin-partida').hidden = hayPartida;
    $('pantalla-verificacion').hidden = !hayPartida;
    if (!hayPartida) return;
    $('formulario-declaracion').addEventListener('submit', anotarDeclaracion);
    ajustarAuditado();
    renderizar();
  }

  iniciar();
})();
