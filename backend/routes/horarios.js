/**
 * routes/horarios.js
 * -----------------------------------------------------------------
 * GET /api/horarios?fecha=AAAA-MM-DD
 *
 * Reemplaza lo que en el frontend hacían juntas:
 * obtenerCatalogo() + obtenerHorariosDelDia() + filtrarHorariosFuturos()
 * -----------------------------------------------------------------
 */

import { Router } from "express";
import { pool } from "../db/connection.js";

export const routerHorarios = Router();

routerHorarios.get("/", async (peticion, respuesta) => {
  const { fecha } = peticion.query;

  if (!fecha) {
    return respuesta
      .status(400)
      .json({ estado: "error", mensaje: "Falta el parámetro fecha" });
  }

  try {
    const fechaComoDate = new Date(`${fecha}T00:00:00`);
    const esDomingo = fechaComoDate.getDay() === 0;

    // Si es domingo, solo traemos los horarios que aplican domingo;
    // cualquier otro día, traemos todos.
    const consulta = esDomingo
      ? "SELECT id, hora FROM horarios WHERE aplica_domingo = TRUE AND activo = TRUE ORDER BY hora"
      : "SELECT id, hora FROM horarios WHERE activo = TRUE ORDER BY hora";

    const [horarios] = await pool.query(consulta);
    const ahora = new Date();
    const horariosFuturos = horarios.filter((horario) => {
      const salida = new Date(`${fecha}T${horario.hora}`);
      return salida > ahora;
    });

    respuesta.json({ estado: "ok", horarios: horariosFuturos });
  } catch (error) {
    console.error("Error al consultar horarios:", error);
    respuesta.status(500).json({
      estado: "error",
      mensaje: "No se pudieron obtener los horarios",
    });
  }
});
