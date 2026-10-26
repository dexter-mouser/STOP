/* tiempo.js · Hora con segundos, conversiones y reloj en pantalla */
window.Stop = window.Stop || {};

Stop.tiempo = (function () {
  const dosDigitos = (numero) => String(numero).padStart(2, '0');

  // Milisegundos -> "HH:MM:SS" (o guiones si no hay valor)
  function formatear(milisegundos) {
    if (milisegundos === null || milisegundos === undefined) return '--:--:--';
    const fecha = new Date(milisegundos);
    return dosDigitos(fecha.getHours()) + ':' + dosDigitos(fecha.getMinutes()) + ':' + dosDigitos(fecha.getSeconds());
  }

  // "HH:MM:SS" -> segundos del día (o null si el formato no es válido)
  function aSegundos(texto) {
    const coincidencia = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(String(texto || '').trim());
    if (!coincidencia) return null;
    const horas = Number(coincidencia[1]);
    const minutos = Number(coincidencia[2]);
    const segundos = Number(coincidencia[3]);
    if (horas > 23 || minutos > 59 || segundos > 59) return null;
    return horas * 3600 + minutos * 60 + segundos;
  }

  // Muestra la hora actual en un elemento. Se revisa 4 veces por segundo para que el cambio de
  // segundo se vea a tiempo (con un intervalo de 1 s el reloj se atrasaría hasta un segundo)
  function iniciarReloj(elemento) {
    const pintar = () => { elemento.textContent = formatear(Date.now()); };
    pintar();
    const identificador = setInterval(pintar, 250);
    return () => clearInterval(identificador);
  }

  // "MM:SS" o "H:MM:SS" -> segundos (o null si el formato no es válido)
  function aDuracion(texto) {
    const limpio = String(texto || '').trim();
    let coincidencia = /^(\d{1,3}):([0-5]\d)$/.exec(limpio);
    if (coincidencia) return Number(coincidencia[1]) * 60 + Number(coincidencia[2]);
    coincidencia = /^(\d{1,2}):([0-5]\d):([0-5]\d)$/.exec(limpio);
    return coincidencia ? Number(coincidencia[1]) * 3600 + Number(coincidencia[2]) * 60 + Number(coincidencia[3]) : null;
  }

  // Segundos enteros transcurridos entre dos instantes en milisegundos (no depende de la hora del reloj)
  function segundosEntre(inicio, fin) {
    return Math.max(0, Math.floor((fin - inicio) / 1000));
  }

  // Milisegundos -> "MM:SS" (para cronómetros)
  function duracion(milisegundos) {
    const total = Math.max(0, Math.floor(milisegundos / 1000));
    return dosDigitos(Math.floor(total / 60)) + ':' + dosDigitos(total % 60);
  }

  return { formatear, aSegundos, aDuracion, segundosEntre, duracion, iniciarReloj };
})();
