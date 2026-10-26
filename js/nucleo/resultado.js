/* resultado.js · Resultado que el jugador envía al anfitrión para la verificación automática.
   Lleva el código de la sala, el nombre, los puntos que declara y, por ronda, su tiempo y sus
   palabras (en el orden de las categorías). Se copia y se pega como un texto con resumen de error. */
window.Stop = window.Stop || {};

Stop.resultado = (function () {
  const PREFIJO = 'STOP';
  const VERSION = 1;
  const MAXIMO_PALABRA = 40;
  const MAXIMO_CATEGORIAS = 16;
  const MAXIMO_NOMBRE = 20;

  function aBase64Url(texto) {
    let binario = '';
    new TextEncoder().encode(texto).forEach((byte) => { binario += String.fromCharCode(byte); });
    return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function deBase64Url(texto) {
    const normal = texto.replace(/-/g, '+').replace(/_/g, '/');
    const binario = atob(normal + '='.repeat((4 - normal.length % 4) % 4));
    return new TextDecoder().decode(Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0)));
  }

  // Resumen de 6 caracteres (FNV-1a): detecta resultados incompletos o alterados
  function resumen(texto) {
    let valor = 2166136261;
    for (let i = 0; i < texto.length; i++) {
      valor ^= texto.charCodeAt(i);
      valor = Math.imul(valor, 16777619);
    }
    return (valor >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(-6);
  }

  // datos: { codigo, nombre, puntos, rondas: [{ tiempo: segundos | null, palabras: [texto] }] }
  function crear(datos) {
    const carga = JSON.stringify({
      v: VERSION, c: datos.codigo, n: datos.nombre, p: datos.puntos,
      r: datos.rondas.map((ronda) => [ronda.tiempo, ronda.palabras])
    });
    return PREFIJO + '.' + aBase64Url(carga) + '.' + resumen(carga);
  }

  const entero = (valor, minimo, maximo) => Number.isInteger(valor) && valor >= minimo && valor <= maximo;

  // Acepta el texto con saltos de línea o espacios (al copiar y pegar suelen colarse)
  function leer(texto) {
    const partes = String(texto || '').replace(/\s+/g, '').split('.');
    if (partes.length !== 3 || partes[0].toUpperCase() !== PREFIJO) return { ok: false, error: 'Eso no parece un resultado de Stop.' };
    try {
      const carga = deBase64Url(partes[1]);
      if (resumen(carga) !== partes[2].toUpperCase()) return { ok: false, error: 'El resultado está incompleto o alterado.' };
      const objeto = JSON.parse(carga);
      const nombre = String(objeto.n || '').replace(/[\u0000-\u001f]/g, ' ').trim();
      const valido = objeto.v === VERSION && typeof objeto.c === 'string' && nombre !== '' && nombre.length <= MAXIMO_NOMBRE
        && entero(objeto.p, 0, 99999) && Array.isArray(objeto.r) && entero(objeto.r.length, 1, 12)
        && objeto.r.every((ronda) => Array.isArray(ronda) && ronda.length === 2 && (ronda[0] === null || entero(ronda[0], 0, 86400))
          && Array.isArray(ronda[1]) && ronda[1].length <= MAXIMO_CATEGORIAS
          && ronda[1].every((palabra) => typeof palabra === 'string' && palabra.length <= MAXIMO_PALABRA));
      if (!valido) return { ok: false, error: 'El resultado no tiene el formato esperado.' };
      return { ok: true, datos: { codigo: objeto.c, nombre, puntos: objeto.p, rondas: objeto.r.map((ronda) => ({ tiempo: ronda[0], palabras: ronda[1] })) } };
    } catch (error) {
      return { ok: false, error: 'El resultado no se pudo leer.' };
    }
  }

  return { crear, leer };
})();
