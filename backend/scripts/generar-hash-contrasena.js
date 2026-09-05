/**
 * Genera el hash de una contraseña para guardar en .env como
 * ADMIN_PASSWORD_HASH. Correr una sola vez, localmente.
 *
 * Uso: node scripts/generar-hash-contrasena.js "tu_contraseña_aquí"
 */

import bcrypt from "bcrypt";

const contraseña = process.argv[2];

if (!contraseña) {
  console.error('Uso: node scripts/generar-hash-contrasena.js "tu_contraseña"');
  process.exit(1);
}

const hash = await bcrypt.hash(contraseña, 12);

console.log("\nCopia este hash completo a tu .env como ADMIN_PASSWORD_HASH:\n");
console.log(hash);
console.log("");
