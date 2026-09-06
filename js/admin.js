/**
 * admin.js
 * -----------------------------------------------------------------
 * Arranque del panel de admin: login y navegación entre secciones.
 * -----------------------------------------------------------------
 */

import {
  iniciarSesion,
  hayTokenGuardado,
  cerrarSesion,
  obtenerConfiguracion,
  actualizarConfiguracion,
  obtenerHorariosAdmin,
  crearHorario,
  actualizarHorario,
  borrarHorario,
  obtenerParadasAdmin,
  crearParada,
  actualizarParada,
  borrarParada,
  obtenerReservasDelDia,
  marcarComoPagado,
  reactivarHorario,
  obtenerEstadisticas,
  obtenerOperadores,
  crearOperador,
  actualizarOperador,
  resetearContrasenaOperador,
  desactivarOperador,
  reactivarOperador,
} from "./adminService.js?v=1";

function iniciar() {
  if (hayTokenGuardado()) {
    mostrarPantalla("panel");
    cargarConfiguracion();
    cargarHorarios();
    cargarParadas();
    llenarCheckboxesHorarios();
    cargarOperadores();
  }

  configurarLogin();
  configurarTabs();
  configurarFormularioConfiguracion();
  configurarFormularioHorario();
  configurarFormularioParada();
  configurarReservas();
  configurarEstadisticas();
  configurarFormularioOperador();
}

function configurarLogin() {
  const formulario = document.getElementById("formulario-login");

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const contraseña = document.getElementById("contraseña-admin").value;
    const mensajeError = document.getElementById("error-login");

    try {
      await iniciarSesion(contraseña);
      mensajeError.textContent = "";
      mostrarPantalla("panel");
      cargarConfiguracion();
      cargarHorarios();
      cargarParadas();
    } catch (error) {
      mensajeError.textContent =
        error.status === 401
          ? "Contraseña incorrecta"
          : "No se pudo iniciar sesión";
      mensajeError.style.display = "block";
    }
  });
}

function mostrarPantalla(nombre) {
  document
    .getElementById("pantalla-login")
    .classList.toggle("activa", nombre === "login");
  document
    .getElementById("pantalla-panel")
    .classList.toggle("activa", nombre === "panel");
}

function configurarTabs() {
  const tabs = document.querySelectorAll(".tab-admin");
  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      for (const otraTab of tabs) otraTab.classList.remove("activa");
      tab.classList.add("activa");

      const secciones = document.querySelectorAll(".seccion-admin");
      for (const seccion of secciones) {
        seccion.classList.toggle(
          "activa",
          seccion.id === `seccion-${tab.dataset.tab}`,
        );
      }

      // Limpia cualquier mensaje de error/aviso que haya quedado de
      // una sección anterior, para no confundir con algo que ya no aplica.
      const mensajes = document.querySelectorAll(
        ".seccion-admin .texto-ayuda[aria-live]",
      );
      for (const mensaje of mensajes) {
        mensaje.textContent = "";
      }
    });
  }
}

async function cargarConfiguracion() {
  try {
    const config = await obtenerConfiguracion();
    document.getElementById("precio-ruta").value = config.precioRutaCompleta;
    document.getElementById("capacidad-vehiculo").value =
      config.capacidadVehiculo;
    document.getElementById("minutos-limite").value =
      config.minutosLimiteApartado;
  } catch (error) {
    if (error.status === 401) {
      cerrarSesion();
      mostrarPantalla("login");
    }
  }
}

function configurarFormularioConfiguracion() {
  const formulario = document.getElementById("formulario-configuracion");

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const mensaje = document.getElementById("mensaje-configuracion");

    try {
      await actualizarConfiguracion({
        precioRutaCompleta: Number(
          document.getElementById("precio-ruta").value,
        ),
        capacidadVehiculo: Number(
          document.getElementById("capacidad-vehiculo").value,
        ),
        minutosLimiteApartado: Number(
          document.getElementById("minutos-limite").value,
        ),
      });
      mensaje.textContent = "Cambios guardados correctamente.";
    } catch (error) {
      mensaje.textContent = "No se pudieron guardar los cambios.";
    }
  });
}

// ---------- Horarios ----------

