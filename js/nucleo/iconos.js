/* iconos.js · Iconos SVG inline (heredan el color con currentColor; todos con aria-label) */
window.Stop = window.Stop || {};

Stop.iconos = (function () {
  const TRAZOS = {
    ayuda: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    luna: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    copiar: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    enlace: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    siguiente: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    reproducir: '<path d="M6 4l14 8-14 8z"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    trofeo: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/>',
    pantalla: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    celular: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M12 18h.01"/>',
    parada: '<path d="M8 2h8l6 6v8l-6 6H8l-6-6V8z"/>'
  };

  // Devuelve un elemento <svg> listo para insertar
  function crear(nombre, etiqueta, tamano = 22) {
    const plantilla = document.createElement('template');
    const relleno = nombre === 'parada' ? 'currentColor' : 'none';
    plantilla.innerHTML =
      '<svg width="' + tamano + '" height="' + tamano + '" viewBox="0 0 24 24" fill="' + relleno +
      '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
      'role="img" aria-label="' + etiqueta + '">' + TRAZOS[nombre] + '</svg>';
    return plantilla.content.firstChild;
  }

  // Logo de la app (usa el acento y el texto de contraste del tema)
  function crearLogo(tamano = 28) {
    const plantilla = document.createElement('template');
    plantilla.innerHTML =
      '<svg width="' + tamano + '" height="' + tamano + '" viewBox="0 0 40 40" role="img" aria-label="Icono de Stop">' +
      '<path class="logo-forma" d="M13 3h14l10 10v14L27 37H13L3 27V13z"/>' +
      '<text class="logo-texto" x="20" y="26" text-anchor="middle" font-size="18" font-weight="800" ' +
      'font-family="system-ui, sans-serif">S</text></svg>';
    return plantilla.content.firstChild;
  }

  return { crear, crearLogo };
})();
