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
const LLAVE_DEBE_CAMBIAR = "combi-operador:debe-cambiar-contrasena";

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
  sessionStorage.removeItem(LLAVE_DEBE_CAMBIAR);
}

export function debeCambiarContrasena() {
  return sessionStorage.getItem(LLAVE_DEBE_CAMBIAR) === "true";
}

export function marcarContrasenaComoActualizada() {
  sessionStorage.setItem(LLAVE_DEBE_CAMBIAR, "false");
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
  sessionStorage.setItem(LLAVE_DEBE_CAMBIAR, String(datos.debeCambiarContrasena));
  return datos.nombre;
}

export async function cambiarContrasena(contrasenaActual, contrasenaNueva) {
  const respuesta = await fetch(`${URL_BASE_API}/operador/cambiar-contrasena`, {
    method: "PUT",
    headers: encabezadosConToken(),
    body: JSON.stringify({ contrasenaActual, contrasenaNueva }),
  });
  return manejarRespuesta(respuesta);
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
