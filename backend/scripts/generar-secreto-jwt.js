/**
 * Genera una cadena aleatoria larga para usar como JWT_SECRET.
 * Correr una sola vez, localmente.
 */

import { randomBytes } from "crypto";

console.log("\nCopia esto a tu .env como JWT_SECRET:\n");
console.log(randomBytes(64).toString("hex"));
console.log("");