async function cargarHorarios() {
  const horarios = await obtenerHorariosAdmin();
  const cuerpoTabla = document.getElementById("tabla-horarios");
  cuerpoTabla.innerHTML = "";

  for (const horario of horarios) {
    const fila = document.createElement("tr");
    const botonEstado = horario.activo
      ? `<button type="button" class="boton-chico boton-chico--peligro" data-borrar="${horario.id}">Desactivar</button>`
      : `<button type="button" class="boton-chico" data-reactivar="${horario.id}">Reactivar</button>`;

    fila.innerHTML = `
      <td>${horario.hora.slice(0, 5)} ${horario.activo ? "" : "(inactivo)"}</td>
      <td>${horario.aplica_domingo ? "Sí" : "No"}</td>
      <td>
        <button type="button" class="boton-chico" data-editar="${horario.id}">Editar</button>
        ${botonEstado}
      </td>
    `;
    cuerpoTabla.appendChild(fila);

    fila.querySelector("[data-editar]").addEventListener("click", () => {
      document.getElementById("horario-id-editando").value = horario.id;
      document.getElementById("horario-hora").value = horario.hora.slice(0, 5);
      document.getElementById("horario-domingo").checked = Boolean(
        horario.aplica_domingo,
      );
      document.getElementById("boton-guardar-horario").textContent =
        "Actualizar horario";
      document.getElementById("boton-cancelar-horario").hidden = false;
    });

    const botonBorrar = fila.querySelector("[data-borrar]");
    if (botonBorrar) {
      botonBorrar.addEventListener("click", async () => {
        await borrarHorario(horario.id);
        cargarHorarios();
      });
    }

    const botonReactivar = fila.querySelector("[data-reactivar]");
    if (botonReactivar) {
      botonReactivar.addEventListener("click", async () => {
        await reactivarHorario(horario.id);
        cargarHorarios();
      });
    }
  }
}

function limpiarFormularioHorario() {
  document.getElementById("formulario-horario").reset();
  document.getElementById("horario-id-editando").value = "";
  document.getElementById("horario-domingo").checked = true;
  document.getElementById("boton-guardar-horario").textContent =
    "Agregar horario";
  document.getElementById("boton-cancelar-horario").hidden = true;
  document.getElementById("mensaje-horarios").textContent = "";
}

function configurarFormularioHorario() {
  document
    .getElementById("boton-cancelar-horario")
    .addEventListener("click", limpiarFormularioHorario);

  document
    .getElementById("formulario-horario")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();
      const mensaje = document.getElementById("mensaje-horarios");
      mensaje.textContent = ""; // limpiamos cualquier error de un intento anterior
      const idEditando = document.getElementById("horario-id-editando").value;

      const datos = {
        hora: document.getElementById("horario-hora").value,
        aplicaDomingo: document.getElementById("horario-domingo").checked,
      };

      try {
        if (idEditando) {
          await actualizarHorario(idEditando, datos);
        } else {
          await crearHorario(datos);
        }
        limpiarFormularioHorario();
        mensaje.textContent = "";
        cargarHorarios();
      } catch (error) {
        mensaje.textContent = error.message;
      }
    });
}

// ---------- Paradas ----------

