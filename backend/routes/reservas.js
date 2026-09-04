/**
 * routes/reservas.js
 * -----------------------------------------------------------------
 * POST /api/reservas
 * Body esperado: { fecha, horarioId, asientos, pasajeros, modalidad }
 *
 * Reemplaza crearReserva() de booking.js en el frontend, pero con
 * una garantía que localStorage nunca pudo dar: si dos personas
 * reservan el mismo asiento al mismo tiempo, la base de datos
 * garantiza que solo una lo consiga.
 * -----------------------------------------------------------------
 */

import { Router } from "express";
import { pool } from "../db/connection.js";

export const routerReservas = Router();

/**
 * Genera un folio corto y razonablemente único.
 */
function generarFolio() {
  const parteAzar = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TB-${parteAzar}`;
}

routerReservas.post("/", async (peticion, respuesta) => {
  const { fecha, horarioId, asientos, pasajeros, modalidad } = peticion.body;

  if (
    !fecha ||
    !horarioId ||
    !asientos?.length ||
    !pasajeros?.length ||
    !modalidad
  ) {
    return respuesta
      .status(400)
      .json({ estado: "error", mensaje: "Faltan datos de la reserva" });
  }

  // Tomamos UNA conexión del pool para toda la transacción (no
  // pool.query directo, porque necesitamos que las instrucciones
  // corran en la misma conexión de principio a fin).
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    // Si va a "apartar", calculamos cuándo vence: 30 min (según
    // configuracion) antes de la hora de salida de ese horario.
    let venceEn = null;
    if (modalidad === "apartado") {
      const [[horario]] = await conexion.query(
        "SELECT hora FROM horarios WHERE id = ?",
        [horarioId],
      );
      const [[minutos]] = await conexion.query(
        "SELECT valor FROM configuracion WHERE clave = 'minutos_limite_apartado'",
      );

      const salida = new Date(`${fecha}T${horario.hora}`);
      salida.setMinutes(salida.getMinutes() - Number(minutos.valor));
      venceEn = salida;
    }

    const folio = generarFolio();

    const [resultadoReserva] = await conexion.query(
      `INSERT INTO reservas (folio, fecha, horario_id, modalidad, vence_en)
       VALUES (?, ?, ?, ?, ?)`,
      [folio, fecha, horarioId, modalidad, venceEn],
    );

    const reservaId = resultadoReserva.insertId;

    // Insertamos un renglón por cada asiento. Si CUALQUIERA de estos
    // choca con la restricción UNIQUE (alguien más ya tiene ese
    // asiento para este mismo viaje), MySQL lanza un error aquí
    // mismo y saltamos directo al catch de abajo.
    for (const numeroAsiento of asientos) {
      const pasajero = pasajeros.find((p) => p.numeroAsiento === numeroAsiento);

      await conexion.query(
        `INSERT INTO reserva_asientos
           (reserva_id, fecha, horario_id, numero_asiento, nombre_pasajero, telefono_pasajero)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          reservaId,
          fecha,
          horarioId,
          numeroAsiento,
          pasajero.nombre,
          pasajero.contacto,
        ],
      );
    }

    // Si llegamos hasta aquí, TODO salió bien: confirmamos de verdad.
    await conexion.commit();

    respuesta.status(201).json({ estado: "ok", folio, venceEn });
  } catch (error) {
    // Pase lo que pase, deshacemos todo lo que se alcanzó a insertar
    // en esta transacción (la reserva a medias, si la hubo).
    await conexion.rollback();

    const asientoOcupado = error.code === "ER_DUP_ENTRY";
    if (asientoOcupado) {
      return respuesta
        .status(409)
        .json({
          estado: "error",
          mensaje: "Uno de los asientos ya no está disponible",
        });
    }

    console.error("Error al crear la reserva:", error);
    respuesta
      .status(500)
      .json({ estado: "error", mensaje: "No se pudo crear la reserva" });
  } finally {
    // Muy importante: regresamos la conexión al pool, la usemos
    // bien o mal, para que otras peticiones puedan usarla después.
    conexion.release();
  }
});
