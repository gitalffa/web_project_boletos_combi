/**
 * routes/adminReservas.js
 * -----------------------------------------------------------------
 * GET /api/admin/reservas?fecha=AAAA-MM-DD  — ver reservas del día
 * PUT /api/admin/reservas/:id/marcar-pagado — convierte "apartado" en
 *     "confirmado" y le quita la fecha de vencimiento (nunca se libera)
 * -----------------------------------------------------------------
 */

import { Router } from "express";
import { pool } from "../db/connection.js";

export const routerAdminReservas = Router();

routerAdminReservas.get("/", async (peticion, respuesta) => {
  const { fecha } = peticion.query;

  if (!fecha) {
    return respuesta
      .status(400)
      .json({ estado: "error", mensaje: "Falta el parámetro fecha" });
  }

  try {
    const [filas] = await pool.query(
      `SELECT r.id, r.folio, r.modalidad, r.vence_en, h.hora,
              ra.numero_asiento, ra.nombre_pasajero, ra.telefono_pasajero
       FROM reservas r
       JOIN horarios h ON h.id = r.horario_id
       JOIN reserva_asientos ra ON ra.reserva_id = r.id
       WHERE r.fecha = ?
       ORDER BY h.hora, ra.numero_asiento`,
      [fecha],
    );

    respuesta.json({ estado: "ok", reservas: filas });
  } catch (error) {
    console.error("Error al listar reservas:", error);
    respuesta
      .status(500)
      .json({ estado: "error", mensaje: "No se pudieron listar las reservas" });
  }
});

routerAdminReservas.put("/:id/marcar-pagado", async (peticion, respuesta) => {
  try {
    const [resultado] = await pool.query(
      `UPDATE reservas SET modalidad = 'confirmado', vence_en = NULL
       WHERE id = ? AND modalidad = 'apartado'`,
      [peticion.params.id],
    );

    if (resultado.affectedRows === 0) {
      return respuesta.status(404).json({
        estado: "error",
        mensaje:
          "No se encontró esa reserva como apartado (quizás ya estaba pagada)",
      });
    }

    respuesta.json({ estado: "ok", mensaje: "Reserva marcada como pagada" });
  } catch (error) {
    console.error("Error al marcar como pagado:", error);
    respuesta
      .status(500)
      .json({ estado: "error", mensaje: "No se pudo actualizar la reserva" });
  }
});
