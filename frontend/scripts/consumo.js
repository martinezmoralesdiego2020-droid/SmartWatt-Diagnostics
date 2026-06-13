// frontend/scripts/consumo.js


// ============================================================
// Módulo M4 — Consumo Energético:
// Permite realizar el monitoreo de consumo energético,
// consultar historial de lecturas y registrar nuevos consumos.
//
// Endpoints utilizados:
// GET  /api/equipos           — Obtiene la lista de equipos registrados.
// GET  /api/consumo           — Obtiene el historial de consumo.
// POST /api/consumo           — Registra una nueva lectura.
// GET  /api/consumo/tendencia — Obtiene datos de tendencia.
// ============================================================



'use strict';



// ── Estado del módulo ──────────────────────────────────────

// Almacena la lista de equipos disponibles para el monitoreo.
let listaEquiposConsumo = [];


// Guarda la instancia actual de la gráfica para poder actualizarla.
let graficaConsumo = null;


// Controla el intervalo utilizado para la actualización automática.
let intervaloRefresh = null;


// Indica si la actualización automática está activa.
let autoRefreshActivo = false;





// ── Inicialización ─────────────────────────────────────────

// Ejecuta las funciones iniciales cuando la página termina de cargar.
document.addEventListener('DOMContentLoaded', () => {


  // Inicializa la barra lateral correspondiente al módulo de monitoreo.
  initSidebar('monitoreo');


  // Carga los equipos disponibles en el selector.
  cargarEquiposSelector();


  // Obtiene el historial inicial de consumos.
  cargarHistorialConsumo();


  // Actualiza la información de la última actualización.
  actualizarTimestampMonitoreo();


});





// ── Cargar equipos para el selector ────────────────────────

// Obtiene los equipos registrados y los coloca en los selectores disponibles.
async function cargarEquiposSelector() {


  try {


    // Solicita al servidor la lista de equipos.
    const res = await fetch('/api/equipos');


    // Convierte la respuesta obtenida a formato JSON.
    listaEquiposConsumo = await res.json();



    // Recorre los selectores que necesitan la información de equipos.
    ['selector-equipo', 'nuevo-equipo-id'].forEach(id => {


      // Obtiene el elemento HTML correspondiente.
      const sel = document.getElementById(id);



      // Si el elemento no existe, continúa con el siguiente.
      if (!sel) return;



      // Genera dinámicamente las opciones del selector.
      sel.innerHTML =
        '<option value="">— Seleccionar equipo —</option>' +
        listaEquiposConsumo.map(e =>
          `<option value="${e.id}">${e.nombre} (${e.ubicacion})</option>`
        ).join('');


    });



  } catch (err) {


    // Registra errores ocurridos durante la carga.
    console.error('[Consumo] Error al cargar equipos:', err);


    // Muestra una notificación al usuario.
    toast('No se pudieron cargar los equipos.', 'error');


  }


}






// ── Historial de consumo ───────────────────────────────────

// Obtiene los registros históricos de consumo.
// Puede recibir un equipo específico para aplicar un filtro.
async function cargarHistorialConsumo(equipoId = null) {


  // Muestra un indicador de carga mientras se obtienen los datos.
  setLoading('tabla-consumo-wrapper', true);



  try {


    // Define la dirección inicial de consulta.
    let url = '/api/consumo';



    // Agrega el filtro del equipo cuando existe.
    if (equipoId) url += `?equipo_id=${equipoId}`;



    // Realiza la solicitud al servidor.
    const res = await fetch(url);



    // Verifica que la respuesta sea válida.
    if (!res.ok) {

      throw new Error(`HTTP ${res.status}`);

    }



    // Convierte la respuesta en formato JSON.
    const datos = await res.json();



    // Actualiza la tabla con los registros obtenidos.
    renderTablaConsumo(datos);



    // Actualiza los indicadores principales.
    actualizarKPIs(datos);



    // Genera la gráfica cuando existe un equipo seleccionado.
    if (equipoId) {

      renderGraficaConsumoEquipo(datos, equipoId);

    }



  } catch (err) {


    // Muestra errores relacionados con la consulta.
    console.error('[Consumo] Error al cargar historial:', err);


    toast('No se pudo cargar el historial de consumo.', 'error');



  } finally {


    // Oculta el indicador de carga.
    setLoading('tabla-consumo-wrapper', false);



    // Actualiza la hora de consulta.
    actualizarTimestampMonitoreo();


  }


}






