/* categorias.js · Catálogo de categorías y niveles de dificultad */
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

  const ids = CATALOGO.map((categoria) => categoria.id);

  function esValida(id) { return ids.includes(id); }

  function nombrePorId(id) {
    const categoria = CATALOGO.find((elemento) => elemento.id === id);
    return categoria ? categoria.nombre : id;
  }

  return { CATALOGO, NIVELES, esValida, nombrePorId };
})();
