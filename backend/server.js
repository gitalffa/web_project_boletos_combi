/**
 * server.js
 * -----------------------------------------------------------------
 * Punto de entrada del backend. Por ahora solo tiene dos rutas de
 * prueba, para confirmar que Express arranca y que la conexión a
 * MySQL funciona, antes de construir los endpoints reales.
 * -----------------------------------------------------------------
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db/connection.js";
import { routerHorarios } from "./routes/horarios.js";
import { routerAsientos } from "./routes/asientos.js";
import { routerReservas } from "./routes/reservas.js";
import { routerConfiguracion } from "./routes/configuracion.js";
import { routerParadas } from "./routes/paradas.js";

dotenv.config();

const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(cors()); // permite que el frontend (en otro puerto) pueda llamar a esta API
app.use(express.json()); // permite leer JSON en el body de las peticiones POST

app.use("/api/horarios", routerHorarios);
app.use("/api/asientos", routerAsientos);
app.use("/api/reservas", routerReservas);
app.use("/api/configuracion", routerConfiguracion);
app.use("/api/paradas", routerParadas);

/**
 * Ruta de prueba simple: solo confirma que el servidor está vivo.
 */
app.get("/api/salud", (peticion, respuesta) => {
  respuesta.json({ estado: "ok", mensaje: "El servidor está funcionando" });
});

/**
 * Ruta de prueba de base de datos: confirma que Express sí puede
 * hablar con MySQL, consultando la tabla configuracion.
 */
app.get("/api/salud/base-de-datos", async (peticion, respuesta) => {
  try {
    const [filas] = await pool.query("SELECT clave, valor FROM configuracion");
    respuesta.json({ estado: "ok", configuracion: filas });
  } catch (error) {
    console.error("Error al consultar la base de datos:", error);
    respuesta.status(500).json({
      estado: "error",
      mensaje: "No se pudo conectar a la base de datos",
    });
  }
});

app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});
