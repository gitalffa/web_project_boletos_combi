/**
 * routes/operadorCuenta.js
 * -----------------------------------------------------------------
 * PUT /api/operador/cambiar-contrasena
 * Body esperado: { contrasenaActual, contrasenaNueva }
 *
 * El operador SIEMPRE tiene que confirmar su contraseña actual (la
 * temporal que le dio el admin, o la que ya tenía) antes de poder
 * cambiarla — así, ni siquiera si alguien más tuviera su sesión
 * abierta en su celular podría cambiarla sin saber la actual.
 * -----------------------------------------------------------------
 */

import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db/connection.js";

export const routerOperadorCuenta = Router();

routerOperadorCuenta.put("/cambiar-contrasena", async (peticion, respuesta) => {
  const { operadorId } = peticion.operador;
  const { contrasenaActual, contrasenaNueva } = peticion.body;

  if (!contrasenaActual || !contrasenaNueva) {
    return respuesta
      .status(400)
      .json({ estado: "error", mensaje: "Faltan la contraseña actual y la nueva" });
  }

  if (contrasenaNueva.length < 6) {
    return respuesta
      .status(400)
      .json({ estado: "error", mensaje: "La contraseña nueva debe tener al menos 6 caracteres" });
  }

  try {
    const [[operador]] = await pool.query(
      "SELECT contrasena_hash FROM operadores WHERE id = ?",
      [operadorId]
    );

    const coincide = await bcrypt.compare(contrasenaActual, operador.contrasena_hash);

    if (!coincide) {
      return respuesta.status(401).json({ estado: "error", mensaje: "Tu contraseña actual no es correcta" });
    }

    const hashNuevo = await bcrypt.hash(contrasenaNueva, 12);

    await pool.query(
      "UPDATE operadores SET contrasena_hash = ?, debe_cambiar_contrasena = FALSE WHERE id = ?",
      [hashNuevo, operadorId]
    );

    respuesta.json({ estado: "ok", mensaje: "Contraseña actualizada" });
  } catch (error) {
    console.error("Error al cambiar contraseña del operador:", error);
    respuesta.status(500).json({ estado: "error", mensaje: "No se pudo cambiar la contraseña" });
  }
});
