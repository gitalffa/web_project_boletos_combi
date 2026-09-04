/**
 * routes/configuracion.js
 * -----------------------------------------------------------------
 * GET /api/configuracion
 *
 * Da el precio, la capacidad del vehículo y los minutos de
 * expiración del apartado, ya convertidos a un formato fácil de
 * usar en el frontend (camelCase, números en vez de texto).
 * -----------------------------------------------------------------
 */

import { Router } from "express";
import { pool } from "../db/connection.js";

export const routerConfiguracion = Router();

routerConfiguracion.get("/", async (peticion, respuesta) => {
  try {
    const [filas] = await pool.query("SELECT clave, valor FROM configuracion");

    // Convertimos [{clave, valor}, ...] en un objeto plano, y de paso
    // pasamos cada valor de texto a número (en la tabla todo se
    // guarda como VARCHAR, para poder reutilizar la misma tabla con
    // cualquier tipo de configuración futura, sea número o texto).
    const configuracion = {
      precioRutaCompleta: Number(
        filas.find((f) => f.clave === "precio_ruta_completa")?.valor,
      ),
      capacidadVehiculo: Number(
        filas.find((f) => f.clave === "capacidad_vehiculo")?.valor,
      ),
      minutosLimiteApartado: Number(
        filas.find((f) => f.clave === "minutos_limite_apartado")?.valor,
      ),
    };

    respuesta.json({ estado: "ok", configuracion });
  } catch (error) {
    console.error("Error al consultar configuración:", error);
    respuesta
      .status(500)
      .json({
        estado: "error",
        mensaje: "No se pudo obtener la configuración",
      });
  }
});
