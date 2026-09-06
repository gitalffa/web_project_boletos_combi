/**
 * adminService.js
 * -----------------------------------------------------------------
 * Capa de acceso a datos del panel de admin. Igual que dataService.js
 * del cliente, es el único lugar que sabe hacer fetch — la diferencia
 * es que aquí casi todas las peticiones llevan el token de sesión.
 * -----------------------------------------------------------------
 */

const URL_BASE_API = "http://localhost:3000/api";
const LLAVE_TOKEN = "combi-admin:token";

async function manejarRespuesta(respuesta) {
  const datos = await respuesta.json();
  if (!respuesta.ok) {
    const error = new Error(datos.mensaje || "Ocurrió un error inesperado");
    error.status = respuesta.status;
    throw error;
  }
  return datos;
}

/**
 * Arma los encabezados de una petición autenticada, incluyendo el
 * token guardado en sessionStorage.
 */
function encabezadosConToken() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionStorage.getItem(LLAVE_TOKEN)}`,
  };
}

export function guardarToken(token) {
  sessionStorage.setItem(LLAVE_TOKEN, token);
}

export function hayTokenGuardado() {
  return Boolean(sessionStorage.getItem(LLAVE_TOKEN));
}

export function cerrarSesion() {
  sessionStorage.removeItem(LLAVE_TOKEN);
}

export async function iniciarSesion(contraseña) {
  const respuesta = await fetch(`${URL_BASE_API}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contraseña }),
  });
  const datos = await manejarRespuesta(respuesta);
  guardarToken(datos.token);
}

export async function obtenerConfiguracion() {
  const respuesta = await fetch(`${URL_BASE_API}/admin/configuracion`, {
    headers: encabezadosConToken(),
  });
  const datos = await manejarRespuesta(respuesta);
  return datos.configuracion;
}

export async function actualizarConfiguracion(cambios) {
  const respuesta = await fetch(`${URL_BASE_API}/admin/configuracion`, {
    method: "PUT",
    headers: encabezadosConToken(),
    body: JSON.stringify(cambios),
  });
  return manejarRespuesta(respuesta);
}

// Las funciones de horarios, paradas y reservas las agregamos en el
// siguiente paso, siguiendo este mismo patrón.
// ---------- Horarios ----------

export async function obtenerHorariosAdmin() {
  const respuesta = await fetch(`${URL_BASE_API}/admin/horarios`, {
    headers: encabezadosConToken(),
  });
  const datos = await manejarRespuesta(respuesta);
  return datos.horarios;
}

export async function crearHorario(datosHorario) {
  const respuesta = await fetch(`${URL_BASE_API}/admin/horarios`, {
    method: "POST",
    headers: encabezadosConToken(),
    body: JSON.stringify(datosHorario),
  });
  return manejarRespuesta(respuesta);
}

export async function actualizarHorario(id, datosHorario) {
  const respuesta = await fetch(`${URL_BASE_API}/admin/horarios/${id}`, {
    method: "PUT",
    headers: encabezadosConToken(),
    body: JSON.stringify(datosHorario),
  });
  return manejarRespuesta(respuesta);
}

export async function borrarHorario(id) {
  const respuesta = await fetch(`${URL_BASE_API}/admin/horarios/${id}`, {
    method: "DELETE",
    headers: encabezadosConToken(),
  });
  return manejarRespuesta(respuesta);
}
export async function reactivarHorario(id) {
  const respuesta = await fetch(
    `${URL_BASE_API}/admin/horarios/${id}/reactivar`,
    {
      method: "PUT",
      headers: encabezadosConToken(),
    },
  );
  return manejarRespuesta(respuesta);
}

// ---------- Paradas ----------

export async function obtenerParadasAdmin() {
  const respuesta = await fetch(`${URL_BASE_API}/admin/paradas`, {
    headers: encabezadosConToken(),
  });
  const datos = await manejarRespuesta(respuesta);
  return datos.paradas;
}

export async function crearParada(datosParada) {
  const respuesta = await fetch(`${URL_BASE_API}/admin/paradas`, {
    method: "POST",
    headers: encabezadosConToken(),
    body: JSON.stringify(datosParada),
  });
  return manejarRespuesta(respuesta);
}

export async function actualizarParada(id, datosParada) {
  const respuesta = await fetch(`${URL_BASE_API}/admin/paradas/${id}`, {
    method: "PUT",
    headers: encabezadosConToken(),
    body: JSON.stringify(datosParada),
  });
  return manejarRespuesta(respuesta);
}

export async function borrarParada(id) {
  const respuesta = await fetch(`${URL_BASE_API}/admin/paradas/${id}`, {
    method: "DELETE",
    headers: encabezadosConToken(),
  });
  return manejarRespuesta(respuesta);
}

// ---------- Reservas del día ----------

export async function obtenerReservasDelDia(fecha) {
  const respuesta = await fetch(
    `${URL_BASE_API}/admin/reservas?fecha=${fecha}`,
    {
      headers: encabezadosConToken(),
    },
  );
  const datos = await manejarRespuesta(respuesta);
  return datos.reservas;
}

export async function marcarComoPagado(idReserva) {
  const respuesta = await fetch(
    `${URL_BASE_API}/admin/reservas/${idReserva}/marcar-pagado`,
    {
      method: "PUT",
      headers: encabezadosConToken(),
    },
  );
  return manejarRespuesta(respuesta);
}
export async function obtenerEstadisticas(fechaInicio, fechaFin) {
  const respuesta = await fetch(
    `${URL_BASE_API}/admin/estadisticas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
    { headers: encabezadosConToken() },
  );
  const datos = await manejarRespuesta(respuesta);
  return datos.estadisticas;
}

// ---------- Operadores ----------

export async function obtenerOperadores() {
  const respuesta = await fetch(`${URL_BASE_API}/admin/operadores`, {
    headers: encabezadosConToken(),
  });
  const datos = await manejarRespuesta(respuesta);
  return datos.operadores;
}

export async function crearOperador(datosOperador) {
  const respuesta = await fetch(`${URL_BASE_API}/admin/operadores`, {
    method: "POST",
    headers: encabezadosConToken(),
    body: JSON.stringify(datosOperador),
  });
  return manejarRespuesta(respuesta);
}

export async function actualizarOperador(id, datosOperador) {
  const respuesta = await fetch(`${URL_BASE_API}/admin/operadores/${id}`, {
    method: "PUT",
    headers: encabezadosConToken(),
    body: JSON.stringify(datosOperador),
  });
  return manejarRespuesta(respuesta);
}

export async function resetearContrasenaOperador(id, contrasenaNueva) {
  const respuesta = await fetch(
    `${URL_BASE_API}/admin/operadores/${id}/resetear-contrasena`,
    {
      method: "PUT",
      headers: encabezadosConToken(),
      body: JSON.stringify({ contrasenaNueva }),
    },
  );
  return manejarRespuesta(respuesta);
}

export async function desactivarOperador(id) {
  const respuesta = await fetch(
    `${URL_BASE_API}/admin/operadores/${id}/desactivar`,
    {
      method: "PUT",
      headers: encabezadosConToken(),
    },
  );
  return manejarRespuesta(respuesta);
}

export async function reactivarOperador(id) {
  const respuesta = await fetch(
    `${URL_BASE_API}/admin/operadores/${id}/reactivar`,
    {
      method: "PUT",
      headers: encabezadosConToken(),
    },
  );
  return manejarRespuesta(respuesta);
}
