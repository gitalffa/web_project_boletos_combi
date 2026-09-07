/**
 * index.js
 * -----------------------------------------------------------------
 * Punto de entrada de la app. Ahora habla con la API real (Express +
 * MySQL) a través de dataService.js, en vez de JSON/localStorage.
 * booking.js del frontend ya no se usa: toda esa lógica (estado de
 * asientos, folios, vencimientos) ahora vive en el backend.
 * -----------------------------------------------------------------
 */

import {
  obtenerConfiguracion,
  obtenerParadas,
  obtenerHorarios,
  obtenerEstadoAsientos,
  crearReserva,
  consultarReserva,
} from "./dataService.js?v=1";
import {
  renderizarMapaAsientos,
  obtenerAsientosSeleccionados,
} from "./seatMap.js?v=1";
import {
  validarNombre,
  validarContacto,
  validarNumeroTarjeta,
  validarVencimiento,
  validarCVV,
  validarCampo,
} from "./validation.js?v=1";

// Configuración fija de la app (precio, capacidad, minutos de
// expiración), cargada una sola vez al arrancar.
let configuracionApp = null;

// Estado del viaje que el usuario va armando mientras compra.
const viajeEnCurso = {
  fecha: null, // "AAAA-MM-DD"
  horarioId: null, // id numérico, el que espera el backend
  horaTexto: null, // "06:00", solo para mostrar en pantalla
  asientos: [],
  pasajeros: [],
};

async function iniciar() {
  try {
    configuracionApp = await obtenerConfiguracion();
    const paradas = await obtenerParadas();

    dibujarParadas(paradas);
    await dibujarHorarios();
  } catch (error) {
    mostrarErrorDeCarga(error);
    return;
  }

  configurarBotonesVolver();
  configurarBotonContinuarAsientos();
  configurarFormularioPasajeros();
  configurarModalidad();
  configurarDescargaComprobante();
  configurarConsulta();
}

/**
 * Si la API no respondió (backend apagado, sin conexión), mostramos
 * un mensaje claro en vez de dejar la pantalla vacía sin explicación.
 */
function mostrarErrorDeCarga(error) {
  console.error("Error al cargar la app:", error);
  const contenedor = document.getElementById("pantalla-inicio");
  contenedor.innerHTML = `
    <h2>No se pudo cargar la información</h2>
    <p class="texto-ayuda">
      Revisa tu conexión e intenta de nuevo. Si el problema sigue,
      recarga la página.
    </p>
  `;
}

function dibujarParadas(paradas) {
  const lista = document.getElementById("lista-paradas");
  lista.innerHTML = "";

  for (const parada of paradas) {
    const item = document.createElement("li");
    item.textContent = parada;
    lista.appendChild(item);
  }
}

/**
 * Dibuja los horarios de hoy. Ya NO filtramos nada aquí (ni domingo
 * ni "ya pasó") — el backend regresa directamente la lista correcta.
 */
async function dibujarHorarios() {
  const contenedor = document.getElementById("lista-horarios");
  contenedor.innerHTML = "";

  const hoy = new Date();
  const fechaISO = formatearFechaISO(hoy);
  const horarios = await obtenerHorarios(fechaISO);

  if (horarios.length === 0) {
    contenedor.innerHTML = `<p class="texto-ayuda">Ya no hay salidas disponibles por hoy. Vuelve mañana.</p>`;
    return;
  }

  for (const horario of horarios) {
    const horaTexto = horario.hora.slice(0, 5); // "06:00:00" -> "06:00"
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton-horario";
    boton.textContent = horaTexto;
    boton.addEventListener("click", () =>
      elegirHorario(horario.id, horaTexto, fechaISO),
    );
    contenedor.appendChild(boton);
  }
}

