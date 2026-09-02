/**
 * dataService.js
 * -----------------------------------------------------------------
 * Única puerta de entrada a los datos de la app.
 *
 * El resto del código (seatMap.js, booking.js, index.js) NUNCA debe
 * llamar a fetch() ni a localStorage directamente: siempre pasa por
 * las funciones de este archivo. Así, el día que haya un backend en
 * PHP/MySQL, solo hay que reescribir el INTERIOR de estas funciones
 * (para que hagan peticiones a la API real) sin tocar el resto del
 * proyecto.
 * -----------------------------------------------------------------
 */

const RUTA_JSON_VIAJES = "./data/viajes.json";
const LLAVE_RESERVAS = "combi-tepic-batanga:reservas";

// Guardamos el catálogo en memoria una vez que se carga, para no
// pedirlo con fetch cada vez que alguna otra parte del código lo necesite.
let catalogoEnMemoria = null;

/**
 * Carga el catálogo fijo del viaje (ruta, paradas, precio, capacidad,
 * horarios). Lo pide por fetch solo la primera vez; después reutiliza
 * lo que ya tiene en memoria.
 *
 * @returns {Promise<Object>} el catálogo, o null si falló la carga.
 */
export async function obtenerCatalogo() {
  if (catalogoEnMemoria) {
    return catalogoEnMemoria;
  }

  try {
    const respuesta = await fetch(RUTA_JSON_VIAJES);

    if (!respuesta.ok) {
      throw new Error(`El servidor respondió con estado ${respuesta.status}`);
    }

    catalogoEnMemoria = await respuesta.json();
    return catalogoEnMemoria;
  } catch (error) {
    console.error("No se pudo cargar el catálogo de viajes:", error);
    return null;
  }
}

/**
 * Da los horarios del día que corresponden (lunes a sábado, o domingo)
 * a partir de un objeto Date. No necesita async porque no toca fetch
 * ni localStorage, solo trabaja con datos que ya recibió.
 *
 * @param {Object} catalogo - el catálogo ya cargado con obtenerCatalogo()
 * @param {Date} fecha - la fecha a consultar
 * @returns {string[]} lista de horarios en formato "HH:MM"
 */
export function obtenerHorariosDelDia(catalogo, fecha) {
  const ESDOMINGO = 0; // Date.getDay() regresa 0 para domingo
  const esDomingo = fecha.getDay() === ESDOMINGO;

  return esDomingo
    ? catalogo.horariosPorDia.domingo
    : catalogo.horariosPorDia.lunesASabado;
}

/**
 * Lee todas las reservas guardadas (apartadas o pagadas) desde
 * localStorage. Si no hay ninguna todavía, regresa un array vacío
 * en vez de null, para que el resto del código no tenga que estar
 * revisando si es null antes de usarlo.
 *
 * @returns {Array<Object>} lista de reservas
 */
export function obtenerReservas() {
  try {
    const crudo = localStorage.getItem(LLAVE_RESERVAS);
    return crudo ? JSON.parse(crudo) : [];
  } catch (error) {
    console.error("No se pudieron leer las reservas guardadas:", error);
    return [];
  }
}

/**
 * Agrega una nueva reserva a la lista guardada en localStorage.
 *
 * @param {Object} reserva - objeto con los datos de la reserva
 *   (ver booking.js para la forma exacta de este objeto)
 * @returns {boolean} true si se guardó con éxito
 */
export function guardarReserva(reserva) {
  try {
    const reservas = obtenerReservas();
    reservas.push(reserva);
    localStorage.setItem(LLAVE_RESERVAS, JSON.stringify(reservas));
    return true;
  } catch (error) {
    console.error("No se pudo guardar la reserva:", error);
    return false;
  }
}

/**
 * Reemplaza la lista completa de reservas. La usa booking.js cuando
 * necesita "limpiar" reservas vencidas (apartados que expiraron).
 *
 * @param {Array<Object>} reservas - la lista ya actualizada
 * @returns {boolean} true si se guardó con éxito
 */
export function reemplazarReservas(reservas) {
  try {
    localStorage.setItem(LLAVE_RESERVAS, JSON.stringify(reservas));
    return true;
  } catch (error) {
    console.error("No se pudo actualizar la lista de reservas:", error);
    return false;
  }
}
