/* tono.js · Tema claro/oscuro, color de acento y contraste dinámico.
   Se carga en el <head> para aplicar todo antes de pintar la página. */
window.Stop = window.Stop || {};

Stop.tono = (function () {
  const ACENTOS = [
    { id: 'lima', nombre: 'lima', color: '#A3E635' },
    { id: 'cian', nombre: 'cian', color: '#22D3EE' },
    { id: 'rosa', nombre: 'rosa', color: '#F472B6' },
    { id: 'lila', nombre: 'lila', color: '#A78BFA' },
    { id: 'durazno', nombre: 'durazno', color: '#FBBF24' }
  ];
  const ACENTO_POR_DEFECTO = '#A78BFA';
  const raiz = document.documentElement;
  const consultaOscuro = window.matchMedia('(prefers-color-scheme: dark)');

  // Texto negro o blanco según la luminancia relativa del acento (WCAG)
  function colorSobre(colorHexadecimal) {
    const numero = parseInt(colorHexadecimal.slice(1), 16);
    const canales = [16, 8, 0].map((desplazamiento) => {
      const valor = (numero >> desplazamiento & 255) / 255;
      return valor <= 0.03928 ? valor / 12.92 : Math.pow((valor + 0.055) / 1.055, 2.4);
    });
    const luminancia = 0.2126 * canales[0] + 0.7152 * canales[1] + 0.0722 * canales[2];
    return luminancia > 0.179 ? '#111111' : '#FFFFFF';
  }

  function acentoActual() {
    return raiz.style.getPropertyValue('--acento').trim().toUpperCase() || ACENTO_POR_DEFECTO;
  }

  function aplicarAcento(color, guardar = true) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) return;
    raiz.style.setProperty('--acento', color);
    raiz.style.setProperty('--sobre-acento', colorSobre(color));
    if (guardar) Stop.almacenamiento.guardar('acento', color);
    document.dispatchEvent(new CustomEvent('acentocambiado', { detail: color }));
  }

  function temaActual() {
    return raiz.dataset.tema || (consultaOscuro.matches ? 'oscuro' : 'claro');
  }

  function alternarTema() {
    const nuevo = temaActual() === 'oscuro' ? 'claro' : 'oscuro';
    raiz.dataset.tema = nuevo;
    Stop.almacenamiento.guardar('tema', nuevo);
    document.dispatchEvent(new CustomEvent('temacambiado', { detail: nuevo }));
  }

  // Aplica lo guardado; sin tema guardado se sigue al sistema
  function iniciar() {
    const guardado = Stop.almacenamiento.leer('tema');
    if (guardado === 'claro' || guardado === 'oscuro') raiz.dataset.tema = guardado;
    const acento = Stop.almacenamiento.leer('acento');
    aplicarAcento(typeof acento === 'string' ? acento : ACENTO_POR_DEFECTO, false);
  }

  iniciar();
  return { ACENTOS, colorSobre, acentoActual, aplicarAcento, temaActual, alternarTema };
})();
