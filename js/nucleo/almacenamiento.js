/* almacenamiento.js · Acceso seguro a localStorage con prefijo "stop:" */
window.Stop = window.Stop || {};

Stop.almacenamiento = (function () {
  const PREFIJO = 'stop:';

  // Lee un valor guardado; si no existe o está dañado, devuelve el valor por defecto
  function leer(clave, valorPorDefecto = null) {
    try {
      const texto = localStorage.getItem(PREFIJO + clave);
      return texto === null ? valorPorDefecto : JSON.parse(texto);
    } catch (error) {
      return valorPorDefecto;
    }
  }

  // Guarda un valor; devuelve false si el navegador lo impide
  function guardar(clave, valor) {
    try {
      localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
      return true;
    } catch (error) {
      return false;
    }
  }

  function borrar(clave) {
    try { localStorage.removeItem(PREFIJO + clave); } catch (error) { /* sin acción */ }
  }

  return { leer, guardar, borrar };
})();
