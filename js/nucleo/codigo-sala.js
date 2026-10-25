/* codigo-sala.js · Genera, valida y lee el código de sala (lleva toda la configuración) */
window.Stop = window.Stop || {};

Stop.codigoSala = (function () {
  const VERSION = '1';
  const DIFICULTADES = ['inicial', 'medio', 'dificil', 'personalizada'];

  // ---------- Codificación ----------
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

  // Resumen de 4 caracteres (FNV-1a): detecta códigos mal escritos y sirve de identificador
  function resumen(texto) {
    let valor = 2166136261;
    for (let i = 0; i < texto.length; i++) {
      valor ^= texto.charCodeAt(i);
      valor = Math.imul(valor, 16777619);
    }
    return (valor >>> 0).toString(36).toUpperCase().padStart(4, '0').slice(-4);
  }

  // ---------- Validación ----------
  const entero = (valor, minimo, maximo) => Number.isInteger(valor) && valor >= minimo && valor <= maximo;

  function validar(config) {
    if (!config || typeof config !== 'object') return 'Configuración vacía.';
    if (!DIFICULTADES.includes(config.dificultad)) return 'Dificultad no válida.';
    if (!entero(config.rondas, 1, Stop.letras.MAXIMO_RONDAS)) return 'Las rondas deben estar entre 1 y ' + Stop.letras.MAXIMO_RONDAS + '.';
    const letras = config.letras;
    if (!Array.isArray(letras) || letras.length !== config.rondas) return 'Elige una letra por ronda (' + config.rondas + ').';
    if (!letras.every(Stop.letras.esValida) || new Set(letras).size !== letras.length) return 'Las letras no son válidas o están repetidas.';
    const categorias = config.categorias;
    if (!Array.isArray(categorias) || categorias.length < 1) return 'Elige al menos una categoría.';
    if (!categorias.every(Stop.categorias.esValida) || new Set(categorias).size !== categorias.length) return 'Las categorías no son válidas.';
    const reglas = config.reglas || {};
    if (![reglas.unica, reglas.repetida, reglas.invalida].every((valor) => entero(valor, 0, 1000))) return 'Los puntos por palabra deben estar entre 0 y 1000.';
    if (!entero(reglas.penalizacion, 0, 100)) return 'La penalización debe estar entre 0 y 100.';
    if (!entero(reglas.gracia, 0, 60)) return 'La gracia debe estar entre 0 y 60 segundos.';
    return null;
  }

  function limpiarNombre(nombre) {
    return String(nombre || '').replace(/[|]/g, '').trim().slice(0, 20) || 'Sala';
  }

  // ---------- Crear ----------
  function crear(config) {
    const error = validar(config);
    if (error) return { ok: false, error };
    const reglas = config.reglas;
    const carga = [
      VERSION, limpiarNombre(config.nombre), config.dificultad, config.rondas, config.letras.join(''),
      config.categorias.join('.'), reglas.unica, reglas.repetida, reglas.invalida, reglas.penalizacion, reglas.gracia
    ].join('|');
    const identificador = resumen(carga);
    return { ok: true, codigo: aBase64Url(carga) + '.' + identificador, identificador };
  }

  // ---------- Leer ----------
  // Acepta el código solo o un enlace que lo lleve después de "#"
  function leer(texto) {
    let codigo = String(texto || '').trim();
    if (codigo.includes('#')) codigo = codigo.slice(codigo.lastIndexOf('#') + 1);
    const punto = codigo.lastIndexOf('.');
    if (punto < 1) return { ok: false, error: 'El código no tiene el formato correcto.' };
    try {
      const carga = deBase64Url(codigo.slice(0, punto));
      const identificador = codigo.slice(punto + 1).toUpperCase();
      if (resumen(carga) !== identificador) return { ok: false, error: 'El código está incompleto o alterado.' };
      const campos = carga.split('|');
      if (campos.length !== 11 || campos[0] !== VERSION) return { ok: false, error: 'El código no es compatible.' };
      const config = {
        nombre: limpiarNombre(campos[1]),
        dificultad: campos[2],
        rondas: Number(campos[3]),
        letras: campos[4].split(''),
        categorias: campos[5].split('.'),
        reglas: {
          unica: Number(campos[6]), repetida: Number(campos[7]), invalida: Number(campos[8]),
          penalizacion: Number(campos[9]), gracia: Number(campos[10])
        }
      };
      const error = validar(config);
      if (error) return { ok: false, error };
      return { ok: true, codigo: codigo, identificador, config };
    } catch (error) {
      return { ok: false, error: 'El código no se pudo leer.' };
    }
  }

  return { crear, leer, validar };
})();
