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

  // Segundos de más del jugador respecto al tiempo oficial de la ronda, descontando el margen.
  // Ambos tiempos son duraciones (desde que se inició la ronda), así que no dependen de los relojes.
  function excesoSegundos(duracionJugador, duracionOficial, gracia) {
    if (duracionJugador === null || duracionOficial === null) return 0;
    return Math.max(0, duracionJugador - duracionOficial - gracia);
  }

  function penalizacion(exceso, porSegundo) { return exceso * porSegundo; }

  // Valor en puntos de una marca según las reglas de la sala
  function valorDeMarca(marca, reglas) {
    if (marca === 'unica') return reglas.unica;
    if (marca === 'repetida') return reglas.repetida;
    if (marca === 'invalida') return reglas.invalida;
    return 0;
  }

  // Sugiere la marca de cada palabra de una categoría: vacía o con otra letra = inválida;
  // igual a la de otro jugador = repetida; en otro caso = única.
  // entradas: { idJugador: { palabra } }  ->  { idJugador: marca }
  function sugerirMarcas(entradas, letra) {
    const conteo = {};
    Object.values(entradas).forEach((entrada) => {
      const clave = Stop.letras.normalizar(entrada.palabra);
      if (clave) conteo[clave] = (conteo[clave] || 0) + 1;
    });
    const marcas = {};
    Object.keys(entradas).forEach((id) => {
      const palabra = entradas[id].palabra;
      const clave = Stop.letras.normalizar(palabra);
      if (!clave || !Stop.letras.empiezaCon(palabra, letra)) marcas[id] = 'invalida';
      else marcas[id] = conteo[clave] > 1 ? 'repetida' : 'unica';
    });
    return marcas;
  }

  // Busca una palabra en el registro de una categoría: [{ texto, marca, valor }]. Devuelve el registro o null
  function buscarEnRegistro(registro, palabra) {
    const clave = Stop.letras.normalizar(palabra);
    if (!clave) return null;
    return (registro || []).find((anotada) => Stop.letras.normalizar(anotada.texto) === clave) || null;
  }

  return { MARCAS, puntosPalabra, puntosRonda, excesoSegundos, penalizacion, valorDeMarca, sugerirMarcas, buscarEnRegistro };
})();