// ── Renderizar tabla de historial ──────────────────────────

// Construye dinámicamente las filas de la tabla de consumos.
function renderTablaConsumo(datos) {


  // Obtiene el cuerpo de la tabla.
  const tbody = document.getElementById('tablaConsumoCuerpo');


  // Obtiene el contador de registros si existe.
  const total = document.getElementById('total-registros');



  // Finaliza si la tabla no existe.
  if (!tbody) return;



  // Actualiza la cantidad total de registros.
  if (total) total.textContent = `${datos.length} registros`;



  // Muestra un mensaje cuando no existen datos.
  if (datos.length === 0) {


    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="estado-vacio">
            <div class="estado-vacio-icono">⚡</div>
            <div class="estado-vacio-titulo">Sin registros de consumo</div>
            <div class="estado-vacio-desc">Registra la primera lectura energética.</div>
          </div>
        </td>
      </tr>
    `;


    return;


  }




  // Genera las filas utilizando la información recibida.
  tbody.innerHTML = datos.map((c, i) => `

  <tr>

    <td>${i + 1}</td>

    <td class="font-semibold">${c.equipo_nombre || '—'}</td>

    <td class="text-right">${formatNum(c.kwh_consumidos, 3)} kWh</td>

    <td class="text-right">${c.voltaje ? formatNum(c.voltaje, 1) + ' V' : '—'}</td>

    <td class="text-right">${c.corriente ? formatNum(c.corriente, 2) + ' A' : '—'}</td>

    <td class="text-right">${c.factor_potencia ? formatNum(c.factor_potencia, 3) : '—'}</td>

    <td>${formatFecha(c.fecha_registro)}</td>

  </tr>

`).join('');


}






// Actualiza los indicadores principales del módulo.
function actualizarKPIs(datos) {


  // Si no existen datos, restablece los valores iniciales.
  if (!datos || datos.length === 0) {


    document.getElementById('kpiUltimoKwh').innerHTML =
      `—<span class="kpi-unidad">kWh</span>`;


    document.getElementById('kpiUltimoEquipo').textContent = '—';


    document.getElementById('kpiRegistrosHoy').textContent = '0';


    document.getElementById('kpiPromedioHoy').textContent = '0';


    return;


  }



  // Obtiene el registro más reciente.
  const ultimo = datos[0];



  // Actualiza el consumo más reciente mostrado.
  document.getElementById('kpiUltimoKwh').innerHTML =
    `${formatNum(ultimo.kwh_consumidos || 0, 3)}<span class="kpi-unidad">kWh</span>`;



  // Muestra el equipo asociado al último registro.
  document.getElementById('kpiUltimoEquipo').textContent =
    ultimo.equipo_nombre || '—';





  // Obtiene la fecha actual para filtrar registros del día.
  const hoy = new Date().toISOString().split('T')[0];



  // Filtra únicamente los consumos realizados durante el día actual.
  const hoyDatos = datos.filter(d =>
    d.fecha_registro && d.fecha_registro.startsWith(hoy)
  );



  // Actualiza el número de registros realizados hoy.
  document.getElementById('kpiRegistrosHoy').textContent =
    hoyDatos.length;



  // Calcula el promedio de consumo del día.
  const promedio =
    hoyDatos.reduce((sum, d) => sum + (d.kwh_consumidos || 0), 0) /
    (hoyDatos.length || 1);



  // Muestra el promedio calculado.
  document.getElementById('kpiPromedioHoy').textContent =
    formatNum(promedio, 2);


}






// ── Gráfica de consumo ─────────────────────────────────────

// Genera la gráfica de tendencia de consumo de un equipo específico.
function renderGraficaConsumoEquipo(datos, equipoId) {


  // Obtiene el elemento canvas donde se dibuja la gráfica.
  const canvas = document.getElementById('graficaMonitoreo');


  // Finaliza si no existe el elemento gráfico.
  if (!canvas) return;



  // Filtra los registros correspondientes al equipo seleccionado.
  const filtrado = datos
    .filter(c => c.equipo_id === parseInt(equipoId))
    .slice(0, 20)
    .reverse();



  // Genera las etiquetas de tiempo para la gráfica.
  const etiquetas = filtrado.map(c =>
    new Date(c.fecha_registro.replace(' ', 'T'))
      .toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  );



  // Obtiene los valores de consumo energético.
  const kwh = filtrado.map(c => parseFloat(c.kwh_consumidos));



  // Obtiene el contexto gráfico del canvas.
  const ctx = canvas.getContext('2d');



  // Elimina una gráfica existente antes de crear una nueva.
  if (graficaConsumo) graficaConsumo.destroy();



  // Crea la nueva gráfica utilizando Chart.js.
  graficaConsumo = new Chart(ctx, {

    type: 'line',

    data: {

      labels: etiquetas,

      datasets: [{

        label: 'kWh registrados',

        data: kwh,

        borderColor: '#06B6D4',

        backgroundColor: 'rgba(6,182,212,0.08)',

        fill: true,

        tension: 0.35

      }]

    }

  });


}






// Filtra el historial según el equipo seleccionado.
function filtrarPorEquipo() {


  // Obtiene el identificador del equipo seleccionado.
  const id = document.getElementById('selector-equipo')?.value;


  // Recarga el historial aplicando el filtro correspondiente.
  cargarHistorialConsumo(id || null);


}






// Registra un nuevo consumo energético.
async function registrarConsumo() {


  // Obtiene los datos ingresados.
  const equipoId = parseInt(document.getElementById('nuevo-equipo-id').value);

  const kwh = parseFloat(document.getElementById('nuevo-kwh').value);

  const tecnicoId = parseInt(localStorage.getItem('usuario_id')) || null;



  // Valida los datos obligatorios.
  if (!equipoId || isNaN(kwh) || kwh <= 0) {

    toast('Datos inválidos.', 'error');

    return;

  }



  try {


    // Envía el nuevo consumo al servidor.
    const res = await fetch('/api/consumo', {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({
        equipo_id: equipoId,
        kwh_consumidos: kwh,
        tecnico_id: tecnicoId
      })

    });



    // Obtiene la respuesta del servidor.
    const datos = await res.json();



    // Verifica si el registro fue exitoso.
    if (datos.exito) {


      toast('Consumo registrado correctamente.', 'exito');


      // Actualiza la información mostrada.
      await cargarHistorialConsumo();


    } else {


      toast(datos.mensaje || 'Error al registrar.', 'error');


    }



  } catch (err) {


    console.error(err);


    toast('Error de conexión.', 'error');


  }


}






// ── Auto refresh ──────────────────────────────────────────

// Activa o desactiva la actualización automática del monitoreo.
function toggleAutoRefresh() {


  // Cambia el estado actual del modo automático.
  autoRefreshActivo = !autoRefreshActivo;



  if (autoRefreshActivo) {


    // Ejecuta una actualización cada 30 segundos.
    intervaloRefresh = setInterval(() => {


      const equipoId = document.getElementById('selector-equipo')?.value || null;


      cargarHistorialConsumo(equipoId);


    }, 30000);



    toast('Auto-actualización activada', 'info');


  } else {


    // Detiene el intervalo de actualización.
    clearInterval(intervaloRefresh);



    toast('Auto-actualización detenida', 'info');


  }


}





// Actualiza la fecha y hora de la última consulta realizada.
function actualizarTimestampMonitoreo() {


  const el = document.getElementById('ts-monitoreo');


  if (el) {


    el.textContent =
      'Última actualización: ' + new Date().toLocaleTimeString('es-MX');


  }


}





// Detiene la actualización automática cuando se abandona la página.
window.addEventListener('beforeunload', () => clearInterval(intervaloRefresh));