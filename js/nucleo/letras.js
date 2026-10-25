/* letras.js · Listas de letras por dificultad y sorteo sin repetir */
window.Stop = window.Stop || {};

Stop.letras = (function () {
  const ALFABETO = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
  const INICIAL = 'ABCDEGLMNPRST'.split('');
  const MEDIO = INICIAL.concat('FHIJOUV'.split(''));
  const LISTAS = { inicial: INICIAL, medio: MEDIO, dificil: ALFABETO, personalizada: ALFABETO };
  const MAXIMO_RONDAS = 12;

  function listaPara(dificultad) { return LISTAS[dificultad] || ALFABETO; }
  function esValida(letra) { return ALFABETO.includes(letra); }

  // Sortea letras distintas de la lista de la dificultad (se puede excluir algunas)
  function sortear(dificultad, cantidad, excluidas = []) {
    const reserva = listaPara(dificultad).filter((letra) => !excluidas.includes(letra));
    for (let i = reserva.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [reserva[i], reserva[j]] = [reserva[j], reserva[i]];
    }
    return reserva.slice(0, Math.min(cantidad, reserva.length));
  }

  // ¿La palabra empieza con la letra? (ignora tildes pero respeta la Ñ)
  function empiezaCon(palabra, letra) {
    const base = String(palabra || '').trim().toUpperCase()
      .replace(/Ñ/g, '\u0001').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0001/g, 'Ñ');
    return base.charAt(0) === letra;
  }

  return { ALFABETO, MAXIMO_RONDAS, listaPara, esValida, sortear, empiezaCon };
})();
