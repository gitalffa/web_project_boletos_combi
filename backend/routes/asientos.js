/**
 * routes/asientos.js
 * -----------------------------------------------------------------
 * GET /api/asientos?fecha=AAAA-MM-DD&horarioId=1
 *
 * Reemplaza calcularEstadoAsientos() de booking.js en el frontend.
 * -----------------------------------------------------------------
 */

import { Router } from "express";
import { pool } from "../db/connection.js";

export const routerAsientos = Router();

routerAsientos.get("/", async (peticion, respuesta) => {
  const { fecha, horarioId } = peticion.query;

  if (!fecha || !horarioId) {
    return respuesta
      .status(400)
      .json({
        estado: "error",
        mensaje: "Faltan los parámetros fecha y horarioId",
      });
  }

  try {
    // La capacidad del vehículo vive en la tabla configuracion, no
    // "quemada" en el código, para que el transportista pueda
    // cambiarla si algún día cambia de vehículo.
    const [[filaCapacidad]] = await pool.query(
      "SELECT valor FROM configuracion WHERE clave = 'capacidad_vehiculo'",
    );
    const capacidad = Number(filaCapacidad.valor);

    // Empezamos asumiendo que todos los asientos están disponibles.
    const estados = [];
    for (let numero = 1; numero <= capacidad; numero++) {
      estados.push({ numero, estado: "disponible" });
    }

    // Traemos las reservas de ESTE viaje específico (misma fecha y
    // horario), junto con su modalidad y su fecha de vencimiento.
    const [reservas] = await pool.query(
      `SELECT ra.numero_asiento, r.modalidad, r.vence_en
       FROM reserva_asientos ra
       JOIN reservas r ON r.id = ra.reserva_id
       WHERE ra.fecha = ? AND ra.horario_id = ?`,
      [fecha, horarioId],
    );

    const ahora = new Date();

    for (const reserva of reservas) {
      const esApartadoVencido =
        reserva.modalidad === "apartado" &&
        reserva.vence_en &&
        new Date(reserva.vence_en) < ahora;

      if (esApartadoVencido) {
        continue; // lo tratamos como si no existiera, sigue "disponible"
      }

      const asiento = estados.find(
        (item) => item.numero === reserva.numero_asiento,
      );
      if (asiento) {
        asiento.estado = reserva.modalidad;
      }
    }

    respuesta.json({ estado: "ok", asientos: estados });
  } catch (error) {
    console.error("Error al calcular el estado de los asientos:", error);
    respuesta
      .status(500)
      .json({
        estado: "error",
        mensaje: "No se pudo calcular el estado de los asientos",
      });
  }
});
