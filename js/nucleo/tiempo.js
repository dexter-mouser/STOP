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

  // Muestra la hora actual en un elemento y la actualiza cada segundo
  function iniciarReloj(elemento) {
    const pintar = () => { elemento.textContent = formatear(Date.now()); };
    pintar();
    const identificador = setInterval(pintar, 1000);
    return () => clearInterval(identificador);
  }

  // Milisegundos -> segundos transcurridos desde la medianoche
  function segundosDelDia(milisegundos) {
    const fecha = new Date(milisegundos);
    return fecha.getHours() * 3600 + fecha.getMinutes() * 60 + fecha.getSeconds();
  }

  // Milisegundos -> "MM:SS" (para cronómetros)
  function duracion(milisegundos) {
    const total = Math.max(0, Math.floor(milisegundos / 1000));
    return dosDigitos(Math.floor(total / 60)) + ':' + dosDigitos(total % 60);
  }

  return { formatear, aSegundos, segundosDelDia, duracion, iniciarReloj };
})();
