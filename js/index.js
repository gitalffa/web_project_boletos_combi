/**
 * index.js
 * -----------------------------------------------------------------
 * Punto de entrada de la app. Conecta dataService, booking y seatMap,
 * y controla qué pantalla se muestra en cada momento.
 * -----------------------------------------------------------------
 */

import { obtenerCatalogo, obtenerHorariosDelDia } from "./dataService.js";
import {
  limpiarReservasVencidas,
  calcularEstadoAsientos,
  crearReserva,
  filtrarHorariosFuturos,
} from "./booking.js";
import {
  renderizarMapaAsientos,
  obtenerAsientosSeleccionados,
} from "./seatMap.js";
import {
  validarNombre,
  validarContacto,
  validarNumeroTarjeta,
  validarVencimiento,
  validarCVV,
  validarCampo,
} from "./validation.js";

// Estado del viaje que el usuario va armando mientras compra.
// Se va llenando conforme avanza de pantalla en pantalla.
const viajeEnCurso = {
  fecha: null, // "AAAA-MM-DD"
  horario: null, // "HH:MM"
  catalogo: null,
  asientos: [], // números de asiento confirmados al salir de la pantalla de asientos
  pasajeros: [], // [{ numeroAsiento, nombre, contacto }, ...]
};

/**
 * Arranca la app: carga el catálogo, limpia reservas vencidas,
 * dibuja la pantalla de inicio y deja listos los botones de "volver".
 */
async function iniciar() {
  const catalogo = await obtenerCatalogo();

  if (!catalogo) {
    mostrarErrorDeCarga();
    return;
  }

  viajeEnCurso.catalogo = catalogo;

  limpiarReservasVencidas();
  dibujarParadas(catalogo);
  dibujarHorarios(catalogo);
  configurarBotonesVolver();
  configurarBotonContinuarAsientos();
  configurarFormularioPasajeros();
  configurarModalidad();
}

/**
 * Si el catálogo no cargó (por ejemplo, sin conexión o sin servidor
 * local), mostramos un mensaje claro en vez de dejar la pantalla vacía
 * sin explicación.
 */
function mostrarErrorDeCarga() {
  const contenedor = document.getElementById("pantalla-inicio");
  contenedor.innerHTML = `
    <h2>No se pudo cargar la información</h2>
    <p class="texto-ayuda">
      Revisa tu conexión e intenta de nuevo. Si el problema sigue,
      recarga la página.
    </p>
  `;
}

/**
 * Dibuja la lista de paradas intermedias en la pantalla de inicio
 * (solo informativa por ahora).
 */
function dibujarParadas(catalogo) {
  const lista = document.getElementById("lista-paradas");
  lista.innerHTML = "";

  for (const parada of catalogo.ruta.paradasIntermedias) {
    const item = document.createElement("li");
    item.textContent = parada;
    lista.appendChild(item);
  }
}

/**
 * Dibuja los botones de horario disponibles para hoy: primero según
 * si es domingo o no, y luego quitando los que ya salieron.
 */
function dibujarHorarios(catalogo) {
  const contenedor = document.getElementById("lista-horarios");
  contenedor.innerHTML = "";

  const hoy = new Date();
  const fechaISO = formatearFechaISO(hoy);
  const horariosDelDia = obtenerHorariosDelDia(catalogo, hoy);
  const horarios = filtrarHorariosFuturos(fechaISO, horariosDelDia);

  if (horarios.length === 0) {
    contenedor.innerHTML = `<p class="texto-ayuda">Ya no hay salidas disponibles por hoy. Vuelve mañana.</p>`;
    return;
  }

  for (const horario of horarios) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton-horario";
    boton.textContent = horario;
    boton.addEventListener("click", () => elegirHorario(horario, hoy));
    contenedor.appendChild(boton);
  }
}

/**
 * Se ejecuta cuando el usuario elige un horario: guarda la elección,
 * calcula el estado de los asientos para ese viaje específico, dibuja
 * el mapa y avanza a la pantalla de asientos.
 */
function elegirHorario(horario, fecha) {
  viajeEnCurso.horario = horario;
  viajeEnCurso.fecha = formatearFechaISO(fecha);

  dibujarResumenViaje();

  const estados = calcularEstadoAsientos(
    viajeEnCurso.catalogo,
    viajeEnCurso.fecha,
    viajeEnCurso.horario,
  );
  renderizarMapaAsientos(estados, alCambiarSeleccionDeAsientos);

  mostrarPantalla("asientos");
}

/**
 * Convierte un objeto Date a texto "AAAA-MM-DD", que es el formato
 * que usamos para guardar y comparar fechas en las reservas.
 */
