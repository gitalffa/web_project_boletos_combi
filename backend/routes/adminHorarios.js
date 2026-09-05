/**
 * routes/adminHorarios.js
 * -----------------------------------------------------------------
 * GET    /api/admin/horarios       — listar todos
 * POST   /api/admin/horarios       — crear uno nuevo
 * PUT    /api/admin/horarios/:id   — editar uno existente
 * DELETE /api/admin/horarios/:id   — borrar uno (si no tiene reservas)
 * -----------------------------------------------------------------
 */

import { Router } from "express";
import { pool } from "../db/connection.js";

export const routerAdminHorarios = Router();

routerAdminHorarios.get("/", async (peticion, respuesta) => {
  try {
    const [horarios] = await pool.query(
      "SELECT id, hora, aplica_domingo, activo FROM horarios ORDER BY hora",
    );
    respuesta.json({ estado: "ok", horarios });
  } catch (error) {
    console.error("Error al listar horarios:", error);
    respuesta
      .status(500)
      .json({ estado: "error", mensaje: "No se pudieron listar los horarios" });
  }
});

routerAdminHorarios.post("/", async (peticion, respuesta) => {
  const { hora, aplicaDomingo } = peticion.body;

  if (!hora) {
    return respuesta
      .status(400)
      .json({ estado: "error", mensaje: "Falta la hora" });
  }

  try {
    const [resultado] = await pool.query(
      "INSERT INTO horarios (hora, aplica_domingo) VALUES (?, ?)",
      [hora, Boolean(aplicaDomingo)],
    );
    respuesta.status(201).json({ estado: "ok", id: resultado.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return respuesta.status(409).json({
        estado: "error",
        mensaje:
          "Ya existe un horario a esa hora. Si estaba desactivado, reactívalo en vez de crear uno nuevo.",
      });
    }
    console.error("Error al crear horario:", error);
    respuesta
      .status(500)
      .json({ estado: "error", mensaje: "No se pudo crear el horario" });
  }
});

routerAdminHorarios.put("/:id", async (peticion, respuesta) => {
  const { hora, aplicaDomingo } = peticion.body;

  try {
    await pool.query(
      "UPDATE horarios SET hora = ?, aplica_domingo = ? WHERE id = ?",
      [hora, Boolean(aplicaDomingo), peticion.params.id],
    );
    respuesta.json({ estado: "ok", mensaje: "Horario actualizado" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return respuesta.status(409).json({
        estado: "error",
        mensaje: "Ya existe otro horario a esa hora.",
      });
    }
    console.error("Error al actualizar horario:", error);
    respuesta
      .status(500)
      .json({ estado: "error", mensaje: "No se pudo actualizar el horario" });
  }
});

routerAdminHorarios.delete("/:id", async (peticion, respuesta) => {
  try {
    // "Borrar" en realidad solo desactiva — nunca borramos físicamente
    // un horario que pueda tener reservas históricas asociadas.
    await pool.query("UPDATE horarios SET activo = FALSE WHERE id = ?", [
      peticion.params.id,
    ]);
    respuesta.json({ estado: "ok", mensaje: "Horario desactivado" });
  } catch (error) {
    console.error("Error al desactivar horario:", error);
    respuesta
      .status(500)
      .json({ estado: "error", mensaje: "No se pudo desactivar el horario" });
  }
});

routerAdminHorarios.put("/:id/reactivar", async (peticion, respuesta) => {
  try {
    await pool.query("UPDATE horarios SET activo = TRUE WHERE id = ?", [
      peticion.params.id,
    ]);
    respuesta.json({ estado: "ok", mensaje: "Horario reactivado" });
  } catch (error) {
    console.error("Error al reactivar horario:", error);
    respuesta
      .status(500)
      .json({ estado: "error", mensaje: "No se pudo reactivar el horario" });
  }
});