async function cargarParadas() {
  const paradas = await obtenerParadasAdmin();
  const cuerpoTabla = document.getElementById("tabla-paradas");
  cuerpoTabla.innerHTML = "";

  for (const parada of paradas) {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${parada.orden}</td>
      <td>${parada.nombre}</td>
      <td>
        <button type="button" class="boton-chico" data-editar="${parada.id}">Editar</button>
        <button type="button" class="boton-chico boton-chico--peligro" data-borrar="${parada.id}">Borrar</button>
      </td>
    `;
    cuerpoTabla.appendChild(fila);

    fila.querySelector("[data-editar]").addEventListener("click", () => {
      document.getElementById("parada-id-editando").value = parada.id;
      document.getElementById("parada-orden").value = parada.orden;
      document.getElementById("parada-nombre").value = parada.nombre;
      document.getElementById("boton-guardar-parada").textContent =
        "Actualizar parada";
      document.getElementById("boton-cancelar-parada").hidden = false;
    });

    fila.querySelector("[data-borrar]").addEventListener("click", async () => {
      const mensaje = document.getElementById("mensaje-paradas");
      try {
        await borrarParada(parada.id);
        cargarParadas();
      } catch (error) {
        mensaje.textContent = error.message;
      }
    });
  }
}

function limpiarFormularioParada() {
  document.getElementById("formulario-parada").reset();
  document.getElementById("parada-id-editando").value = "";
  document.getElementById("boton-guardar-parada").textContent =
    "Agregar parada";
  document.getElementById("boton-cancelar-parada").hidden = true;
  document.getElementById("mensaje-paradas").textContent = "";
}

function configurarFormularioParada() {
  document
    .getElementById("boton-cancelar-parada")
    .addEventListener("click", limpiarFormularioParada);

  document
    .getElementById("formulario-parada")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();
      const mensaje = document.getElementById("mensaje-paradas");
      mensaje.textContent = ""; // limpiamos cualquier error de un intento anterior
      const idEditando = document.getElementById("parada-id-editando").value;

      const datos = {
        orden: Number(document.getElementById("parada-orden").value),
        nombre: document.getElementById("parada-nombre").value.trim(),
      };

      try {
        if (idEditando) {
          await actualizarParada(idEditando, datos);
        } else {
          await crearParada(datos);
        }
        limpiarFormularioParada();
        mensaje.textContent = "";
        cargarParadas();
      } catch (error) {
        mensaje.textContent = error.message;
      }
    });
}

// ---------- Reservas del día ----------

function configurarReservas() {
  const inputFecha = document.getElementById("fecha-reservas");
  inputFecha.valueAsDate = new Date(); // arranca mostrando el día de hoy

  document
    .getElementById("boton-buscar-reservas")
    .addEventListener("click", () => {
      cargarReservas(inputFecha.value);
    });
}

async function cargarReservas(fecha) {
  const reservas = await obtenerReservasDelDia(fecha);
  const cuerpoTabla = document.getElementById("tabla-reservas");
  cuerpoTabla.innerHTML = "";

  for (const reserva of reservas) {
    const esApartado = reserva.modalidad === "apartado";
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${reserva.hora.slice(0, 5)}</td>
      <td>${reserva.numero_asiento}</td>
      <td>${reserva.nombre_pasajero}</td>
      <td>${reserva.telefono_pasajero}</td>
      <td>${esApartado ? "Apartado" : "Pagado"}</td>
      <td>${esApartado ? `<button type="button" class="boton-chico" data-pagar="${reserva.id}">Marcar pagado</button>` : ""}</td>
    `;
    cuerpoTabla.appendChild(fila);

    const botonPagar = fila.querySelector("[data-pagar]");
    if (botonPagar) {
      botonPagar.addEventListener("click", async () => {
        await marcarComoPagado(reserva.id);
        cargarReservas(fecha);
      });
    }
  }
}
function configurarEstadisticas() {
  const hoy = new Date();
  const inicioDeMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  document.getElementById("estadisticas-fecha-inicio").valueAsDate =
    inicioDeMes;
  document.getElementById("estadisticas-fecha-fin").valueAsDate = hoy;

  document
    .getElementById("boton-buscar-estadisticas")
    .addEventListener("click", () => {
      const inicio = document.getElementById("estadisticas-fecha-inicio").value;
      const fin = document.getElementById("estadisticas-fecha-fin").value;
      cargarEstadisticas(inicio, fin);
    });
}

async function cargarEstadisticas(fechaInicio, fechaFin) {
  const est = await obtenerEstadisticas(fechaInicio, fechaFin);
  const totalBoletos =
    est.apartadosVigentes +
    est.apartadosVencidos +
    est.pagadosEnLinea +
    est.pagadosEfectivo;

  document.getElementById("tabla-estadisticas").innerHTML = `
    <tr><td>Apartados vigentes (sin pagar todavía)</td><td>${est.apartadosVigentes}</td></tr>
    <tr><td>Apartados vencidos (no llegaron a tiempo)</td><td>${est.apartadosVencidos}</td></tr>
    <tr><td>Pagados en línea</td><td>${est.pagadosEnLinea}</td></tr>
    <tr><td>Pagados en efectivo (marcados por admin)</td><td>${est.pagadosEfectivo}</td></tr>
    <tr><td><strong>Total de boletos</strong></td><td><strong>${totalBoletos}</strong></td></tr>
  `;
}

// ---------- Operadores ----------

async function llenarCheckboxesHorarios(horarioIdsSeleccionados = []) {
  const horarios = await obtenerHorariosAdmin();
  const contenedor = document.getElementById("operador-horarios-checkboxes");

  contenedor.innerHTML = horarios
    .filter((h) => h.activo)
    .map((h) => {
      const marcado = horarioIdsSeleccionados.includes(h.id) ? "checked" : "";
      return `
        <label style="display:block;">
          <input type="checkbox" value="${h.id}" class="checkbox-horario-operador" ${marcado}>
          ${h.hora.slice(0, 5)}
        </label>
      `;
    })
    .join("");
}

