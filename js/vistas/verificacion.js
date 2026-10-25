/* verificacion.js · Auditoría del ganador: palabras reescritas, juicio y penalización por tiempo */
(function () {
  const { crear, vaciar } = Stop.dom;
  const almacen = Stop.almacenamiento;
  const $ = (id) => document.getElementById(id);
  const ETIQUETAS_MARCA = { unica: 'Única', repetida: 'Repetida', invalida: 'Inválida' };

  let estado = almacen.leer('verificacion'); // { identificador, config, participante, declarados, ronda, rondas: [...] }
  const guardar = () => almacen.guardar('verificacion', estado);

  // ---------- Carga de la sala ----------
  function crearEstado(sala) {
    return {
      identificador: sala.identificador, config: sala.config, participante: '', declarados: '', ronda: 0,
      rondas: sala.config.letras.map(() => ({ respuestas: {}, marcas: {}, inicio: '', cierre: '', fin: '' }))
    };
  }

  function cargarDesdeCodigo(evento) {
    evento.preventDefault();
    const resultado = Stop.codigoSala.leer($('entrada-codigo').value);
    if (!resultado.ok) { $('mensaje-carga').textContent = resultado.error; return; }
    estado = crearEstado({ identificador: resultado.identificador, config: resultado.config });
    guardar();
    pintar();
  }

  // ---------- Cálculos ----------
  function calcularRonda(indice) {
    const r = estado.rondas[indice];
    const reglas = estado.config.reglas;
    const bruto = Stop.puntuacion.puntosRonda(estado.config.categorias, r.respuestas, r.marcas, reglas);
    const exceso = Stop.puntuacion.excesoSegundos(Stop.tiempo.aSegundos(r.fin), Stop.tiempo.aSegundos(r.cierre), reglas.gracia);
    const penalizacion = Stop.puntuacion.penalizacion(exceso, reglas.penalizacion);
    return { bruto, exceso, penalizacion, neto: Math.max(0, bruto - penalizacion) };
  }

  function totalAuditado() {
    return estado.rondas.reduce((suma, _ronda, indice) => suma + calcularRonda(indice).neto, 0);
  }

  // ---------- Pintado ----------
  const referencias = {}; // elementos que se actualizan sin reconstruir los campos

  function pintarPestanas() {
    const grupo = $('pestanas-rondas');
    vaciar(grupo);
    estado.config.letras.forEach((letra, indice) => {
      grupo.append(crear('button', {
        clase: 'chip', type: 'button', texto: 'Ronda ' + (indice + 1) + ' · ' + letra,
        'aria-pressed': String(indice === estado.ronda),
        enClick: () => { estado.ronda = indice; guardar(); pintarPestanas(); pintarRonda(); }
      }));
    });
  }

  function pintarRonda() {
    const r = estado.rondas[estado.ronda];
    const reglas = estado.config.reglas;
    const letra = estado.config.letras[estado.ronda];
    $('titulo-palabras').textContent = 'Ronda ' + (estado.ronda + 1) + ' · letra ' + letra + ': reescribe y juzga';
    const filas = $('filas-palabras');
    vaciar(filas);
    referencias.puntosPalabra = {};

    estado.config.categorias.forEach((id) => {
      const entrada = crear('input', {
        type: 'text', maxlength: '40', autocomplete: 'off', value: r.respuestas[id] || '',
        'aria-label': Stop.categorias.nombrePorId(id),
        enInput: (evento) => { r.respuestas[id] = evento.target.value; guardar(); recalcular(); pintarMarcas(id); }
      });
      const marcas = crear('div', { clase: 'marcas', role: 'group', 'aria-label': 'Juicio de ' + Stop.categorias.nombrePorId(id) });
      referencias['marcas-' + id] = marcas;
      const puntos = crear('span', { clase: 'puntos' });
      referencias.puntosPalabra[id] = puntos;
      filas.append(crear('div', { clase: 'fila-verificar' },
        crear('span', { clase: 'etiqueta', texto: Stop.categorias.nombrePorId(id) }), entrada, marcas, puntos));
      pintarMarcas(id);
    });

    $('entrada-inicio').value = r.inicio;
    $('entrada-cierre').value = r.cierre;
    $('entrada-fin').value = r.fin;
    recalcular();
  }

  function pintarMarcas(id) {
    const r = estado.rondas[estado.ronda];
    const contenedor = referencias['marcas-' + id];
    const vacia = !(r.respuestas[id] || '').trim();
    vaciar(contenedor);
    Stop.puntuacion.MARCAS.forEach((marca) => {
      contenedor.append(crear('button', {
        clase: 'marca marca--' + marca, type: 'button', texto: ETIQUETAS_MARCA[marca], disabled: vacia,
        'aria-pressed': String((vacia ? 'invalida' : r.marcas[id]) === marca),
        enClick: () => { r.marcas[id] = marca; guardar(); pintarMarcas(id); recalcular(); }
      }));
    });
  }

  function recalcular() {
    const r = estado.rondas[estado.ronda];
    const reglas = estado.config.reglas;
    estado.config.categorias.forEach((id) => {
      referencias.puntosPalabra[id].textContent = String(Stop.puntuacion.puntosPalabra(r.respuestas[id], r.marcas[id], reglas));
    });
    const calculo = calcularRonda(estado.ronda);
    const hayTiempos = Stop.tiempo.aSegundos(r.fin) !== null && Stop.tiempo.aSegundos(r.cierre) !== null;
    $('exceso').textContent = hayTiempos ? calculo.exceso + ' s' : 'Falta una hora';
    $('penalizacion').textContent = '-' + calculo.penalizacion + ' pts';
    $('total-ronda').textContent = calculo.neto + ' pts';
    $('aviso-tiempo').textContent = 'Gracia: ' + reglas.gracia + ' s · Penalización: ' + reglas.penalizacion + ' pts por segundo';

    const total = totalAuditado();
    $('total-auditado').textContent = total + ' pts';
    const declarados = Number(estado.declarados);
    const comparacion = $('comparacion');
    if (estado.declarados === '' || Number.isNaN(declarados)) comparacion.textContent = 'Anota los puntos que declara el jugador para compararlos.';
    else if (declarados === total) comparacion.textContent = 'Coincide con lo declarado: la victoria se confirma.';
    else comparacion.textContent = 'Diferencia de ' + Math.abs(declarados - total) + ' pts con lo declarado. Revisa al siguiente jugador si baja del segundo lugar.';
  }

  function pintar() {
    const hay = !!(estado && estado.config);
    $('pantalla-carga').hidden = hay;
    $('pantalla-verificacion').hidden = !hay;
    if (!hay) return;
    $('sala-verificada').textContent = 'Sala ' + estado.identificador;
    $('entrada-participante').value = estado.participante;
    $('entrada-declarados').value = estado.declarados;
    pintarPestanas();
    pintarRonda();
  }

  function reiniciar() {
    if (!window.confirm('Se borrará lo anotado en esta verificación. ¿Continuar?')) return;
    almacen.borrar('verificacion');
    estado = null;
    $('mensaje-carga').textContent = '';
    pintar();
  }

  // ---------- Arranque ----------
  function iniciar() {
    Stop.barra.montar('Verificación de victoria');
    $('formulario-carga').addEventListener('submit', cargarDesdeCodigo);
    $('boton-reiniciar').addEventListener('click', reiniciar);
    $('entrada-participante').addEventListener('input', (evento) => { estado.participante = evento.target.value.slice(0, 20); guardar(); });
    $('entrada-declarados').addEventListener('input', (evento) => { estado.declarados = evento.target.value; guardar(); recalcular(); });
    [['inicio', 'entrada-inicio'], ['cierre', 'entrada-cierre'], ['fin', 'entrada-fin']].forEach(([campo, id]) => {
      $(id).addEventListener('input', (evento) => { estado.rondas[estado.ronda][campo] = evento.target.value; guardar(); recalcular(); });
    });

    if (!estado) {
      const sala = almacen.leer('sala'); // si este navegador generó la sala, se usa directamente
      if (sala && sala.config) { estado = crearEstado(sala); guardar(); }
    }
    pintar();
  }

  iniciar();
})();
