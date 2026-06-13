// frontend/scripts/equipos.js


// Arreglo utilizado para almacenar temporalmente la lista completa de equipos.
let todosLosEquipos = [];


// ─────────────────────────────────────────────
// Inicialización
// ─────────────────────────────────────────────

// Ejecuta las funciones iniciales cuando el documento termina de cargarse.
document.addEventListener('DOMContentLoaded', () => {

  // Inicializa la barra lateral indicando que el módulo actual es equipos.
  initSidebar('equipos');

  // Carga la información de los equipos registrados.
  cargarEquipos();

});



// ─────────────────────────────────────────────
// CARGAR EQUIPOS
// ─────────────────────────────────────────────

// Obtiene los equipos registrados mediante una solicitud al servidor.
async function cargarEquipos() {

  try {

    // Realiza una petición GET al endpoint encargado de devolver los equipos.
    const resp = await fetch('/api/equipos');

    // Convierte la respuesta obtenida en formato JSON.
    const data = await resp.json();


    // Guarda los equipos obtenidos en la variable global.
    todosLosEquipos = data;


    // Envía la información obtenida para construir la tabla.
    renderizarTabla(data);


  } catch (error) {

    // Muestra información del error ocurrido durante la carga.
    console.error('[Equipos]', error);

    // Muestra un mensaje visual indicando que ocurrió un problema.
    toast('Error al cargar equipos', 'error');

  }

}



// ─────────────────────────────────────────────
// RENDERIZAR TABLA
// ─────────────────────────────────────────────

// Genera dinámicamente las filas de la tabla de equipos.
function renderizarTabla(equipos) {


  // Obtiene el elemento donde se insertarán las filas de la tabla.
  const tbody = document.getElementById('tablaEquiposCuerpo');


  // Verifica que exista el cuerpo de la tabla antes de continuar.
  if (!tbody) {

    console.error('No existe tablaEquiposCuerpo');
    return;

  }


  // Comprueba si la lista de equipos está vacía.
  if (equipos.length === 0) {


    // Muestra un mensaje cuando no existen registros disponibles.
    tbody.innerHTML = `
      <tr>
        <td colspan="7"
            style="text-align:center; padding:24px; color:#9CA3AF;">
          No hay equipos registrados
        </td>
      </tr>
    `;

    return;

  }



  // Genera las filas de la tabla utilizando la información de cada equipo.
  tbody.innerHTML = equipos.map((e) => `
  <tr>


    <!-- Muestra el identificador del equipo. -->
    <td>${e.id}</td>


    <!-- Muestra el nombre del equipo registrado. -->
    <td>
      <strong>${e.nombre}</strong>
    </td>


    <!-- Muestra el tipo de equipo. -->
    <td>${e.tipo}</td>


    <!-- Muestra la ubicación donde se encuentra el equipo. -->
    <td>${e.ubicacion}</td>


    <!-- Muestra la potencia del equipo con dos decimales. -->
    <td style="text-align:right;">
      ${Number(e.potencia_kw).toFixed(2)}
    </td>



    <!-- ESTADO -->

    <!-- Muestra visualmente el estado actual del equipo. -->
    <td>


      <!-- Estado activo del equipo. -->
      ${
        e.estado === 'activo'
        ? '<span class="badge badge-verde">Activo</span>'
        : ''
      }


      <!-- Estado inactivo del equipo. -->
      ${
        e.estado === 'inactivo'
        ? '<span class="badge badge-gris">Inactivo</span>'
        : ''
      }


      <!-- Estado de mantenimiento del equipo. -->
      ${
        e.estado === 'mantenimiento'
        ? '<span class="badge badge-amarillo">Mantenimiento</span>'
        : ''
      }


    </td>



    <!-- CONTROL -->

    <!-- Contiene las acciones disponibles según el estado del equipo. -->
    <td>


      <!-- Botón para desactivar un equipo activo. -->
      ${
        e.estado === 'activo'
        ? `
          <button
            class="btn btn-outline"
            onclick="cambiarEstado(${e.id}, 'inactivo')"
          >
            ⏸️ Desactivar
          </button>
        `
        : ''
      }


      <!-- Botón para activar un equipo inactivo. -->
      ${
        e.estado === 'inactivo'
        ? `
          <button
            class="btn btn-primario"
            onclick="cambiarEstado(${e.id}, 'activo')"
          >
            ▶️ Activar
          </button>
        `
        : ''
      }


      <!-- Indica que los equipos en mantenimiento son gestionados mediante incidencias. -->
      ${
        e.estado === 'mantenimiento'
        ? `
          <span class="text-muted">
            Gestionado por incidencias
          </span>
        `
        : ''
      }


    </td>



    <!-- ACCIÓN -->

    <!-- Contiene acciones adicionales sobre el equipo. -->
    <td>


      <!-- Botón encargado de eliminar un equipo. -->
      <button
        class="btn btn-outline"
        onclick="eliminarEquipo(${e.id})"
      >
        🗑️ Eliminar
      </button>


    </td>


  </tr>
`).join('');

}



