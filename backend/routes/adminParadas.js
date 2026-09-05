/**
 * routes/adminParadas.js
 * -----------------------------------------------------------------
 * GET    /api/admin/paradas      — listar todas, en orden
 * POST   /api/admin/paradas      — agregar una nueva
 * PUT    /api/admin/paradas/:id  — editar nombre/orden
 * DELETE /api/admin/paradas/:id  — borrar una
 * -----------------------------------------------------------------
 */

import { Router } from "express";
import { pool } from "../db/connection.js";

export const routerAdminParadas = Router();

routerAdminParadas.get("/", async (peticion, respuesta) => {
  try {
    const [paradas] = await pool.query(
      "SELECT id, orden, nombre FROM paradas ORDER BY orden",
    );
    respuesta.json({ estado: "ok", paradas });
  } catch (error) {
    console.error("Error al listar paradas:", error);
    respuesta
      .status(500)
      .json({ estado: "error", mensaje: "No se pudieron listar las paradas" });
  }
});

routerAdminParadas.post("/", async (peticion, respuesta) => {
  const { orden, nombre } = peticion.body;

  if (!orden || !nombre) {
    return respuesta
      .status(400)
      .json({ estado: "error", mensaje: "Faltan orden y/o nombre" });
  }

  try {
    const [resultado] = await pool.query(
      "INSERT INTO paradas (orden, nombre) VALUES (?, ?)",
      [orden, nombre],
    );
    respuesta.status(201).json({ estado: "ok", id: resultado.insertId });
  } catch (error) {
    console.error("Error al crear parada:", error);
    respuesta
      .status(500)
      .json({ estado: "error", mensaje: "No se pudo crear la parada" });
  }
});

routerAdminParadas.put("/:id", async (peticion, respuesta) => {
  const { orden, nombre } = peticion.body;

  try {
    await pool.query("UPDATE paradas SET orden = ?, nombre = ? WHERE id = ?", [
      orden,
      nombre,
      peticion.params.id,
    ]);
    respuesta.json({ estado: "ok", mensaje: "Parada actualizada" });
  } catch (error) {
    console.error("Error al actualizar parada:", error);
    respuesta
      .status(500)
      .json({ estado: "error", mensaje: "No se pudo actualizar la parada" });
  }
});

routerAdminParadas.delete("/:id", async (peticion, respuesta) => {
  try {
    await pool.query("DELETE FROM paradas WHERE id = ?", [peticion.params.id]);
    respuesta.json({ estado: "ok", mensaje: "Parada eliminada" });
  } catch (error) {
    console.error("Error al borrar parada:", error);
    respuesta
      .status(500)
      .json({ estado: "error", mensaje: "No se pudo borrar la parada" });
  }
});
