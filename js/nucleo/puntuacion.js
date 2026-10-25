/* puntuacion.js · Puntos por palabra y penalización por tiempo */
window.Stop = window.Stop || {};

Stop.puntuacion = (function () {
  const MARCAS = ['unica', 'repetida', 'invalida'];

  // Una palabra vacía siempre cuenta como inválida; sin marca vale 0
  function marcaEfectiva(palabra, marca) {
    if (!palabra || !String(palabra).trim()) return 'invalida';
    return MARCAS.includes(marca) ? marca : null;
  }

  function puntosPalabra(palabra, marca, reglas) {
    const efectiva = marcaEfectiva(palabra, marca);
    if (efectiva === 'unica') return reglas.unica;
    if (efectiva === 'repetida') return reglas.repetida;
    if (efectiva === 'invalida') return reglas.invalida;
    return 0;
  }

  function puntosRonda(categorias, respuestas, marcas, reglas) {
    return categorias.reduce((total, id) => total + puntosPalabra(respuestas[id], marcas[id], reglas), 0);
  }

  // Segundos fuera de ronda, descontando la gracia
  function excesoSegundos(finJugador, cierreOficial, gracia) {
    if (finJugador === null || cierreOficial === null) return 0;
    return Math.max(0, finJugador - cierreOficial - gracia);
  }

  function penalizacion(exceso, porSegundo) { return exceso * porSegundo; }

  return { MARCAS, puntosPalabra, puntosRonda, excesoSegundos, penalizacion };
})();