function formatearFechaISO(fecha) {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${año}-${mes}-${dia}`;
}

/**
 * Se ejecuta al elegir un horario: guarda la elección y pide al
 * backend el estado real de los asientos para ese viaje.
 */
async function elegirHorario(horarioId, horaTexto, fecha) {
  viajeEnCurso.horarioId = horarioId;
  viajeEnCurso.horaTexto = horaTexto;
  viajeEnCurso.fecha = fecha;

  dibujarResumenViaje();
  mostrarPantalla("asientos");

  try {
    const estados = await obtenerEstadoAsientos(fecha, horarioId);
    renderizarMapaAsientos(estados, alCambiarSeleccionDeAsientos);
  } catch (error) {
    console.error("Error al calcular asientos:", error);
    document.getElementById("mensaje-asientos").textContent =
      "No se pudo cargar el mapa de asientos. Regresa e intenta de nuevo.";
  }
}

function dibujarResumenViaje() {
  const contenedor = document.getElementById("resumen-viaje");
  contenedor.innerHTML = `
    <p><strong>Salida:</strong> ${viajeEnCurso.horaTexto} hrs</p>
    <p><strong>Precio por asiento:</strong> $${configuracionApp.precioRutaCompleta}</p>
  `;
}

function alCambiarSeleccionDeAsientos(seleccionados) {
  const boton = document.getElementById("boton-continuar-asientos");
  boton.disabled = seleccionados.length === 0;
  boton.textContent =
    seleccionados.length === 0
      ? "Continuar"
      : `Continuar (${seleccionados.length} asiento${seleccionados.length > 1 ? "s" : ""})`;
}

function configurarBotonContinuarAsientos() {
  const boton = document.getElementById("boton-continuar-asientos");
  boton.addEventListener("click", () => {
    viajeEnCurso.asientos = obtenerAsientosSeleccionados();
    dibujarFormularioPasajeros(viajeEnCurso.asientos);
    mostrarPantalla("pasajeros");
  });
}

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

    if (!formularioValido) return;

    viajeEnCurso.pasajeros = pasajeros;
    reiniciarPantallaModalidad();
    mostrarPantalla("modalidad");
  });
}

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
    .addEventListener("click", reiniciarPantallaModalidad);
  document
    .getElementById("boton-nueva-compra")
    .addEventListener("click", reiniciarCompra);
}

function reiniciarPantallaModalidad() {
  document.getElementById("opciones-modalidad").hidden = false;
  document.getElementById("formulario-pago").hidden = true;
  document.getElementById("formulario-pago").reset();
  mostrarMensajeModalidad("");
}

async function manejarApartar() {
  await intentarCrearReserva("apartado");
}

function mostrarFormularioPago() {
  dibujarCamposPago();
  document.getElementById("opciones-modalidad").hidden = true;
  document.getElementById("formulario-pago").hidden = false;
  mostrarMensajeModalidad("");
}

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

async function manejarPago(evento) {
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

  if (!numeroValido || !vencimientoValido || !cvvValido) return;

  await intentarCrearReserva("confirmado");
}

/**
 * Intenta crear la reserva en el backend. Si el backend responde que
 * un asiento ya no está disponible (409, gracias a la restricción
 * UNIQUE + transacción que armamos), avisa y regresa a elegir de
 * nuevo con el mapa actualizado. Cualquier otro error se muestra
 * como mensaje genérico.
 */
async function intentarCrearReserva(modalidad) {
  try {
    const { folio, venceEn } = await crearReserva({
      fecha: viajeEnCurso.fecha,
      horarioId: viajeEnCurso.horarioId,
      asientos: viajeEnCurso.asientos,
      pasajeros: viajeEnCurso.pasajeros,
      modalidad,
    });

    dibujarComprobante(folio, venceEn, modalidad);
    mostrarPantalla("confirmacion");
  } catch (error) {
    if (error.status === 409) {
      mostrarMensajeModalidad(
        "Uno de tus asientos ya no está disponible. Elige de nuevo, por favor.",
      );
      const estados = await obtenerEstadoAsientos(
        viajeEnCurso.fecha,
        viajeEnCurso.horarioId,
      );
      renderizarMapaAsientos(estados, alCambiarSeleccionDeAsientos);
      mostrarPantalla("asientos");
    } else {
      console.error("Error al crear la reserva:", error);
      mostrarMensajeModalidad(
        "No se pudo completar tu reserva. Intenta de nuevo.",
      );
    }
  }
}

function mostrarMensajeModalidad(texto) {
  const contenedor = document.getElementById("mensaje-modalidad");
  if (contenedor) contenedor.textContent = texto;
}

/**
 * Construye el HTML del comprobante a partir de datos ya en el
 * formato genérico que usan tanto una compra recién hecha como una
 * consulta posterior por folio.
 */
function construirHtmlComprobante({
  folio,
  horario,
  fecha,
  modalidad,
  vencePara,
  pasajeros,
}) {
  const listaPasajeros = pasajeros
    .map(
      (p) => `<li>Asiento ${p.numeroAsiento}: ${p.nombre} — ${p.contacto}</li>`,
    )
    .join("");

  const textoModalidad =
    modalidad === "apartado"
      ? "Apartado (pagas al abordar)"
      : "Pagado en línea";

  const avisoVencimiento =
    modalidad === "apartado" && vencePara
      ? `<p><strong>Debes abordar o pagar antes de:</strong> ${formatearFechaHoraLegible(vencePara)}</p>`
      : "";

  return `
    <h2>Comprobante de tu boleto</h2>
    <p><strong>Folio:</strong> ${folio}</p>
    <p><strong>Salida:</strong> ${horario} hrs, ${fecha}</p>
    <p><strong>Modalidad:</strong> ${textoModalidad}</p>
    <ul>${listaPasajeros}</ul>
    ${avisoVencimiento}
  `;
}

function dibujarComprobante(folio, venceEn, modalidad) {
  const contenedor = document.getElementById("comprobante");
  contenedor.innerHTML = construirHtmlComprobante({
    folio,
    horario: viajeEnCurso.horaTexto,
    fecha: viajeEnCurso.fecha,
    modalidad,
    vencePara: venceEn,
    pasajeros: viajeEnCurso.pasajeros,
  });
}

function formatearFechaHoraLegible(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function reiniciarCompra() {
  viajeEnCurso.fecha = null;
  viajeEnCurso.horarioId = null;
  viajeEnCurso.horaTexto = null;
  viajeEnCurso.asientos = [];
  viajeEnCurso.pasajeros = [];

  document.getElementById("formulario-pasajeros").reset();
  reiniciarPantallaModalidad();

  mostrarPantalla("inicio");
  await dibujarHorarios(); // por si mientras comprabas ya pasó otro horario
}

/**
 * Conecta el botón de descarga/impresión: usa la función nativa del
 * navegador, con la hoja de estilo de impresión que solo muestra el
 * comprobante (ver @media print en styles.css).
 */
function configurarDescargaComprobante() {
  document
    .getElementById("boton-descargar-comprobante")
    .addEventListener("click", () => {
      window.print();
    });
}

/**
 * Pantalla de "Consultar mi boleto": busca por folio + últimos 4
 * dígitos del teléfono, y si lo encuentra, dibuja el mismo formato
 * de comprobante (con su propio botón de imprimir).
 */
function configurarConsulta() {
  document
    .getElementById("boton-ir-a-consultar")
    .addEventListener("click", () => {
      mostrarPantalla("consulta");
    });

  document
    .getElementById("formulario-consulta")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();
      const mensaje = document.getElementById("mensaje-consulta");
      const resultado = document.getElementById("resultado-consulta");
      mensaje.textContent = "";
      resultado.innerHTML = "";

      const folio = document.getElementById("folio-consulta").value.trim();
      const telefono = document
        .getElementById("telefono-consulta")
        .value.trim();

      try {
        const datos = await consultarReserva(folio, telefono);
        resultado.innerHTML =
          construirHtmlComprobante(datos) +
          `<button type="button" id="boton-descargar-consulta" class="boton-secundario">Descargar / Imprimir</button>`;

        document
          .getElementById("boton-descargar-consulta")
          .addEventListener("click", () => {
            window.print();
          });
      } catch (error) {
        mensaje.textContent =
          "No encontramos ese boleto. Revisa el folio y el teléfono.";
      }
    });
}

function configurarBotonesVolver() {
  const botones = document.querySelectorAll("[data-volver]");
  for (const boton of botones) {
    boton.addEventListener("click", () =>
      mostrarPantalla(boton.dataset.volver),
    );
  }
}

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
