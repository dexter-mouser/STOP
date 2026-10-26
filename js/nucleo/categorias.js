/* categorias.js · Catálogo de categorías, niveles de dificultad y categorías propias.
   Una categoría propia se identifica con "+" seguido de su nombre (por ejemplo "+Instrumento"). */
window.Stop = window.Stop || {};

Stop.categorias = (function () {
  const CATALOGO = [
    { id: 'nombre', nombre: 'Nombre' },
    { id: 'animal', nombre: 'Animal' },
    { id: 'pais', nombre: 'País' },
    { id: 'cosa', nombre: 'Cosa' },
    { id: 'color', nombre: 'Color' },
    { id: 'fruta', nombre: 'Fruta' },
    { id: 'profesion', nombre: 'Profesión' },
    { id: 'ciudad', nombre: 'Ciudad' },
    { id: 'marca', nombre: 'Marca' },
    { id: 'personaje', nombre: 'Personaje famoso' },
    { id: 'pelicula', nombre: 'Película' }
  ];

  const INICIAL = ['nombre', 'animal', 'pais', 'cosa', 'color'];
  const MEDIO = INICIAL.concat(['fruta', 'profesion', 'ciudad', 'marca']);
  const DIFICIL = MEDIO.concat(['personaje', 'pelicula']);
  const NIVELES = { inicial: INICIAL, medio: MEDIO, dificil: DIFICIL, personalizada: INICIAL };

  // Límites de las categorías propias (el código de sala admite hasta 3)
  const PREFIJO_PROPIA = '+';
  const MAXIMO_PROPIAS = 3;
  const MAXIMO_LETRAS_NOMBRE = 20;
  const MAXIMO_BYTES_NOMBRE = 31;

  const idsCatalogo = CATALOGO.map((categoria) => categoria.id);
  const esPropia = (id) => typeof id === 'string' && id.charAt(0) === PREFIJO_PROPIA;

  // Nombre sin espacios sobrantes ni caracteres de control, con largo limitado
  function limpiarNombre(texto) {
    let letras = Array.from(String(texto || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, MAXIMO_LETRAS_NOMBRE);
    while (new TextEncoder().encode(letras.join('')).length > MAXIMO_BYTES_NOMBRE) letras = letras.slice(0, -1);
    return letras.join('').trim();
  }

  function crearId(nombre) {
    const limpio = limpiarNombre(nombre);
    return limpio ? PREFIJO_PROPIA + limpio : null;
  }

  function esValida(id) {
    if (esPropia(id)) {
      const nombre = id.slice(1);
      return nombre !== '' && limpiarNombre(nombre) === nombre;
    }
    return idsCatalogo.includes(id);
  }

  function nombrePorId(id) {
    if (esPropia(id)) return id.slice(1);
    const categoria = CATALOGO.find((elemento) => elemento.id === id);
    return categoria ? categoria.nombre : id;
  }

  // Clave para comparar nombres sin tildes ni mayúsculas
  const clave = (texto) => String(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // ¿Ya existe una categoría con ese nombre (del catálogo o entre las propias)?
  function existeNombre(nombre, propias = []) {
    const buscada = clave(nombre);
    return CATALOGO.some((categoria) => clave(categoria.nombre) === buscada) || propias.some((propia) => clave(propia) === buscada);
  }

  // Orden canónico: primero las del catálogo (en su orden) y después las propias (en el que se añadieron)
  function ordenar(lista) {
    const delCatalogo = lista.filter((id) => !esPropia(id)).sort((a, b) => idsCatalogo.indexOf(a) - idsCatalogo.indexOf(b));
    return delCatalogo.concat(lista.filter(esPropia));
  }

  return { CATALOGO, NIVELES, MAXIMO_PROPIAS, MAXIMO_LETRAS_NOMBRE, limpiarNombre, crearId, esPropia, esValida, nombrePorId, existeNombre, ordenar };
})();
