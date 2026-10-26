/* codigo-sala.js · Genera, valida y lee el código de sala.
   El código solo lleva lo que necesita el jugador (rondas, categorías, con sus nombres si son propias, y puntos). Las letras
   NO viajan en él: las guarda únicamente el anfitrión. Es corto, no distingue mayúsculas y
   evita caracteres confusos (sin O, I, L ni U). Los 2 últimos caracteres detectan errores. */
window.Stop = window.Stop || {};

Stop.codigoSala = (function () {
  const VERSION = 1;
  const DIFICULTADES = ['inicial', 'medio', 'dificil', 'personalizada'];
  const REGLAS_POR_DEFECTO = { unica: 100, repetida: 50, invalida: 0, penalizacion: 2, gracia: 5 };
  const ALFABETO_CODIGO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // 32 símbolos = 5 bits cada uno
  const LARGO_RESUMEN = 2;

  // ---------- Empaquetado de bits en símbolos de 5 bits ----------
  function crearEscritor() {
    const bits = [];
    return {
      poner(valor, cantidad) {
        for (let i = cantidad - 1; i >= 0; i--) bits.push((valor >> i) & 1);
      },
      simbolos() {
        const salida = [];
        for (let i = 0; i < bits.length; i += 5) {
          let simbolo = 0;
          for (let j = 0; j < 5; j++) simbolo = (simbolo << 1) | (bits[i + j] || 0);
          salida.push(simbolo);
        }
        return salida;
      }
    };
  }

  function crearLector(simbolos) {
    let posicion = 0;
    return {
      tomar(cantidad) {
        if (posicion + cantidad > simbolos.length * 5) throw new Error('Código incompleto');
        let valor = 0;
        for (let i = 0; i < cantidad; i++) {
          valor = (valor << 1) | ((simbolos[Math.floor(posicion / 5)] >> (4 - posicion % 5)) & 1);
          posicion += 1;
        }
        return valor;
      }
    };
  }

  // Resumen de 10 bits (2 caracteres) con FNV-1a: detecta códigos mal escritos
  function resumen(simbolos) {
    let valor = 2166136261;
    simbolos.forEach((simbolo) => {
      valor ^= simbolo;
      valor = Math.imul(valor, 16777619);
    });
    valor = (valor ^ (valor >>> 10) ^ (valor >>> 20)) & 1023;
    return [valor >> 5, valor & 31];
  }

  const aTexto = (simbolos) => simbolos.map((simbolo) => ALFABETO_CODIGO[simbolo]).join('');

  // ---------- Validación ----------
  const entero = (valor, minimo, maximo) => Number.isInteger(valor) && valor >= minimo && valor <= maximo;

  // Datos que viajan en el código
  function validarAjustes(config) {
    if (!config || typeof config !== 'object') return 'Configuración vacía.';
    if (!DIFICULTADES.includes(config.dificultad)) return 'Dificultad no válida.';
    if (!entero(config.rondas, 1, Stop.letras.MAXIMO_RONDAS)) return 'Las rondas deben estar entre 1 y ' + Stop.letras.MAXIMO_RONDAS + '.';
    const categorias = config.categorias;
    if (!Array.isArray(categorias) || categorias.length < 1) return 'Elige al menos una categoría.';
    if (!categorias.every(Stop.categorias.esValida) || new Set(categorias).size !== categorias.length) return 'Las categorías no son válidas.';
    if (categorias.filter(Stop.categorias.esPropia).length > Stop.categorias.MAXIMO_PROPIAS) return 'Puedes añadir hasta ' + Stop.categorias.MAXIMO_PROPIAS + ' categorías propias.';
    if (!mismoOrden(categorias, Stop.categorias.ordenar(categorias))) return 'Las categorías van primero las del catálogo y después las propias.';
    const reglas = config.reglas || {};
    if (![reglas.unica, reglas.repetida, reglas.invalida].every((valor) => entero(valor, 0, 1000))) return 'Los puntos por palabra deben estar entre 0 y 1000.';
    if (!entero(reglas.penalizacion, 0, 100)) return 'La penalización debe estar entre 0 y 100.';
    if (!entero(reglas.gracia, 0, 60)) return 'La gracia debe estar entre 0 y 60 segundos.';
    return null;
  }

  // Validación completa para iniciar la partida (añade las letras, que solo conoce el anfitrión)
  function validar(config) {
    const error = validarAjustes(config);
    if (error) return error;
    const letras = config.letras;
    if (!Array.isArray(letras) || letras.length !== config.rondas) return 'Elige una letra por ronda (' + config.rondas + ').';
    if (!letras.every(Stop.letras.esValida) || new Set(letras).size !== letras.length) return 'Las letras no son válidas o están repetidas.';
    return null;
  }

  const mismoOrden = (a, b) => a.length === b.length && a.every((valor, i) => valor === b[i]);

  // ---------- Crear ----------
  // Orden de los datos: versión, dificultad, rondas, categorías y reglas.
  // Si las categorías son las del nivel o las reglas son las normales, solo se marca con 1 bit.
  function crear(config) {
    const error = validarAjustes(config);
    if (error) return { ok: false, error };
    const escritor = crearEscritor();
    escritor.poner(VERSION, 2);
    escritor.poner(DIFICULTADES.indexOf(config.dificultad), 2);
    escritor.poner(config.rondas - 1, 4);

    const propias = config.categorias.filter(Stop.categorias.esPropia);
    const delNivel = !propias.length && mismoOrden(config.categorias, Stop.categorias.NIVELES[config.dificultad]);
    escritor.poner(delNivel ? 1 : 0, 1);
    if (!delNivel) {
      let mascara = 0;
      Stop.categorias.CATALOGO.forEach((categoria, indice) => {
        if (config.categorias.includes(categoria.id)) mascara |= 1 << indice;
      });
      escritor.poner(mascara, Stop.categorias.CATALOGO.length);
      escritor.poner(propias.length, 2); // hasta 3 categorías propias, cada una con su nombre
      propias.forEach((id) => {
        const bytes = Array.from(new TextEncoder().encode(Stop.categorias.nombrePorId(id)));
        escritor.poner(bytes.length, 5);
        bytes.forEach((byte) => escritor.poner(byte, 8));
      });
    }

    const reglas = config.reglas;
    const normales = Object.keys(REGLAS_POR_DEFECTO).every((clave) => reglas[clave] === REGLAS_POR_DEFECTO[clave]);
    escritor.poner(normales ? 1 : 0, 1);
    if (!normales) {
      escritor.poner(reglas.unica, 10);
      escritor.poner(reglas.repetida, 10);
      escritor.poner(reglas.invalida, 10);
      escritor.poner(reglas.penalizacion, 7);
      escritor.poner(reglas.gracia, 6);
    }

    const simbolos = escritor.simbolos();
    return { ok: true, codigo: aTexto(simbolos) + aTexto(resumen(simbolos)) };
  }

  // ---------- Leer ----------
  // Acepta el código con espacios o guiones, en mayúsculas o minúsculas, o un enlace con "#"
  function leer(texto) {
    let codigo = String(texto || '').trim();
    if (codigo.includes('#')) codigo = codigo.slice(codigo.lastIndexOf('#') + 1);
    codigo = codigo.toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
    if (codigo.length < LARGO_RESUMEN + 2) return { ok: false, error: 'El código es demasiado corto.' };
    const simbolos = Array.from(codigo, (caracter) => ALFABETO_CODIGO.indexOf(caracter));
    if (simbolos.includes(-1)) return { ok: false, error: 'El código tiene caracteres que no existen.' };
    try {
      const datos = simbolos.slice(0, -LARGO_RESUMEN);
      const esperado = resumen(datos);
      if (simbolos[simbolos.length - 2] !== esperado[0] || simbolos[simbolos.length - 1] !== esperado[1]) {
        return { ok: false, error: 'El código está incompleto o alterado.' };
      }
      const lector = crearLector(datos);
      if (lector.tomar(2) !== VERSION) return { ok: false, error: 'El código no es compatible.' };
      const dificultad = DIFICULTADES[lector.tomar(2)];
      const rondas = lector.tomar(4) + 1;

      let categorias;
      if (lector.tomar(1) === 1) {
        categorias = Stop.categorias.NIVELES[dificultad].slice();
      } else {
        const mascara = lector.tomar(Stop.categorias.CATALOGO.length);
        categorias = Stop.categorias.CATALOGO.filter((_categoria, indice) => mascara & (1 << indice)).map((categoria) => categoria.id);
        const cantidadPropias = lector.tomar(2);
        for (let i = 0; i < cantidadPropias; i++) {
          const largo = lector.tomar(5);
          const bytes = Array.from({ length: largo }, () => lector.tomar(8));
          categorias.push(Stop.categorias.crearId(new TextDecoder().decode(Uint8Array.from(bytes))));
        }
      }

      let reglas = Object.assign({}, REGLAS_POR_DEFECTO);
      if (lector.tomar(1) === 0) {
        reglas = { unica: lector.tomar(10), repetida: lector.tomar(10), invalida: lector.tomar(10), penalizacion: lector.tomar(7), gracia: lector.tomar(6) };
      }

      const config = { dificultad, rondas, categorias, reglas, letras: [] };
      const error = validarAjustes(config);
      if (error) return { ok: false, error };
      return { ok: true, codigo, config };
    } catch (error) {
      return { ok: false, error: 'El código no se pudo leer.' };
    }
  }

  // Para mostrarlo en grupos de 4 caracteres (los espacios se ignoran al leer)
  function formatear(codigo) {
    return String(codigo || '').replace(/(.{4})(?=.)/g, '$1 ');
  }

  return { crear, leer, validar, validarAjustes, formatear };
})();
