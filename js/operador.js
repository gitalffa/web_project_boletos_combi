/**
 * operador.js
 * -----------------------------------------------------------------
 * Arranque de la pantalla del operador (chofer): login y lista de
 * pasajeros de su salida de hoy.
 * -----------------------------------------------------------------
 */

import {
  iniciarSesion,
  hayTokenGuardado,
  obtenerNombreGuardado,
  cerrarSesion,
  obtenerMisReservas,
  marcarComoPagado,
  debeCambiarContrasena,
  marcarContrasenaComoActualizada,
  cambiarContrasena,
} from "./operadorService.js?v=1";

function iniciar() {
  if (hayTokenGuardado()) {
    if (debeCambiarContrasena()) {
      mostrarPantallaCambioObligatorio();
    } else {
      mostrarPantalla("lista");
      cargarMisReservas();
    }
  }

  configurarLogin();
  configurarCerrarSesion();
  configurarCambioContrasena();
  configurarMenuHamburguesa();
}

function configurarLogin() {
  document
    .getElementById("formulario-login-operador")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();
      const mensaje = document.getElementById("error-login-operador");
      mensaje.textContent = "";

      const usuario = document.getElementById("usuario-operador").value.trim();
      const contrasena = document.getElementById("contrasena-operador").value;

      try {
        await iniciarSesion(usuario, contrasena);
        if (debeCambiarContrasena()) {
          mostrarPantallaCambioObligatorio();
        } else {
          mostrarPantalla("lista");
          cargarMisReservas();
        }
      } catch (error) {
        mensaje.textContent = "Usuario o contraseña incorrectos";
        mensaje.style.display = "block";
      }
    });
}

function configurarCerrarSesion() {
  document
    .getElementById("boton-cerrar-sesion-operador")
    .addEventListener("click", () => {
      cerrarSesion();
      mostrarPantalla("login");
    });
}

function mostrarPantalla(nombre) {
  document
    .getElementById("pantalla-login-operador")
    .classList.toggle("activa", nombre === "login");
  document
    .getElementById("pantalla-cambiar-contrasena")
    .classList.toggle("activa", nombre === "cambiar-contrasena");
  document
    .getElementById("pantalla-lista-operador")
    .classList.toggle("activa", nombre === "lista");
}

/**
 * Muestra la pantalla de cambio de contraseña en su modo OBLIGATORIO
 * (sin botón de cancelar): el operador entró con una contraseña
 * temporal y no puede ver nada más hasta que la cambie.
 */
function mostrarPantallaCambioObligatorio() {
  document.getElementById("texto-cambio-obligatorio").textContent =
    "Tu contraseña es temporal. Debes crear una nueva antes de continuar.";
  document.getElementById("boton-cancelar-cambio-contrasena").hidden = true;
  mostrarPantalla("cambiar-contrasena");
}

/**
 * Muestra la misma pantalla, pero en modo VOLUNTARIO (con botón de
 * cancelar), para cuando el operador decide cambiar su contraseña
 * por su cuenta, sin que el sistema lo esté obligando.
 */
function mostrarPantallaCambioVoluntario() {
  document.getElementById("texto-cambio-obligatorio").textContent = "";
  document.getElementById("boton-cancelar-cambio-contrasena").hidden = false;
  mostrarPantalla("cambiar-contrasena");
}

function configurarCambioContrasena() {
  document
    .getElementById("boton-ir-a-cambiar-contrasena")
    .addEventListener("click", () => {
      cerrarMenuHamburguesa();
      mostrarPantallaCambioVoluntario();
    });

  document
    .getElementById("boton-cancelar-cambio-contrasena")
    .addEventListener("click", () => {
      document.getElementById("formulario-cambiar-contrasena").reset();
      document.getElementById("mensaje-cambiar-contrasena").textContent = "";
      mostrarPantalla("lista");
    });

  document
    .getElementById("formulario-cambiar-contrasena")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();
      const mensaje = document.getElementById("mensaje-cambiar-contrasena");
      mensaje.textContent = "";

      const actual = document.getElementById("contrasena-actual").value;
      const nueva = document.getElementById("contrasena-nueva").value;
      const confirmacion = document.getElementById(
        "contrasena-nueva-confirmar",
      ).value;

      if (nueva !== confirmacion) {
        mensaje.textContent =
          "La contraseña nueva y su confirmación no coinciden.";
        return;
      }

      try {
        await cambiarContrasena(actual, nueva);
        marcarContrasenaComoActualizada();
        document.getElementById("formulario-cambiar-contrasena").reset();
        mostrarPantalla("lista");
        cargarMisReservas();
      } catch (error) {
        mensaje.textContent = error.message;
      }
    });
}

