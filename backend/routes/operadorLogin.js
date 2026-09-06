/**
 * routes/operadorLogin.js
 * -----------------------------------------------------------------
 * POST /api/operador/login
 * Body esperado: { usuario, contrasena }
 *
 * El token lleva GRABADO el arreglo de horarioIds asignados al
 * operador — el propio operador nunca lo elige ni lo manda, así que
 * no hay forma de que vea horarios que no le corresponden.
 * -----------------------------------------------------------------
 */

import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db/connection.js";

export const routerOperadorLogin = Router();

routerOperadorLogin.post("/", async (peticion, respuesta) => {
  const { usuario, contrasena } = peticion.body;

  if (!usuario || !contrasena) {
    return respuesta.status(400).json({ estado: "error", mensaje: "Faltan usuario y contraseña" });
  }

  try {
    const [[operador]] = await pool.query(
      "SELECT id, nombre, contrasena_hash FROM operadores WHERE usuario = ? AND activo = TRUE",
      [usuario]
    );

    if (!operador) {
      return respuesta.status(401).json({ estado: "error", mensaje: "Usuario o contraseña incorrectos" });
    }

    const coincide = await bcrypt.compare(contrasena, operador.contrasena_hash);

    if (!coincide) {
      return respuesta.status(401).json({ estado: "error", mensaje: "Usuario o contraseña incorrectos" });
    }

    const [horarios] = await pool.query(
      "SELECT horario_id FROM operador_horarios WHERE operador_id = ?",
      [operador.id]
    );
    const horarioIds = horarios.map((fila) => fila.horario_id);

    const token = jwt.sign(
      {
        rol: "operador",
        operadorId: operador.id,
        horarioIds,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    respuesta.json({ estado: "ok", token, nombre: operador.nombre });
  } catch (error) {
    console.error("Error en login de operador:", error);
    respuesta.status(500).json({ estado: "error", mensaje: "No se pudo iniciar sesión" });
  }
});