// ─────────────────────────────────────────────
// ABRIR / CERRAR FORMULARIO
// ─────────────────────────────────────────────


// Muestra el formulario para registrar un nuevo equipo.
function abrirFormulario() {

  document.getElementById('formNuevoEquipo').style.display = 'block';

}


// Oculta el formulario de registro de equipos.
function cerrarFormulario() {

  document.getElementById('formNuevoEquipo').style.display = 'none';

}



// ─────────────────────────────────────────────
// GUARDAR EQUIPO
// ─────────────────────────────────────────────


// Envía la información de un nuevo equipo al servidor.
async function guardarEquipo() {


  // Obtiene los valores ingresados por el usuario en el formulario.
  const nombre = document.getElementById('equipoNombre').value.trim();
  const tipo = document.getElementById('equipoTipo').value;
  const ubicacion = document.getElementById('equipoUbicacion').value.trim();
  const potencia = parseFloat(document.getElementById('equipoPotencia').value);


  // Verifica que todos los campos obligatorios tengan información válida.
  if (!nombre || !tipo || !ubicacion || isNaN(potencia)) {

    toast('Completa todos los campos', 'warning');
    return;

  }


  try {


    // Envía la información del nuevo equipo mediante una solicitud POST.
    const resp = await fetch('/api/equipos', {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({

        nombre,
        tipo,
        ubicacion,
        potencia_kw: potencia

      })

    });


    // Obtiene la respuesta del servidor.
    const datos = await resp.json();



    // Comprueba si el registro fue exitoso.
    if (datos.exito) {


      toast('Equipo registrado correctamente', 'exito');


      // Limpia el formulario y actualiza la tabla.
      limpiarFormulario();
      cerrarFormulario();
      cargarEquipos();


    } else {


      toast(datos.mensaje || 'No se pudo registrar', 'error');

    }



  } catch (error) {


    // Captura errores relacionados con la comunicación con el servidor.
    console.error(error);

    toast('Error del servidor', 'error');

  }

}



// ─────────────────────────────────────────────
// ELIMINAR EQUIPO
// ─────────────────────────────────────────────


// Elimina un equipo mediante su identificador.
async function eliminarEquipo(id) {


  // Solicita confirmación antes de eliminar el registro.
  if (!confirm('¿Eliminar equipo?')) {

    return;

  }


  try {


    // Envía una petición DELETE al servidor.
    const resp = await fetch(`/api/equipos/${id}`, {

      method: 'DELETE'

    });


    // Obtiene la respuesta del servidor.
    const data = await resp.json();



    // Comprueba si la eliminación fue correcta.
    if (data.exito) {


      toast('Equipo eliminado', 'exito');


      // Actualiza la tabla después de eliminar.
      cargarEquipos();


    } else {


      toast(data.mensaje || 'No se pudo eliminar', 'error');

    }



  } catch (error) {


    console.error(error);

    toast('Error del servidor', 'error');

  }

}



// ─────────────────────────────────────────────
// LIMPIAR FORMULARIO
// ─────────────────────────────────────────────


// Restablece los campos del formulario a sus valores iniciales.
function limpiarFormulario() {

  document.getElementById('equipoNombre').value = '';
  document.getElementById('equipoTipo').value = '';
  document.getElementById('equipoUbicacion').value = '';
  document.getElementById('equipoPotencia').value = '';

}



// ─────────────────────────────────────────────
// CAMBIAR ESTADO
// ─────────────────────────────────────────────


// Actualiza el estado de un equipo específico.
async function cambiarEstado(id, estado) {


  try {


    // Envía la actualización del estado mediante una petición PATCH.
    const resp = await fetch(`/api/equipos/${id}/estado`, {

      method: 'PATCH',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({ estado })

    });


    // Obtiene la respuesta del servidor.
    const data = await resp.json();



    // Verifica si la actualización fue exitosa.
    if (data.exito) {


      toast('Estado actualizado', 'exito');


      // Recarga la tabla para mostrar el nuevo estado del equipo.
      cargarEquipos();


    } else {


      toast(data.mensaje || 'Error al actualizar', 'error');

    }



  } catch (error) {


    // Muestra errores relacionados con la conexión.
    console.error(error);

    toast('Error de conexión', 'error');

  }

}