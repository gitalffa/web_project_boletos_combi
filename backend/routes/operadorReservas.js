/**
 * routes/operadorReservas.js
 * -----------------------------------------------------------------
 * GET /api/operador/reservas
 * PUT /api/operador/reservas/:id/marcar-pagado
 *
 * El operador puede tener VARIOS horarios asignados hoy (ej. la
 * salida de las 6:00 y, más tarde, la de las 10:30). Nunca se confía
 * en qué horario/fecha manda el cliente — todo sale de
 * peticion.operador (ya verificado por verificarOperador.js), y la
 * fecha siempre es "hoy" según el reloj del servidor.
 * -----------------------------------------------------------------
 */

import { Router } from "express";
import { pool } from "../db/connection.js";

export const routerOperadorReservas = Router();

function fechaDeHoy() {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${año}-${mes}-${dia}`;
}

routerOperadorReservas.get("/", async (peticion, respuesta) => {
  const { horarioIds } = peticion.operador; // arreglo, viene del token
  const fecha = fechaDeHoy();

  if (!horarioIds?.length) {
    return respuesta.json({ estado: "ok", fecha, reservas: [] });
  }

  try {
    const [filas] = await pool.query(
      `SELECT r.id, r.folio, r.modalidad, r.horario_id, h.hora AS horario_hora,
              ra.numero_asiento, ra.nombre_pasajero, ra.telefono_pasajero
       FROM reservas r
       JOIN horarios h ON h.id = r.horario_id
       JOIN reserva_asientos ra ON ra.reserva_id = r.id
       WHERE r.fecha = ? AND r.horario_id IN (?)
       ORDER BY h.hora, ra.numero_asiento`,
      [fecha, horarioIds]
    );

    respuesta.json({ estado: "ok", fecha, reservas: filas });
  } catch (error) {
    console.error("Error al listar reservas del operador:", error);
    respuesta.status(500).json({ estado: "error", mensaje: "No se pudieron listar las reservas" });
  }
});

routerOperadorReservas.put("/:id/marcar-pagado", async (peticion, respuesta) => {
  const { horarioIds, operadorId } = peticion.operador;
  const fecha = fechaDeHoy();

  if (!horarioIds?.length) {
    return respuesta.status(404).json({ estado: "error", mensaje: "No tienes horarios asignados" });
  }

  try {
    // El WHERE incluye horario_id IN (...) y fecha a propósito: así,
    // aunque alguien intentara adivinar el id de una reserva que NO
    // es de alguno de sus horarios/fecha de hoy, la actualización
    // simplemente no afecta ninguna fila.
    const [resultado] = await pool.query(
      `UPDATE reservas
       SET modalidad = 'confirmado', vence_en = NULL,
           marcado_pagado_por = 'operador', marcado_pagado_operador_id = ?, marcado_pagado_en = NOW()
       WHERE id = ? AND horario_id IN (?) AND fecha = ? AND modalidad = 'apartado'`,
      [operadorId, peticion.params.id, horarioIds, fecha]
    );

    if (resultado.affectedRows === 0) {
      return respuesta.status(404).json({
        estado: "error",
        mensaje: "No se encontró esa reserva en alguna de tus salidas de hoy",
      });
    }

    respuesta.json({ estado: "ok", mensaje: "Reserva marcada como pagada" });
  } catch (error) {
    console.error("Error al marcar como pagado (operador):", error);
    respuesta.status(500).json({ estado: "error", mensaje: "No se pudo actualizar la reserva" });
  }
});
