/**
 * routes/adminOperadores.js
 * -----------------------------------------------------------------
 * CRUD de operadores (choferes), solo accesible por el admin.
 * Cada operador puede tener VARIOS horarios asignados (relación
 * muchos a muchos, vía la tabla operador_horarios).
 * -----------------------------------------------------------------
 */

import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db/connection.js";

export const routerAdminOperadores = Router();

routerAdminOperadores.get("/", async (peticion, respuesta) => {
  try {
    const [filas] = await pool.query(
      `SELECT o.id, o.nombre, o.usuario, o.activo, h.id AS horario_id, h.hora
       FROM operadores o
       LEFT JOIN operador_horarios oh ON oh.operador_id = o.id
       LEFT JOIN horarios h ON h.id = oh.horario_id
       ORDER BY o.nombre, h.hora`
    );

    // Cada operador puede aparecer en varias filas (una por cada
    // horario asignado) — las agrupamos en un solo objeto por operador,
    // con un arreglo de horarios adentro.
    const operadoresPorId = new Map();

    for (const fila of filas) {
      if (!operadoresPorId.has(fila.id)) {
        operadoresPorId.set(fila.id, {
          id: fila.id,
          nombre: fila.nombre,
          usuario: fila.usuario,
          activo: Boolean(fila.activo),
          horarios: [],
        });
      }

      if (fila.horario_id) {
        operadoresPorId.get(fila.id).horarios.push({
          id: fila.horario_id,
          hora: fila.hora,
        });
      }
    }

    respuesta.json({ estado: "ok", operadores: Array.from(operadoresPorId.values()) });
  } catch (error) {
    console.error("Error al listar operadores:", error);
    respuesta.status(500).json({ estado: "error", mensaje: "No se pudieron listar los operadores" });
  }
});

routerAdminOperadores.post("/", async (peticion, respuesta) => {
  const { nombre, usuario, contrasena, horarioIds } = peticion.body;

  if (!nombre || !usuario || !contrasena || !horarioIds?.length) {
    return respuesta
      .status(400)
      .json({ estado: "error", mensaje: "Faltan datos del operador (incluyendo al menos un horario)" });
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const hash = await bcrypt.hash(contrasena, 12);

    const [resultado] = await conexion.query(
      "INSERT INTO operadores (nombre, usuario, contrasena_hash) VALUES (?, ?, ?)",
      [nombre, usuario, hash]
    );

    const operadorId = resultado.insertId;

    for (const horarioId of horarioIds) {
      await conexion.query(
        "INSERT INTO operador_horarios (operador_id, horario_id) VALUES (?, ?)",
        [operadorId, horarioId]
      );
    }

    await conexion.commit();
    respuesta.status(201).json({ estado: "ok", id: operadorId });
  } catch (error) {
    await conexion.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return respuesta.status(409).json({ estado: "error", mensaje: "Ese nombre de usuario ya existe" });
    }
    console.error("Error al crear operador:", error);
    respuesta.status(500).json({ estado: "error", mensaje: "No se pudo crear el operador" });
  } finally {
    conexion.release();
  }
});

routerAdminOperadores.put("/:id", async (peticion, respuesta) => {
  const { nombre, horarioIds } = peticion.body;

  if (!horarioIds?.length) {
    return respuesta.status(400).json({ estado: "error", mensaje: "Selecciona al menos un horario" });
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    await conexion.query("UPDATE operadores SET nombre = ? WHERE id = ?", [
      nombre,
      peticion.params.id,
    ]);

    // Reemplazamos todas sus asignaciones: borramos las viejas y
    // metemos las nuevas. Más simple y seguro que comparar cuáles
    // cambiaron una por una.
    await conexion.query("DELETE FROM operador_horarios WHERE operador_id = ?", [
      peticion.params.id,
    ]);

    for (const horarioId of horarioIds) {
      await conexion.query(
        "INSERT INTO operador_horarios (operador_id, horario_id) VALUES (?, ?)",
        [peticion.params.id, horarioId]
      );
    }

    await conexion.commit();
    respuesta.json({ estado: "ok", mensaje: "Operador actualizado" });
  } catch (error) {
    await conexion.rollback();
    console.error("Error al actualizar operador:", error);
    respuesta.status(500).json({ estado: "error", mensaje: "No se pudo actualizar el operador" });
  } finally {
    conexion.release();
  }
});

routerAdminOperadores.put("/:id/resetear-contrasena", async (peticion, respuesta) => {
  const { contrasenaNueva } = peticion.body;

  if (!contrasenaNueva) {
    return respuesta.status(400).json({ estado: "error", mensaje: "Falta la contraseña nueva" });
  }

  try {
    const hash = await bcrypt.hash(contrasenaNueva, 12);
    // Se marca como temporal: el operador va a tener que cambiarla
    // por una propia en cuanto inicie sesión con ella.
    await pool.query(
      "UPDATE operadores SET contrasena_hash = ?, debe_cambiar_contrasena = TRUE WHERE id = ?",
      [hash, peticion.params.id]
    );
    respuesta.json({ estado: "ok", mensaje: "Contraseña temporal generada" });
  } catch (error) {
    console.error("Error al resetear contraseña:", error);
    respuesta.status(500).json({ estado: "error", mensaje: "No se pudo actualizar la contraseña" });
  }
});

routerAdminOperadores.put("/:id/desactivar", async (peticion, respuesta) => {
  try {
    await pool.query("UPDATE operadores SET activo = FALSE WHERE id = ?", [peticion.params.id]);
    respuesta.json({ estado: "ok", mensaje: "Operador desactivado" });
  } catch (error) {
    console.error("Error al desactivar operador:", error);
    respuesta.status(500).json({ estado: "error", mensaje: "No se pudo desactivar el operador" });
  }
});

routerAdminOperadores.put("/:id/reactivar", async (peticion, respuesta) => {
  try {
    await pool.query("UPDATE operadores SET activo = TRUE WHERE id = ?", [peticion.params.id]);
    respuesta.json({ estado: "ok", mensaje: "Operador reactivado" });
  } catch (error) {
    console.error("Error al reactivar operador:", error);
    respuesta.status(500).json({ estado: "error", mensaje: "No se pudo reactivar el operador" });
  }
});
