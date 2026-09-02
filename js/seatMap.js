/**
 * seatMap.js
 * -----------------------------------------------------------------
 * Dibuja el mapa de asientos de la combi en el HTML y maneja la
 * selección por clic. No sabe nada de localStorage ni de reservas:
 * solo recibe una lista de estados ya calculada (por booking.js) y
 * avisa, mediante un callback, cuándo cambia la selección.
 *
 * El mapa se dibuja como una sola cuadrícula CSS (4 columnas), para
 * que los asientos queden alineados verticalmente entre filas, tal
 * como están en la combi real (ver css/styles.css, .mapa-asientos).
 * -----------------------------------------------------------------
 */

const MAXIMO_ASIENTOS_POR_COMPRA = 4;

// Posición de cada asiento dentro de la cuadrícula de 4 columnas.
// "fila" deja un hueco (fila 2) para la línea divisoria bajo el
// chofer, y "columna" ubica el asiento en la columna real que le
// corresponde según el dibujo del transportista.
const POSICIONES_ASIENTOS = {
  1: { fila: 1, columna: 2 },
  2: { fila: 1, columna: 3 },
  3: { fila: 3, columna: 1 },
  4: { fila: 3, columna: 2 },
  5: { fila: 4, columna: 1 },
  6: { fila: 4, columna: 2 },
  7: { fila: 4, columna: 4 },
  8: { fila: 5, columna: 1 },
  9: { fila: 5, columna: 2 },
  10: { fila: 5, columna: 4 },
  11: { fila: 6, columna: 1 },
  12: { fila: 6, columna: 2 },
  13: { fila: 6, columna: 3 },
  14: { fila: 6, columna: 4 },
};

const POSICION_CHOFER = { fila: 1, columna: 1 };
const FILA_DIVISOR = 2; // línea punteada entre el frente y el resto

// Estado interno del módulo: qué asientos lleva elegidos el usuario
// en este momento (todavía sin confirmar/guardar como reserva).
let asientosSeleccionados = new Set();

// Función que index.js registra para enterarse cada vez que cambia
// la selección (para poder habilitar/deshabilitar el botón "Continuar").
let funcionCuandoCambiaSeleccion = () => {};

/**
 * Ubica un elemento dentro de la cuadrícula, usando las mismas
 * coordenadas (fila/columna) en toda la app.
 *
 * @param {HTMLElement} elemento
 * @param {{fila: number, columna: number}} posicion
 */
function ubicarEnGrid(elemento, posicion) {
  elemento.style.gridRow = posicion.fila;
  elemento.style.gridColumn = posicion.columna;
}

/**
 * Crea el botón de un asiento individual, ya ubicado en su posición
 * dentro de la cuadrícula.
 *
 * @param {{numero: number, estado: string}} datosAsiento
 * @returns {HTMLButtonElement}
 */
function crearBotonAsiento(datosAsiento) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "asiento";
  boton.textContent = datosAsiento.numero;
  boton.dataset.asientoId = datosAsiento.numero;
  boton.dataset.estado = datosAsiento.estado;
  ubicarEnGrid(boton, POSICIONES_ASIENTOS[datosAsiento.numero]);

  const noSePuedeElegir = datosAsiento.estado !== "disponible";
  boton.disabled = noSePuedeElegir;

  if (!noSePuedeElegir) {
    boton.addEventListener("click", () =>
      alternarSeleccion(datosAsiento.numero, boton),
    );
  }

  // Etiqueta accesible: que un lector de pantalla diga algo más
  // claro que solo el número.
  const descripciones = {
    disponible: "disponible",
    apartado: "apartado por otro pasajero",
    confirmado: "ocupado",
  };
  boton.setAttribute(
    "aria-label",
    `Asiento ${datosAsiento.numero}, ${descripciones[datosAsiento.estado]}`,
  );

  return boton;
}

/**
 * Crea el ícono del chofer, ubicado en su posición fija dentro de
 * la cuadrícula (siempre columna 1, fila 1).
 *
 * @returns {HTMLDivElement}
 */
function crearIconoChofer() {
  const icono = document.createElement("div");
  icono.className = "icono-chofer";
  icono.textContent = "Chofer";
  icono.setAttribute("aria-hidden", "true");
  ubicarEnGrid(icono, POSICION_CHOFER);
  return icono;
}

/**
 * Crea la línea punteada que separa la fila del frente del resto
 * de la combi, ocupando las 4 columnas de su fila.
 *
 * @returns {HTMLDivElement}
 */
function crearDivisor() {
  const divisor = document.createElement("div");
  divisor.className = "divisor-asientos";
  divisor.setAttribute("aria-hidden", "true");
  divisor.style.gridRow = FILA_DIVISOR;
  divisor.style.gridColumn = "1 / -1"; // de la primera a la última columna
  return divisor;
}

/**
 * Agrega o quita un asiento de la selección actual cuando el
 * usuario le da clic, respetando el máximo permitido.
 *
 * @param {number} numeroAsiento
 * @param {HTMLButtonElement} boton
 */
function alternarSeleccion(numeroAsiento, boton) {
  const yaEstaSeleccionado = asientosSeleccionados.has(numeroAsiento);

  if (yaEstaSeleccionado) {
    asientosSeleccionados.delete(numeroAsiento);
    boton.dataset.seleccionado = "false";
    mostrarMensaje("");
  } else {
    if (asientosSeleccionados.size >= MAXIMO_ASIENTOS_POR_COMPRA) {
      mostrarMensaje(
        `Puedes elegir máximo ${MAXIMO_ASIENTOS_POR_COMPRA} asientos por compra.`,
      );
      return;
    }
    asientosSeleccionados.add(numeroAsiento);
    boton.dataset.seleccionado = "true";
    mostrarMensaje("");
  }

  funcionCuandoCambiaSeleccion(obtenerAsientosSeleccionados());
}

/**
 * Muestra un mensaje corto de retroalimentación bajo el mapa
 * (por ejemplo, avisar que ya llegó al máximo de asientos).
 *
 * @param {string} texto
 */
function mostrarMensaje(texto) {
  const contenedorMensaje = document.getElementById("mensaje-asientos");
  if (contenedorMensaje) {
    contenedorMensaje.textContent = texto;
  }
}

/**
 * Dibuja el mapa completo de asientos dentro del contenedor indicado,
 * ubicando cada elemento en su posición real de la cuadrícula.
 *
 * @param {Array<{numero: number, estado: string}>} estadosAsientos
 *   viene de booking.js -> calcularEstadoAsientos()
 * @param {Function} alCambiarSeleccion
 *   función que se llama cada vez que el usuario elige/quita un asiento,
 *   recibe la lista actualizada de asientos seleccionados
 */
export function renderizarMapaAsientos(estadosAsientos, alCambiarSeleccion) {
  const contenedor = document.getElementById("mapa-asientos");
  contenedor.innerHTML = ""; // limpiamos por si ya había un mapa dibujado antes

  asientosSeleccionados = new Set();
  funcionCuandoCambiaSeleccion = alCambiarSeleccion;
  mostrarMensaje("");

  contenedor.appendChild(crearIconoChofer());
  contenedor.appendChild(crearDivisor());

  for (const datosAsiento of estadosAsientos) {
    contenedor.appendChild(crearBotonAsiento(datosAsiento));
  }
}

/**
 * @returns {number[]} los números de los asientos elegidos hasta ahora,
 *   ordenados de menor a mayor.
 */
export function obtenerAsientosSeleccionados() {
  return Array.from(asientosSeleccionados).sort((a, b) => a - b);
}
