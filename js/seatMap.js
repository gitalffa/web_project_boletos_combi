/**
 * seatMap.js
 * -----------------------------------------------------------------
 * Dibuja el mapa de asientos de la combi en el HTML y maneja la
 * selección por clic. No sabe nada de localStorage ni de reservas:
 * solo recibe una lista de estados ya calculada (por booking.js) y
 * avisa, mediante un callback, cuándo cambia la selección.
 * -----------------------------------------------------------------
 */

const MAXIMO_ASIENTOS_POR_COMPRA = 4;

// Define el acomodo REAL de la combi, de adelante hacia atrás.
// Cada fila dice qué números de asiento contiene y cómo se debe
// dibujar (coincide con las clases ya definidas en css/styles.css).
const FILAS_DE_LA_COMBI = [
  { tipo: "frente", asientos: [1, 2] },
  { tipo: "doble", asientos: [3, 4] },
  { tipo: "triple", asientos: [5, 6, 7] },
  { tipo: "triple", asientos: [8, 9, 10] },
  { tipo: "trasera", asientos: [11, 12, 13, 14] },
];

// Estado interno del módulo: qué asientos lleva elegidos el usuario
// en este momento (todavía sin confirmar/guardar como reserva).
let asientosSeleccionados = new Set();

// Función que index.js registra para enterarse cada vez que cambia
// la selección (para poder habilitar/deshabilitar el botón "Continuar").
let funcionCuandoCambiaSeleccion = () => {};

/**
 * Crea el botón de un asiento individual.
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
 * respetando las filas reales de la combi.
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

  for (const fila of FILAS_DE_LA_COMBI) {
    contenedor.appendChild(construirFila(fila, estadosAsientos));
  }
}

/**
 * Construye el HTML de una fila completa (con su clase correspondiente
 * y, en el caso de las filas "triple", el hueco del pasillo).
 *
 * @param {{tipo: string, asientos: number[]}} fila
 * @param {Array<{numero: number, estado: string}>} estadosAsientos
 * @returns {HTMLDivElement}
 */
function construirFila(fila, estadosAsientos) {
  const contenedorFila = document.createElement("div");
  contenedorFila.className = `fila fila-${fila.tipo}`;

  const buscarEstado = (numero) =>
    estadosAsientos.find((a) => a.numero === numero);

  if (fila.tipo === "frente") {
    const icono = document.createElement("div");
    icono.className = "icono-chofer";
    icono.textContent = "Chofer";
    icono.setAttribute("aria-hidden", "true");
    contenedorFila.appendChild(icono);

    for (const numero of fila.asientos) {
      contenedorFila.appendChild(crearBotonAsiento(buscarEstado(numero)));
    }
    return contenedorFila;
  }

  if (fila.tipo === "triple") {
    const [izq1, izq2, der] = fila.asientos;

    const grupoIzquierda = document.createElement("div");
    grupoIzquierda.className = "grupo-izquierda";
    grupoIzquierda.appendChild(crearBotonAsiento(buscarEstado(izq1)));
    grupoIzquierda.appendChild(crearBotonAsiento(buscarEstado(izq2)));

    const pasillo = document.createElement("div");
    pasillo.className = "pasillo";
    pasillo.setAttribute("aria-hidden", "true");

    contenedorFila.appendChild(grupoIzquierda);
    contenedorFila.appendChild(pasillo);
    contenedorFila.appendChild(crearBotonAsiento(buscarEstado(der)));
    return contenedorFila;
  }

  // Filas "doble" y "trasera": simplemente todos los asientos seguidos.
  for (const numero of fila.asientos) {
    contenedorFila.appendChild(crearBotonAsiento(buscarEstado(numero)));
  }
  return contenedorFila;
}

/**
 * @returns {number[]} los números de los asientos elegidos hasta ahora,
 *   ordenados de menor a mayor.
 */
export function obtenerAsientosSeleccionados() {
  return Array.from(asientosSeleccionados).sort((a, b) => a - b);
}
