/**
 * operadorService.js
 * -----------------------------------------------------------------
 * Capa de acceso a datos para la pantalla del operador (chofer).
 * Mismo patrón que dataService.js y adminService.js.
 * -----------------------------------------------------------------
 */

const URL_BASE_API = "http://localhost:3000/api";
const LLAVE_TOKEN = "combi-operador:token";
const LLAVE_NOMBRE = "combi-operador:nombre";

async function manejarRespuesta(respuesta) {
  const datos = await respuesta.json();
  if (!respuesta.ok) {
    const error = new Error(datos.mensaje || "Ocurrió un error inesperado");
    error.status = respuesta.status;
    throw error;
  }
  return datos;
}

function encabezadosConToken() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionStorage.getItem(LLAVE_TOKEN)}`,
  };
}

export function hayTokenGuardado() {
  return Boolean(sessionStorage.getItem(LLAVE_TOKEN));
}

export function obtenerNombreGuardado() {
  return sessionStorage.getItem(LLAVE_NOMBRE) || "";
}

export function cerrarSesion() {
  sessionStorage.removeItem(LLAVE_TOKEN);
  sessionStorage.removeItem(LLAVE_NOMBRE);
}

export async function iniciarSesion(usuario, contrasena) {
  const respuesta = await fetch(`${URL_BASE_API}/operador/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, contrasena }),
  });
  const datos = await manejarRespuesta(respuesta);
  sessionStorage.setItem(LLAVE_TOKEN, datos.token);
  sessionStorage.setItem(LLAVE_NOMBRE, datos.nombre);
  return datos.nombre;
}

export async function obtenerMisReservas() {
  const respuesta = await fetch(`${URL_BASE_API}/operador/reservas`, {
    headers: encabezadosConToken(),
  });
  return manejarRespuesta(respuesta);
}

export async function marcarComoPagado(idReserva) {
  const respuesta = await fetch(
    `${URL_BASE_API}/operador/reservas/${idReserva}/marcar-pagado`,
    {
      method: "PUT",
      headers: encabezadosConToken(),
    },
  );
  return manejarRespuesta(respuesta);
}
