/**
 * routes/adminLogin.js
 * -----------------------------------------------------------------
 * POST /api/admin/login
 * Body esperado: { contraseña }
 *
 * Esta es la ÚNICA ruta de admin que NO pasa por verificarAdmin
 * (obviamente, todavía no tiene token cuando apenas está iniciando
 * sesión). Si la contraseña coincide con el hash guardado, regresa
 * un token válido por 8 horas.
 * -----------------------------------------------------------------
 */

import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const routerAdminLogin = Router();

routerAdminLogin.post("/", async (peticion, respuesta) => {
  const { contraseña } = peticion.body;

  if (!contraseña) {
    return respuesta
      .status(400)
      .json({ estado: "error", mensaje: "Falta la contraseña" });
  }

  const coincide = await bcrypt.compare(
    contraseña,
    process.env.ADMIN_PASSWORD_HASH,
  );

  if (!coincide) {
    return respuesta
      .status(401)
      .json({ estado: "error", mensaje: "Contraseña incorrecta" });
  }

  const token = jwt.sign({ rol: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });

  respuesta.json({ estado: "ok", token });
});
