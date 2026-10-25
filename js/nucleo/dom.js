/* dom.js · Creación segura de elementos (el texto nunca se interpreta como HTML) */
window.Stop = window.Stop || {};

Stop.dom = (function () {
  // crear('button', { clase: 'boton', texto: 'Hola', enClick: manejador }, ...hijos)
  function crear(etiqueta, atributos = {}, ...hijos) {
    const nodo = document.createElement(etiqueta);
    Object.entries(atributos).forEach(([clave, valor]) => {
      if (valor === false || valor === null || valor === undefined) return;
      if (clave === 'clase') nodo.className = valor;
      else if (clave === 'texto') nodo.textContent = valor;
      else if (/^en[A-Z]/.test(clave)) nodo.addEventListener(clave.slice(2).toLowerCase(), valor);
      else nodo.setAttribute(clave, valor === true ? '' : valor);
    });
    hijos.flat().forEach((hijo) => { if (hijo !== null && hijo !== undefined) nodo.append(hijo); });
    return nodo;
  }

  function vaciar(nodo) { nodo.replaceChildren(); }

  return { crear, vaciar };
})();
