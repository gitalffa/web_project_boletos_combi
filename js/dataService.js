/**
 * dataService.js
 * -----------------------------------------------------------------
 * Única puerta de entrada a los datos de la app. Ahora habla con tu
 * API real (Express + MySQL) en vez de fetch a un JSON + localStorage.
 *
 * El resto del código (seatMap.js, index.js) sigue sin saber nada
 * de cómo se obtienen los datos por dentro — por eso este cambio
 * de JSON/localStorage a una API real no afecta a los demás archivos.
 * -----------------------------------------------------------------
 */

// Cambia esto cuando muevas el backend a producción (tu propio
// dominio/VPS), es el único lugar donde vive esta URL.
const URL_BASE_API = "http://localhost:3000/api";

/**
 * Revisa la respuesta de fetch: si el backend respondió con un
 * error (estado 4xx/5xx), convierte ese error en una excepción con
 * un mensaje claro, en vez de dejar que el resto del código siga
 * como si nada.
 *
 * @param {Response} respuesta
 * @returns {Promise<Object>} el cuerpo ya convertido a JSON
 */
async function manejarRespuesta(respuesta) {
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    const error = new Error(datos.mensaje || "Ocurrió un error inesperado");
    error.status = respuesta.status; // conservamos el código (ej. 409) para usarlo después
    throw error;
  }

  return datos;
}

/**
 * Da el precio, la capacidad del vehículo y los minutos de
 * expiración del apartado.
 *
 * @returns {Promise<{precioRutaCompleta: number, capacidadVehiculo: number, minutosLimiteApartado: number}>}
 */
export async function obtenerConfiguracion() {
  const respuesta = await fetch(`${URL_BASE_API}/configuracion`);
  const datos = await manejarRespuesta(respuesta);
  return datos.configuracion;
}

/**
 * Da la lista de paradas intermedias, en orden.
 *
 * @returns {Promise<string[]>}
 */
export async function obtenerParadas() {
  const respuesta = await fetch(`${URL_BASE_API}/paradas`);
  const datos = await manejarRespuesta(respuesta);
  return datos.paradas;
}

/**
 * Da los horarios válidos para una fecha (ya filtrados por domingo
 * y por los que ya salieron hoy — esa lógica ahora vive en el
 * backend, no aquí).
 *
 * @param {string} fecha - "AAAA-MM-DD"
 * @returns {Promise<Array<{id: number, hora: string}>>}
 */
export async function obtenerHorarios(fecha) {
  const respuesta = await fetch(`${URL_BASE_API}/horarios?fecha=${fecha}`);
  const datos = await manejarRespuesta(respuesta);
  return datos.horarios;
}

/**
 * Da el estado (disponible/apartado/confirmado) de cada asiento
 * para un viaje específico.
 *
 * @param {string} fecha - "AAAA-MM-DD"
 * @param {number} horarioId
 * @returns {Promise<Array<{numero: number, estado: string}>>}
 */
export async function obtenerEstadoAsientos(fecha, horarioId) {
  const respuesta = await fetch(
    `${URL_BASE_API}/asientos?fecha=${fecha}&horarioId=${horarioId}`,
  );
  const datos = await manejarRespuesta(respuesta);
  return datos.asientos;
}

/**
 * Crea una reserva nueva (apartado o pago). Si alguno de los
 * asientos ya no está disponible, el backend responde con error y
 * esta función lo convierte en una excepción con mensaje claro.
 *
 * @param {Object} datosReserva
 * @param {string} datosReserva.fecha
 * @param {number} datosReserva.horarioId
 * @param {number[]} datosReserva.asientos
 * @param {Array<{numeroAsiento: number, nombre: string, contacto: string}>} datosReserva.pasajeros
 * @param {"apartado"|"confirmado"} datosReserva.modalidad
 * @returns {Promise<{folio: string, venceEn: string|null}>}
 */
export async function crearReserva(datosReserva) {
  const respuesta = await fetch(`${URL_BASE_API}/reservas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datosReserva),
  });

  return manejarRespuesta(respuesta);
}

export async function consultarReserva(folio, telefono) {
  const respuesta = await fetch(
    `${URL_BASE_API}/reservas/consultar?folio=${encodeURIComponent(folio)}&telefono=${encodeURIComponent(telefono)}`,
  );
  return manejarRespuesta(respuesta);
}