function obtenerHorarioIdsSeleccionados() {
  const marcados = document.querySelectorAll(".checkbox-horario-operador:checked");
  return Array.from(marcados).map((casilla) => Number(casilla.value));
}

async function cargarOperadores() {
  const operadores = await obtenerOperadores();
  const cuerpoTabla = document.getElementById("tabla-operadores");
  cuerpoTabla.innerHTML = "";

  for (const operador of operadores) {
    const fila = document.createElement("tr");
    const botonEstado = operador.activo
      ? `<button type="button" class="boton-chico boton-chico--peligro" data-desactivar="${operador.id}">Desactivar</button>`
      : `<button type="button" class="boton-chico" data-reactivar="${operador.id}">Reactivar</button>`;

    const horasTexto = operador.horarios.length
      ? operador.horarios.map((h) => h.hora.slice(0, 5)).join(", ")
      : "(sin horarios asignados)";

    fila.innerHTML = `
      <td>${operador.nombre}</td>
      <td>${operador.usuario}</td>
      <td>${horasTexto}</td>
      <td>${operador.activo ? "Activo" : "Inactivo"}</td>
      <td>
        <button type="button" class="boton-chico" data-editar="${operador.id}">Editar</button>
        <button type="button" class="boton-chico" data-resetear="${operador.id}">Nueva contraseña</button>
        ${botonEstado}
      </td>
    `;
    cuerpoTabla.appendChild(fila);

    fila.querySelector("[data-editar]").addEventListener("click", async () => {
      document.getElementById("operador-id-editando").value = operador.id;
      document.getElementById("operador-nombre").value = operador.nombre;
      document.getElementById("operador-usuario").value = operador.usuario;
      document.getElementById("operador-usuario").disabled = true; // el usuario no se cambia al editar
      document.getElementById("campo-operador-contrasena").hidden = true; // se cambia aparte, con "Nueva contraseña"
      await llenarCheckboxesHorarios(operador.horarios.map((h) => h.id));
      document.getElementById("boton-guardar-operador").textContent =
        "Actualizar operador";
      document.getElementById("boton-cancelar-operador").hidden = false;
    });

    fila
      .querySelector("[data-resetear]")
      .addEventListener("click", async () => {
        const nueva = prompt(`Nueva contraseña para ${operador.nombre}:`);
        if (!nueva) return;
        await resetearContrasenaOperador(operador.id, nueva);
        alert("Contraseña actualizada.");
      });

    const botonDesactivar = fila.querySelector("[data-desactivar]");
    if (botonDesactivar) {
      botonDesactivar.addEventListener("click", async () => {
        await desactivarOperador(operador.id);
        cargarOperadores();
      });
    }

    const botonReactivar = fila.querySelector("[data-reactivar]");
    if (botonReactivar) {
      botonReactivar.addEventListener("click", async () => {
        await reactivarOperador(operador.id);
        cargarOperadores();
      });
    }
  }
}

async function limpiarFormularioOperador() {
  document.getElementById("formulario-operador").reset();
  document.getElementById("operador-id-editando").value = "";
  document.getElementById("operador-usuario").disabled = false;
  document.getElementById("campo-operador-contrasena").hidden = false;
  await llenarCheckboxesHorarios([]);
  document.getElementById("boton-guardar-operador").textContent =
    "Agregar operador";
  document.getElementById("boton-cancelar-operador").hidden = true;
  document.getElementById("mensaje-operadores").textContent = "";
}

function configurarFormularioOperador() {
  document
    .getElementById("boton-cancelar-operador")
    .addEventListener("click", limpiarFormularioOperador);

  document
    .getElementById("formulario-operador")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();
      const mensaje = document.getElementById("mensaje-operadores");
      mensaje.textContent = "";
      const idEditando = document.getElementById("operador-id-editando").value;
      const horarioIds = obtenerHorarioIdsSeleccionados();

      if (horarioIds.length === 0) {
        mensaje.textContent = "Selecciona al menos un horario.";
        return;
      }

      try {
        if (idEditando) {
          await actualizarOperador(idEditando, {
            nombre: document.getElementById("operador-nombre").value.trim(),
            horarioIds,
          });
        } else {
          await crearOperador({
            nombre: document.getElementById("operador-nombre").value.trim(),
            usuario: document.getElementById("operador-usuario").value.trim(),
            contrasena: document.getElementById("operador-contrasena").value,
            horarioIds,
          });
        }
        await limpiarFormularioOperador();
        cargarOperadores();
      } catch (error) {
        mensaje.textContent = error.message;
      }
    });
}
iniciar();