function formatearFechaISO(fecha) {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${año}-${mes}-${dia}`;
}

/**
 * Muestra el horario elegido y el precio en la parte de arriba de
 * la pantalla de asientos, para que el usuario tenga contexto.
 */
function dibujarResumenViaje() {
  const contenedor = document.getElementById("resumen-viaje");
  const precio = viajeEnCurso.catalogo.ruta.precioRutaCompleta;

  contenedor.innerHTML = `
    <p><strong>Salida:</strong> ${viajeEnCurso.horario} hrs</p>
    <p><strong>Precio por asiento:</strong> $${precio}</p>
  `;
}

/**
 * Callback que seatMap.js llama cada vez que el usuario elige o
 * quita un asiento. Habilita el botón "Continuar" solo si hay al
 * menos un asiento elegido, y muestra cuántos lleva.
 */
function alCambiarSeleccionDeAsientos(seleccionados) {
  const boton = document.getElementById("boton-continuar-asientos");

  boton.disabled = seleccionados.length === 0;
  boton.textContent =
    seleccionados.length === 0
      ? "Continuar"
      : `Continuar (${seleccionados.length} asiento${seleccionados.length > 1 ? "s" : ""})`;
}

/**
 * Conecta el botón "Continuar" de la pantalla de asientos: congela
 * la selección actual en viajeEnCurso.asientos, dibuja un formulario
 * de pasajero por cada asiento, y avanza de pantalla.
 */
function configurarBotonContinuarAsientos() {
  const boton = document.getElementById("boton-continuar-asientos");
  boton.addEventListener("click", () => {
    viajeEnCurso.asientos = obtenerAsientosSeleccionados();
    dibujarFormularioPasajeros(viajeEnCurso.asientos);
    mostrarPantalla("pasajeros");
  });
}

/**
 * Genera dinámicamente un bloque de campos (nombre + teléfono) por
 * cada asiento elegido, dentro de #campos-pasajeros. Cada campo tiene
 * un id único ("nombre-asiento-3") para poder validarlo por separado.
 *
 * @param {number[]} asientos - números de asiento elegidos
 */
function dibujarFormularioPasajeros(asientos) {
  const contenedor = document.getElementById("campos-pasajeros");
  contenedor.innerHTML = "";

  for (const numeroAsiento of asientos) {
    const bloque = document.createElement("fieldset");
    bloque.className = "bloque-pasajero";
    bloque.innerHTML = `
      <legend>Asiento ${numeroAsiento}</legend>
      <div class="campo">
        <label for="nombre-asiento-${numeroAsiento}">Nombre</label>
        <input type="text" id="nombre-asiento-${numeroAsiento}" placeholder="Nombre completo">
        <p class="campo-error" id="error-nombre-${numeroAsiento}"></p>
      </div>
      <div class="campo">
        <label for="contacto-asiento-${numeroAsiento}">Teléfono</label>
        <input type="tel" id="contacto-asiento-${numeroAsiento}" placeholder="10 dígitos">
        <p class="campo-error" id="error-contacto-${numeroAsiento}"></p>
      </div>
    `;
    contenedor.appendChild(bloque);
  }
}

/**
 * Conecta el envío del formulario de pasajeros: valida el nombre y
 * el teléfono de cada asiento con validation.js, y solo avanza a la
 * pantalla de modalidad si TODOS los campos son válidos.
 */
function configurarFormularioPasajeros() {
  const formulario = document.getElementById("formulario-pasajeros");

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const pasajeros = [];
    let formularioValido = true;

    for (const numeroAsiento of viajeEnCurso.asientos) {
      const inputNombre = document.getElementById(
        `nombre-asiento-${numeroAsiento}`,
      );
      const inputContacto = document.getElementById(
        `contacto-asiento-${numeroAsiento}`,
      );

      const nombreValido = validarCampo(
        inputNombre,
        `error-nombre-${numeroAsiento}`,
        validarNombre,
      );
      const contactoValido = validarCampo(
        inputContacto,
        `error-contacto-${numeroAsiento}`,
        validarContacto,
      );

      if (!nombreValido || !contactoValido) {
        formularioValido = false;
      }

      pasajeros.push({
        numeroAsiento,
        nombre: inputNombre.value.trim(),
        contacto: inputContacto.value.trim(),
      });
    }

    if (!formularioValido) {
      return; // los mensajes de error ya quedaron visibles en cada campo
    }

    viajeEnCurso.pasajeros = pasajeros;
    reiniciarPantallaModalidad();
    mostrarPantalla("modalidad");
  });
}

/**
 * Conecta los botones y el formulario de la pantalla de modalidad:
 * "Apartar mi lugar", "Pagar en línea", el formulario de tarjeta
 * simulada, su botón de cancelar, y el botón para reservar otro boleto.
 */
function configurarModalidad() {
  document
    .getElementById("boton-apartar")
    .addEventListener("click", manejarApartar);
  document
    .getElementById("boton-pagar")
    .addEventListener("click", mostrarFormularioPago);
  document
    .getElementById("formulario-pago")
    .addEventListener("submit", manejarPago);
  document
    .getElementById("boton-cancelar-pago")
    .addEventListener("click", () => {
      reiniciarPantallaModalidad();
    });
  document
    .getElementById("boton-nueva-compra")
    .addEventListener("click", reiniciarCompra);
}

/**
 * Deja la pantalla de modalidad en su estado inicial: opciones
 * visibles, formulario de pago oculto y limpio, sin mensajes de error.
 */
function reiniciarPantallaModalidad() {
  document.getElementById("opciones-modalidad").hidden = false;
  document.getElementById("formulario-pago").hidden = true;
  document.getElementById("formulario-pago").reset();
  mostrarMensajeModalidad("");
}

/**
 * Se ejecuta al elegir "Apartar mi lugar": no pide datos extra,
 * solo revalida los asientos y guarda la reserva como "apartado".
 */
function manejarApartar() {
  if (!verificarAsientosSiguenDisponibles()) return;

  const reserva = crearReserva({
    fecha: viajeEnCurso.fecha,
    horario: viajeEnCurso.horario,
    asientos: viajeEnCurso.asientos,
    pasajeros: viajeEnCurso.pasajeros,
    modalidad: "apartado",
  });

  if (!reserva) {
    mostrarMensajeModalidad(
      "No se pudo guardar tu apartado. Intenta de nuevo.",
    );
    return;
  }

  dibujarComprobante(reserva);
  mostrarPantalla("confirmacion");
}

/**
 * Se ejecuta al elegir "Pagar en línea": oculta las dos opciones y
 * dibuja el formulario de tarjeta simulada.
 */
function mostrarFormularioPago() {
  dibujarCamposPago();
  document.getElementById("opciones-modalidad").hidden = true;
  document.getElementById("formulario-pago").hidden = false;
  mostrarMensajeModalidad("");
}

/**
 * Genera los campos del formulario de tarjeta simulada dentro de
 * #campos-pago: número, vencimiento y CVV, cada uno con su mensaje
 * de error correspondiente.
 */
function dibujarCamposPago() {
  const contenedor = document.getElementById("campos-pago");
  contenedor.innerHTML = `
    <div class="campo">
      <label for="numero-tarjeta">Número de tarjeta</label>
      <input type="text" id="numero-tarjeta" inputmode="numeric" placeholder="0000 0000 0000 0000" maxlength="19">
      <p class="campo-error" id="error-numero-tarjeta"></p>
    </div>
    <div class="campo">
      <label for="vencimiento-tarjeta">Vencimiento (MM/AA)</label>
      <input type="text" id="vencimiento-tarjeta" placeholder="09/28" maxlength="5">
      <p class="campo-error" id="error-vencimiento-tarjeta"></p>
    </div>
    <div class="campo">
      <label for="cvv-tarjeta">CVV</label>
      <input type="text" id="cvv-tarjeta" inputmode="numeric" placeholder="123" maxlength="3">
      <p class="campo-error" id="error-cvv-tarjeta"></p>
    </div>
  `;
}

/**
 * Se ejecuta al enviar el formulario de pago: valida los tres campos
 * de la tarjeta simulada, revalida los asientos, y si todo está bien
 * guarda la reserva como "confirmado" (pagado).
 */
function manejarPago(evento) {
  evento.preventDefault();

  const inputNumero = document.getElementById("numero-tarjeta");
  const inputVencimiento = document.getElementById("vencimiento-tarjeta");
  const inputCVV = document.getElementById("cvv-tarjeta");

  const numeroValido = validarCampo(
    inputNumero,
    "error-numero-tarjeta",
    validarNumeroTarjeta,
  );
  const vencimientoValido = validarCampo(
    inputVencimiento,
    "error-vencimiento-tarjeta",
    validarVencimiento,
  );
  const cvvValido = validarCampo(inputCVV, "error-cvv-tarjeta", validarCVV);

  if (!numeroValido || !vencimientoValido || !cvvValido) {
    return; // los mensajes de error ya quedaron visibles en cada campo
  }

  if (!verificarAsientosSiguenDisponibles()) return;

  const reserva = crearReserva({
    fecha: viajeEnCurso.fecha,
    horario: viajeEnCurso.horario,
    asientos: viajeEnCurso.asientos,
    pasajeros: viajeEnCurso.pasajeros,
    modalidad: "confirmado",
  });

  if (!reserva) {
    mostrarMensajeModalidad("No se pudo guardar tu pago. Intenta de nuevo.");
    return;
  }

  dibujarComprobante(reserva);
  mostrarPantalla("confirmacion");
}

/**
 * Vuelve a calcular el estado de los asientos y confirma que los
 * que el usuario eligió sigan disponibles. Si alguno ya no lo está,
 * avisa y lo regresa a la pantalla de asientos con el mapa actualizado.
 *
 * @returns {boolean} true si todos los asientos elegidos siguen libres
 */
function verificarAsientosSiguenDisponibles() {
  const estadosActuales = calcularEstadoAsientos(
    viajeEnCurso.catalogo,
    viajeEnCurso.fecha,
    viajeEnCurso.horario,
  );

  const algunoYaNoDisponible = viajeEnCurso.asientos.some((numero) => {
    const estado = estadosActuales.find((a) => a.numero === numero);
    return !estado || estado.estado !== "disponible";
  });

  if (algunoYaNoDisponible) {
    mostrarMensajeModalidad(
      "Uno de tus asientos ya no está disponible. Elige de nuevo, por favor.",
    );
    renderizarMapaAsientos(estadosActuales, alCambiarSeleccionDeAsientos);
    mostrarPantalla("asientos");
    return false;
  }

  return true;
}

/**
 * Muestra un mensaje corto en la pantalla de modalidad (errores o
 * avisos), o lo limpia si se le pasa una cadena vacía.
 */
function mostrarMensajeModalidad(texto) {
  const contenedor = document.getElementById("mensaje-modalidad");
  if (contenedor) {
    contenedor.textContent = texto;
  }
}

/**
 * Dibuja el comprobante final con el folio, el horario, los
 * pasajeros y, si aplica, la fecha límite para pagar/abordar.
 *
 * @param {Object} reserva - la reserva que regresó crearReserva()
 */
function dibujarComprobante(reserva) {
  const contenedor = document.getElementById("comprobante");

  const listaPasajeros = reserva.pasajeros
    .map(
      (p) => `<li>Asiento ${p.numeroAsiento}: ${p.nombre} — ${p.contacto}</li>`,
    )
    .join("");

  const textoModalidad =
    reserva.modalidad === "apartado"
      ? "Apartado (pagas al abordar)"
      : "Pagado en línea";

  const avisoVencimiento =
    reserva.modalidad === "apartado"
      ? `<p><strong>Debes abordar o pagar antes de:</strong> ${formatearFechaHoraLegible(reserva.vencePara)}</p>`
      : "";

  contenedor.innerHTML = `
    <h2>¡Listo! Este es tu comprobante</h2>
    <p><strong>Folio:</strong> ${reserva.folio}</p>
    <p><strong>Salida:</strong> ${reserva.horario} hrs, ${reserva.fecha}</p>
    <p><strong>Modalidad:</strong> ${textoModalidad}</p>
    <ul>${listaPasajeros}</ul>
    ${avisoVencimiento}
  `;
}

/**
 * Convierte una fecha ISO ("2026-09-15T07:30:00.000Z") a un texto
 * legible en español, para mostrarla en el comprobante.
 */
function formatearFechaHoraLegible(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Reinicia todo el estado del viaje en curso y regresa a la pantalla
 * de inicio, para que el usuario pueda reservar otro boleto.
 */
function reiniciarCompra() {
  viajeEnCurso.fecha = null;
  viajeEnCurso.horario = null;
  viajeEnCurso.asientos = [];
  viajeEnCurso.pasajeros = [];

  document.getElementById("formulario-pasajeros").reset();
  reiniciarPantallaModalidad();

  mostrarPantalla("inicio");
}

/**
 * Conecta todos los botones "← Volver" de la app, usando el atributo
 * data-volver para saber a qué pantalla regresar.
 */
function configurarBotonesVolver() {
  const botones = document.querySelectorAll("[data-volver]");
  for (const boton of botones) {
    boton.addEventListener("click", () => {
      mostrarPantalla(boton.dataset.volver);
    });
  }
}

/**
 * Cambia cuál <section class="pantalla"> está visible, usando el
 * atributo data-pantalla para encontrarla.
 *
 * @param {string} nombrePantalla - ej. "inicio", "asientos", "pasajeros"
 */
function mostrarPantalla(nombrePantalla) {
  const todasLasPantallas = document.querySelectorAll(".pantalla");
  for (const pantalla of todasLasPantallas) {
    pantalla.classList.toggle(
      "activa",
      pantalla.dataset.pantalla === nombrePantalla,
    );
  }
}

iniciar();
