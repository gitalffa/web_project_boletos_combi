/**
 * booking.js
 * -----------------------------------------------------------------
 * Lógica de negocio del proceso de reservación. Aquí SÍ se decide
 * cómo se calculan las cosas (estado de asientos, vencimientos,
 * folios). No toca fetch ni localStorage directamente: le pide todo
 * a dataService.js.
 * -----------------------------------------------------------------
 */

import {
  obtenerReservas,
  reemplazarReservas,
  guardarReserva,
} from "./dataService.js?v=1";

const MINUTOS_LIMITE_APARTADO = 30;

/**
 * Construye la fecha y hora exacta de salida de un viaje, juntando
 * la fecha del recorrido ("2026-09-15") con el horario ("08:00").
 * Lo necesitamos como un solo Date para poder restarle minutos y
 * comparar contra la hora actual.
 *
 * @param {string} fecha - formato "AAAA-MM-DD"
 * @param {string} horario - formato "HH:MM"
 * @returns {Date}
 */
function obtenerFechaHoraSalida(fecha, horario) {
  return new Date(`${fecha}T${horario}:00`);
}

/**
 * Quita de una lista de horarios los que ya salieron (su hora de
 * salida ya pasó respecto a este momento). La usamos para no dejar
 * que alguien reserve un viaje que ya se fue.
 *
 * @param {string} fecha - "AAAA-MM-DD"
 * @param {string[]} horarios - ej. ["06:00", "08:00", "10:30", ...]
 * @returns {string[]} solo los horarios cuya salida sigue en el futuro
 */
export function filtrarHorariosFuturos(fecha, horarios) {
  const ahora = new Date();
  return horarios.filter(
    (horario) => obtenerFechaHoraSalida(fecha, horario) > ahora,
  );
}

/**
 * Calcula la fecha/hora límite para pagar un asiento apartado:
 * 30 minutos antes de la salida del viaje.
 *
 * @param {string} fecha
 * @param {string} horario
 * @returns {Date}
 */
function calcularLimiteApartado(fecha, horario) {
  const salida = obtenerFechaHoraSalida(fecha, horario);
  salida.setMinutes(salida.getMinutes() - MINUTOS_LIMITE_APARTADO);
  return salida;
}

/**
 * Revisa si una reserva de tipo "apartado" ya venció.
 *
 * @param {Object} reserva
 * @returns {boolean}
 */
function reservaVencida(reserva) {
  if (reserva.modalidad !== "apartado") {
    return false; // los pagados/confirmados nunca vencen
  }
  const limite = new Date(reserva.vencePara);
  return new Date() > limite;
}

/**
 * Elimina de localStorage las reservas "apartado" que ya vencieron,
 * en TODOS los viajes (no solo el que se está consultando ahora).
 * Así el almacenamiento no va acumulando reservas muertas para
 * siempre. Se recomienda llamarla una vez cada vez que arranca la
 * app o se entra a la pantalla de asientos.
 */
export function limpiarReservasVencidas() {
  const reservas = obtenerReservas();
  const reservasVigentes = reservas.filter(
    (reserva) => !reservaVencida(reserva),
  );

  if (reservasVigentes.length !== reservas.length) {
    reemplazarReservas(reservasVigentes);
  }
}

/**
 * Calcula el estado de cada uno de los asientos del vehículo para
 * un viaje específico (misma fecha + mismo horario), combinando la
 * capacidad del catálogo con las reservas ya guardadas.
 *
 * @param {Object} catalogo - catálogo cargado con obtenerCatalogo()
 * @param {string} fecha - "AAAA-MM-DD"
 * @param {string} horario - "HH:MM"
 * @returns {Array<{numero: number, estado: string}>}
 *   estado es "disponible", "apartado" o "confirmado"
 */
export function calcularEstadoAsientos(catalogo, fecha, horario) {
  const capacidad = catalogo.capacidadVehiculo;

  // Empezamos asumiendo que todos los asientos están disponibles.
  const estados = [];
  for (let numero = 1; numero <= capacidad; numero++) {
    estados.push({ numero, estado: "disponible" });
  }

  const reservas = obtenerReservas();

  const reservasDeEsteViaje = reservas.filter(
    (reserva) => reserva.fecha === fecha && reserva.horario === horario,
  );

  for (const reserva of reservasDeEsteViaje) {
    // Un apartado vencido se trata como si no existiera: el asiento
    // sigue disponible aunque la reserva vieja siga en localStorage
    // (limpiarReservasVencidas() la va a borrar más adelante).
    if (reservaVencida(reserva)) {
      continue;
    }

    for (const numeroAsiento of reserva.asientos) {
      const asiento = estados.find((item) => item.numero === numeroAsiento);
      if (asiento) {
        asiento.estado = reserva.modalidad; // "apartado" o "confirmado"
      }
    }
  }

  return estados;
}

/**
 * Genera un folio corto y razonablemente único para identificar la
 * reserva (el pasajero lo muestra al abordar o al pagar).
 *
 * @returns {string} ej. "TB-L3F9K2"
 */
function generarFolio() {
  const parteAzar = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TB-${parteAzar}`;
}

/**
 * Arma el objeto completo de una nueva reserva y la guarda mediante
 * dataService. Esta es la única función que el resto de la app debe
 * llamar para crear una reserva nueva.
 *
 * @param {Object} datos
 * @param {string} datos.fecha - "AAAA-MM-DD"
 * @param {string} datos.horario - "HH:MM"
 * @param {number[]} datos.asientos - números de asiento elegidos
 * @param {Array<{nombre: string, contacto: string}>} datos.pasajeros
 * @param {"apartado"|"confirmado"} datos.modalidad
 * @returns {Object|null} la reserva creada, o null si falló al guardar
 */
export function crearReserva({
  fecha,
  horario,
  asientos,
  pasajeros,
  modalidad,
}) {
  const reserva = {
    folio: generarFolio(),
    fecha,
    horario,
    asientos,
    pasajeros,
    modalidad,
    creadaEn: new Date().toISOString(),
    vencePara:
      modalidad === "apartado"
        ? calcularLimiteApartado(fecha, horario).toISOString()
        : null,
  };

  const seGuardoConExito = guardarReserva(reserva);
  return seGuardoConExito ? reserva : null;
}
