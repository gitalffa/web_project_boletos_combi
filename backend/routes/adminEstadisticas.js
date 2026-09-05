/**
 * routes/adminEstadisticas.js
 * -----------------------------------------------------------------
 * GET /api/admin/estadisticas?fechaInicio=AAAA-MM-DD&fechaFin=AAAA-MM-DD
 *
 * Cuenta boletos (no reservas) por categoría, dentro de un rango de
 * fechas. Cada renglón de reserva_asientos es un boleto.
 * -----------------------------------------------------------------
 */

import { Router } from "express";
import { pool } from "../db/connection.js";

export const routerAdminEstadisticas = Router();

routerAdminEstadisticas.get("/", async (peticion, respuesta) => {
  const { fechaInicio, fechaFin } = peticion.query;

  if (!fechaInicio || !fechaFin) {
    return respuesta
      .status(400)
      .json({ estado: "error", mensaje: "Faltan fechaInicio y fechaFin" });
  }

  try {
    const [[conteos]] = await pool.query(
      `SELECT
         SUM(CASE WHEN r.modalidad = 'apartado' AND (r.vence_en IS NULL OR r.vence_en > NOW())
               THEN 1 ELSE 0 END) AS apartadosVigentes,
         SUM(CASE WHEN r.modalidad = 'apartado' AND r.vence_en IS NOT NULL AND r.vence_en <= NOW()
               THEN 1 ELSE 0 END) AS apartadosVencidos,
         SUM(CASE WHEN r.modalidad = 'confirmado' AND r.pagado_en_linea = TRUE
               THEN 1 ELSE 0 END) AS pagadosEnLinea,
         SUM(CASE WHEN r.modalidad = 'confirmado' AND r.pagado_en_linea = FALSE
               THEN 1 ELSE 0 END) AS pagadosEfectivo
       FROM reserva_asientos ra
       JOIN reservas r ON r.id = ra.reserva_id
       WHERE ra.fecha BETWEEN ? AND ?`,
      [fechaInicio, fechaFin],
    );

    // SUM() regresa NULL en vez de 0 cuando no hay filas que cumplan
    // la condición — las convertimos a número para que el frontend
    // no tenga que lidiar con nulls.
    const estadisticas = {
      apartadosVigentes: Number(conteos.apartadosVigentes) || 0,
      apartadosVencidos: Number(conteos.apartadosVencidos) || 0,
      pagadosEnLinea: Number(conteos.pagadosEnLinea) || 0,
      pagadosEfectivo: Number(conteos.pagadosEfectivo) || 0,
    };

    respuesta.json({ estado: "ok", estadisticas });
  } catch (error) {
    console.error("Error al calcular estadísticas:", error);
    respuesta
      .status(500)
      .json({
        estado: "error",
        mensaje: "No se pudieron calcular las estadísticas",
      });
  }
});
