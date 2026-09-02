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

// Estado del viaje que el usuario va armando mientras compra.
// Se va llenando conforme avanza de pantalla en pantalla.
const viajeEnCurso = {
  fecha: null, // "AAAA-MM-DD"
  horario: null, // "HH:MM"
  catalogo: null,
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
 * Conecta el botón "Continuar" de la pantalla de asientos.
 * Por ahora solo avanza de pantalla; el formulario de pasajeros
 * se termina de construir en el siguiente paso (validation.js).
 */
function configurarBotonContinuarAsientos() {
  const boton = document.getElementById("boton-continuar-asientos");
  boton.addEventListener("click", () => {
    const asientos = obtenerAsientosSeleccionados();
    console.log("Asientos elegidos:", asientos); // TODO: quitar cuando el formulario de pasajeros esté listo

    // TODO: aquí vamos a llamar a una función de validation.js/index.js
    // que dibuje un formulario por cada asiento en #campos-pasajeros.
    mostrarPantalla("pasajeros");
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
