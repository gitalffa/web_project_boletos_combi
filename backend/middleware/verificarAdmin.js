/**
 * verificarAdmin.js
 * -----------------------------------------------------------------
 * Middleware que protege las rutas de admin. Revisa que la petición
 * traiga un token válido en el encabezado "Authorization: Bearer ...".
 * Si no, detiene la petición aquí mismo con un 401 y nunca deja que
 * llegue a la ruta real.
 * -----------------------------------------------------------------
 */

import jwt from "jsonwebtoken";

export function verificarAdmin(peticion, respuesta, siguiente) {
  const encabezadoAuth = peticion.headers.authorization;

  if (!encabezadoAuth || !encabezadoAuth.startsWith("Bearer ")) {
    return respuesta
      .status(401)
      .json({ estado: "error", mensaje: "No autorizado" });
  }

  const token = encabezadoAuth.split(" ")[1]; // "Bearer XXXXX" -> "XXXXX"

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    siguiente(); // el token es válido, deja pasar la petición a la ruta real
  } catch (error) {
    respuesta
      .status(401)
      .json({ estado: "error", mensaje: "Token inválido o expirado" });
  }
}
