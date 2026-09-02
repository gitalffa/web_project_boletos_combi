/**
 * validation.js
 * -----------------------------------------------------------------
 * Funciones puras de validación (reciben un valor, dicen si es
 * válido y por qué) y helpers pequeños para mostrar/ocultar mensajes
 * de error en el HTML. No construye formularios ni sabe nada del
 * flujo de compra — eso lo decide index.js.
 * -----------------------------------------------------------------
 */

const EXPRESION_TELEFONO = /^\d{10}$/;

/**
 * Valida el nombre del pasajero.
 *
 * @param {string} valor
 * @returns {{valido: boolean, mensaje: string}}
 */
export function validarNombre(valor) {
  const limpio = valor.trim();

  if (limpio.length === 0) {
    return { valido: false, mensaje: "Escribe el nombre del pasajero." };
  }
  if (limpio.length < 2) {
    return { valido: false, mensaje: "El nombre es demasiado corto." };
  }
  return { valido: true, mensaje: "" };
}

/**
 * Valida el teléfono de contacto del pasajero: 10 dígitos.
 * Se le pueden escribir espacios o guiones y los ignoramos al validar.
 *
 * @param {string} valor
 * @returns {{valido: boolean, mensaje: string}}
 */
export function validarContacto(valor) {
  const soloDigitos = valor.replace(/\D/g, "");

  if (soloDigitos.length === 0) {
    return { valido: false, mensaje: "Escribe un teléfono de contacto." };
  }
  return EXPRESION_TELEFONO.test(soloDigitos)
    ? { valido: true, mensaje: "" }
    : { valido: false, mensaje: "El teléfono debe tener 10 dígitos." };
}

/**
 * Valida el número de tarjeta simulado: 16 dígitos, se le pueden
 * escribir espacios y los ignoramos al validar.
 *
 * @param {string} valor
 * @returns {{valido: boolean, mensaje: string}}
 */
export function validarNumeroTarjeta(valor) {
  const soloDigitos = valor.replace(/\s/g, "");

  if (soloDigitos.length === 0) {
    return { valido: false, mensaje: "Escribe el número de tarjeta." };
  }
  if (!/^\d{16}$/.test(soloDigitos)) {
    return {
      valido: false,
      mensaje: "El número de tarjeta debe tener 16 dígitos.",
    };
  }
  return { valido: true, mensaje: "" };
}

/**
 * Valida la fecha de vencimiento en formato "MM/AA", revisando que
 * el mes exista y que la fecha no esté ya vencida.
 *
 * @param {string} valor
 * @returns {{valido: boolean, mensaje: string}}
 */
export function validarVencimiento(valor) {
  const coincide = valor.trim().match(/^(\d{2})\/(\d{2})$/);

  if (!coincide) {
    return {
      valido: false,
      mensaje: "Usa el formato MM/AA, por ejemplo 09/28.",
    };
  }

  const mes = Number(coincide[1]);
  const añoCorto = Number(coincide[2]);

  if (mes < 1 || mes > 12) {
    return { valido: false, mensaje: "El mes debe estar entre 01 y 12." };
  }

  const año = 2000 + añoCorto;
  const finDeMesVencimiento = new Date(año, mes, 0); // último día de ese mes
  const hoy = new Date();

  if (finDeMesVencimiento < hoy) {
    return { valido: false, mensaje: "Esa tarjeta ya está vencida." };
  }

  return { valido: true, mensaje: "" };
}

/**
 * Valida el código de seguridad (CVV): 3 dígitos.
 *
 * @param {string} valor
 * @returns {{valido: boolean, mensaje: string}}
 */
export function validarCVV(valor) {
  const limpio = valor.trim();

  if (!/^\d{3}$/.test(limpio)) {
    return { valido: false, mensaje: "El CVV debe tener 3 dígitos." };
  }
  return { valido: true, mensaje: "" };
}

/**
 * Muestra u oculta el mensaje de error de un campo específico.
 *
 * @param {string} idError - id del elemento donde va el mensaje
 *   (por convención, cada campo tiene un <p class="campo-error"> junto a él)
 * @param {string} mensaje - texto a mostrar; si viene vacío, se oculta
 */
export function mostrarError(idError, mensaje) {
  const elementoError = document.getElementById(idError);
  if (!elementoError) return;

  elementoError.textContent = mensaje;
  elementoError.style.display = mensaje ? "block" : "none";
}

/**
 * Corre una función validadora sobre el valor actual de un <input>,
 * y muestra/oculta su mensaje de error correspondiente. Se usa tanto
 * mientras el usuario escribe (evento "blur") como al enviar el
 * formulario completo.
 *
 * @param {HTMLInputElement} input
 * @param {string} idError
 * @param {Function} funcionValidadora - una de las funciones de arriba
 * @returns {boolean} true si el campo es válido
 */
export function validarCampo(input, idError, funcionValidadora) {
  const resultado = funcionValidadora(input.value);
  mostrarError(idError, resultado.mensaje);
  input.setAttribute("aria-invalid", String(!resultado.valido));
  return resultado.valido;
}
