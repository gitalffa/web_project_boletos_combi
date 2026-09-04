/**
 * routes/paradas.js
 * -----------------------------------------------------------------
 * GET /api/paradas
 *
 * Da la lista de paradas intermedias, en orden, solo con el nombre
 * (es información puramente informativa por ahora).
 * -----------------------------------------------------------------
 */

import { Router } from "express";
import { pool } from "../db/connection.js";

export const routerParadas = Router();

routerParadas.get("/", async (peticion, respuesta) => {
  try {
    const [filas] = await pool.query(
      "SELECT nombre FROM paradas ORDER BY orden",
    );
    const paradas = filas.map((fila) => fila.nombre);

    respuesta.json({ estado: "ok", paradas });
  } catch (error) {
    console.error("Error al consultar paradas:", error);
    respuesta
      .status(500)
      .json({ estado: "error", mensaje: "No se pudieron obtener las paradas" });
  }
});
