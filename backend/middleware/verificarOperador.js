/**
 * verificarOperador.js
 * -----------------------------------------------------------------
 * Igual que verificarAdmin, pero además confirma que el token sea
 * específicamente de un operador (no de un admin ni cualquier otro
 * token), y deja los datos decodificados disponibles en
 * peticion.operador para que las rutas los usen sin volver a confiar
 * en nada que venga del cliente.
 * -----------------------------------------------------------------
 */

import jwt from "jsonwebtoken";

export function verificarOperador(peticion, respuesta, siguiente) {
  const encabezadoAuth = peticion.headers.authorization;

  if (!encabezadoAuth || !encabezadoAuth.startsWith("Bearer ")) {
    return respuesta
      .status(401)
      .json({ estado: "error", mensaje: "No autorizado" });
  }

  const token = encabezadoAuth.split(" ")[1];

  try {
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);

    if (decodificado.rol !== "operador") {
      return respuesta
        .status(403)
        .json({ estado: "error", mensaje: "Acceso no permitido" });
    }

    peticion.operador = decodificado; // { operadorId, horarioId }
    siguiente();
  } catch (error) {
    respuesta
      .status(401)
      .json({ estado: "error", mensaje: "Token inválido o expirado" });
  }
}
