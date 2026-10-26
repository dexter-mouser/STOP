/* portapapeles.js · Copiar y pegar texto (con alternativa para navegadores sin acceso directo) */
window.Stop = window.Stop || {};

Stop.portapapeles = (function () {
  // Copia el texto; devuelve true si se logró
  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (error) { /* se prueba el método alternativo */ }
    try {
      const area = document.createElement('textarea');
      area.value = texto;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      const copiado = document.execCommand('copy');
      area.remove();
      return copiado;
    } catch (error) {
      return false;
    }
  }

  // Devuelve el texto del portapapeles, o null si el navegador no lo permite
  async function pegar() {
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      return null;
    }
  }

  return { copiar, pegar };
})();