async function cargarMisReservas() {
  document.getElementById("nombre-operador").textContent =
    obtenerNombreGuardado();

  try {
    const { fecha, reservas } = await obtenerMisReservas();
    document.getElementById("fecha-operador").textContent = fecha;
    dibujarPorSalida(reservas);
  } catch (error) {
    if (error.status === 401) {
      cerrarSesion();
      mostrarPantalla("login");
    }
  }
}

/**
 * Agrupa las reservas por horario (un operador puede tener varias
 * salidas asignadas hoy, ej. Juan a las 6:00 y de nuevo a las 10:30),
 * y dibuja una tabla separada para cada una, con su hora como título.
 */
function dibujarPorSalida(reservas) {
  const contenedor = document.getElementById("contenedor-salidas");
  contenedor.innerHTML = "";

  if (reservas.length === 0) {
    contenedor.innerHTML = `<p class="texto-ayuda">No tienes pasajeros registrados hoy.</p>`;
    return;
  }

  const reservasPorHorario = new Map();
  for (const reserva of reservas) {
    const hora = reserva.horario_hora.slice(0, 5);
    if (!reservasPorHorario.has(hora)) {
      reservasPorHorario.set(hora, []);
    }
    reservasPorHorario.get(hora).push(reserva);
  }

  for (const [hora, reservasDeEstaSalida] of reservasPorHorario) {
    const bloque = document.createElement("div");
    bloque.className = "bloque-pasajero";
    bloque.innerHTML = `<h3>Salida de las ${hora}</h3>`;

    const tabla = document.createElement("table");
    tabla.className = "tabla-admin";
    tabla.innerHTML = `
      <thead>
        <tr><th>Asiento</th><th>Pasajero</th><th>Teléfono</th><th></th></tr>
      </thead>
      <tbody></tbody>
    `;

    const cuerpoTabla = tabla.querySelector("tbody");

    for (const reserva of reservasDeEstaSalida) {
      const esApartado = reserva.modalidad === "apartado";
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${reserva.numero_asiento}</td>
        <td>${reserva.nombre_pasajero}</td>
        <td>${reserva.telefono_pasajero}</td>
        <td>${
          esApartado
            ? `<button type="button" class="boton-chico" data-pagar="${reserva.id}">Cobrar y marcar pagado</button>`
            : "✅ Pagado"
        }</td>
      `;
      cuerpoTabla.appendChild(fila);

      const boton = fila.querySelector("[data-pagar]");
      if (boton) {
        boton.addEventListener("click", async () => {
          boton.disabled = true;
          boton.textContent = "Guardando...";
          try {
            await marcarComoPagado(reserva.id);
            cargarMisReservas(); // recarga todo para reflejar el cambio
          } catch (error) {
            alert("No se pudo marcar como pagado: " + error.message);
            boton.disabled = false;
            boton.textContent = "Cobrar y marcar pagado";
          }
        });
      }
    }

    bloque.appendChild(tabla);
    contenedor.appendChild(bloque);
  }
}

function configurarMenuHamburguesa() {
  const boton = document.getElementById("boton-menu-hamburguesa-operador");
  const menu = document.getElementById("menu-panel-operador");

  boton.addEventListener("click", () => {
    const abierto = menu.classList.toggle("abierto");
    boton.setAttribute("aria-expanded", String(abierto));
  });
}

function cerrarMenuHamburguesa() {
  document.getElementById("menu-panel-operador").classList.remove("abierto");
  document
    .getElementById("boton-menu-hamburguesa-operador")
    .setAttribute("aria-expanded", "false");
}

iniciar();
