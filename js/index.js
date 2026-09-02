/**
 * index.js
 * -----------------------------------------------------------------
 * Punto de entrada de la app. Conecta dataService, booking y seatMap,
 * y controla qué pantalla se muestra en cada momento.
 * -----------------------------------------------------------------
 */

import { obtenerCatalogo, obtenerHorariosDelDia } from "./dataService.js";
import { limpiarReservasVencidas, calcularEstadoAsientos } from "./booking.js";
import {
  renderizarMapaAsientos,
  obtenerAsientosSeleccionados,
} from "./seatMap.js";
import { validarNombre, validarContacto, validarCampo } from "./validation.js";

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
 * Dibuja los botones de horario disponibles para hoy, según si es
 * domingo o no (regla que ya vive en dataService.obtenerHorariosDelDia).
 */
function dibujarHorarios(catalogo) {
  const contenedor = document.getElementById("lista-horarios");
  contenedor.innerHTML = "";

  const hoy = new Date();
  const horarios = obtenerHorariosDelDia(catalogo, hoy);

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

    // TODO: siguiente paso — conectar la pantalla de modalidad
    // (apartar vs. pagar en línea) usando booking.js.
    mostrarPantalla("modalidad");
  });
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
