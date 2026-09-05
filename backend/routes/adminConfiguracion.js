/**
 * routes/adminConfiguracion.js
 * -----------------------------------------------------------------
 * GET /api/admin/configuracion — ver los valores actuales
 * PUT  /api/admin/configuracion — actualizar uno o varios valores
 * -----------------------------------------------------------------
 */

import { Router } from "express";
import { pool } from "../db/connection.js";

export const routerAdminConfiguracion = Router();

const MAPA_CLAVES = {
  precioRutaCompleta: "precio_ruta_completa",
  capacidadVehiculo: "capacidad_vehiculo",
  minutosLimiteApartado: "minutos_limite_apartado",
};

routerAdminConfiguracion.get("/", async (peticion, respuesta) => {
  try {
    const [filas] = await pool.query("SELECT clave, valor FROM configuracion");
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

routerAdminConfiguracion.put("/", async (peticion, respuesta) => {
  try {
    // Solo actualizamos las claves que sí vinieron en el body, para
    // permitir cambiar una sola cosa (ej. solo el precio) sin tener
    // que mandar las tres siempre.
    for (const [claveJs, claveSql] of Object.entries(MAPA_CLAVES)) {
      if (peticion.body[claveJs] !== undefined) {
        await pool.query("UPDATE configuracion SET valor = ? WHERE clave = ?", [
          String(peticion.body[claveJs]),
          claveSql,
        ]);
      }
    }
    respuesta.json({ estado: "ok", mensaje: "Configuración actualizada" });
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    respuesta
      .status(500)
      .json({
        estado: "error",
        mensaje: "No se pudo actualizar la configuración",
      });
  }
});
