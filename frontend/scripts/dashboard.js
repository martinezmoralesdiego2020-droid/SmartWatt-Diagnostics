// frontend/scripts/dashboard.js
// M1 Interfaz + M4 Análisis energético — Dashboard del ingeniero
// Este módulo gestiona la visualización de indicadores clave (KPIs),
// gráficas de consumo y listado de incidencias recientes.


// Instancias globales de las gráficas (Chart.js)
let graficaEquipos = null;
let graficaTendencia = null;



// ─────────────────────────────────────────────────────────────
// Inicialización del dashboard
// Se ejecuta cuando el DOM ha sido completamente cargado
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

  // Verifica que el usuario tenga sesión activa y rol de ingeniero
  verificarSesion('ingeniero');

  // Inicializa la barra lateral del sistema
  initSidebar('dashboard');

  // Muestra la fecha actual en formato legible (es-MX)
  document.getElementById('fecha-actual').textContent =
    new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  // Carga en paralelo los datos principales del dashboard
  await Promise.all([
    cargarResumen(),
    cargarIncidenciasRecientes()
  ]);

});



// ─────────────────────────────────────────────────────────────
// Carga de KPIs y gráficas principales del dashboard
// Fuente de datos: /api/dashboard/resumen
// ─────────────────────────────────────────────────────────────
async function cargarResumen() {

  try {

    // Solicita datos resumidos al backend
    const resp = await fetch('/api/dashboard/resumen');

    // Convierte la respuesta a formato JSON
    const data = await resp.json();

    // ── KPIs principales ────────────────────────────────

    document.getElementById('kpi-kwh').textContent =
      data.total_kwh_mes.toLocaleString('es-MX');

    document.getElementById('kpi-equipos').textContent =
      data.equipos_activos;

    document.getElementById('kpi-incidencias').textContent =
      data.incidencias_abiertas;

    document.getElementById('kpi-criticas').textContent =
      data.incidencias_criticas ?? 0;

    // ── Gráfica de barras: consumo por equipo ───────────

    const nombres = data.consumo_por_equipo.map(e => e.nombre);
    const valores = data.consumo_por_equipo.map(e => e.total_kwh);

    renderGraficaBarras('grafica-equipos', nombres, valores);

    // ── Gráfica de línea: tendencia de consumo ──────────
    // Si no existen datos reales, se genera información de demostración

    const tendencia = data.tendencia_diaria ?? generarTendenciaDemo();

    renderGraficaLinea(
      'grafica-tendencia',
      tendencia.etiquetas,
      tendencia.valores
    );

  } catch (e) {

    // Registro de errores en consola para depuración
    console.error('[Dashboard] Error al cargar resumen:', e);

  }

}



// ─────────────────────────────────────────────────────────────
// Carga de incidencias recientes
// Fuente de datos: /api/incidencias
// ─────────────────────────────────────────────────────────────
async function cargarIncidenciasRecientes() {

  try {

    // Solicita listado de incidencias al servidor
    const resp = await fetch('/api/incidencias');

    // Convierte la respuesta a JSON
    const lista = await resp.json();

    // Obtiene el cuerpo de la tabla en el DOM
    const tbody = document.getElementById('tabla-incidencias');

    // Si no existen incidencias registradas
    if (!lista.length) {
      tbody.innerHTML =
        '<tr><td class="tabla-vacia" colspan="5">Sin incidencias registradas</td></tr>';
      return;
    }

    // Muestra únicamente las 6 incidencias más recientes
    tbody.innerHTML = lista.slice(0, 6).map(i => `
      <tr>

        <td><strong>${i.equipo_nombre}</strong></td>

        <td style="max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          ${i.descripcion}
        </td>

        <td>${badgeSeveridad(i.severidad)}</td>

        <td>${badgeEstado(i.estado)}</td>

        <td class="text-muted">${formatFecha(i.fecha_reporte)}</td>

      </tr>
    `).join('');

  } catch (e) {

    // Manejo de errores en la carga de incidencias
    console.error('[Dashboard] Error al cargar incidencias:', e);

  }

}



// ─────────────────────────────────────────────────────────────
// Gráfica de barras — consumo por equipo
// Utiliza Chart.js para representar datos comparativos
// ─────────────────────────────────────────────────────────────
function renderGraficaBarras(canvasId, etiquetas, valores) {

  const ctx = document.getElementById(canvasId).getContext('2d');

  // Elimina gráfica anterior si existe
  if (graficaEquipos) {
    graficaEquipos.destroy();
  }

  // Crea nueva instancia de gráfica de barras
  graficaEquipos = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: etiquetas,
      datasets: [{
        label: 'kWh consumidos',
        data: valores,
        backgroundColor: [
          '#1E5AA8', '#22C55E', '#FACC15',
          '#EF4444', '#0B1F3B', '#A7F3D0'
        ],
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });

}



// ─────────────────────────────────────────────────────────────
// Gráfica de línea — tendencia de consumo
// Representa la evolución del consumo energético en el tiempo
// ─────────────────────────────────────────────────────────────
function renderGraficaLinea(canvasId, etiquetas, valores) {

  const ctx = document.getElementById(canvasId).getContext('2d');

  // Elimina gráfica previa si existe
  if (graficaTendencia) {
    graficaTendencia.destroy();
  }

  // Crea nueva gráfica de línea
  graficaTendencia = new Chart(ctx, {
    type: 'line',
    data: {
      labels: etiquetas,
      datasets: [{
        label: 'kWh',
        data: valores,
        borderColor: '#1E5AA8',
        backgroundColor: 'rgba(30,90,168,0.07)',
        borderWidth: 2,
        pointBackgroundColor: '#1E5AA8',
        pointRadius: 4,
        tension: 0.35,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });

}



// ─────────────────────────────────────────────────────────────
// Generador de datos de demostración para la tendencia semanal
// Se utiliza cuando no hay datos reales disponibles
// ─────────────────────────────────────────────────────────────
function generarTendenciaDemo() {

  const hoy = new Date();

  const etiquetas = [];
  const valores = [];

  // Genera datos de los últimos 7 días
  for (let i = 6; i >= 0; i--) {

    const d = new Date(hoy);
    d.setDate(hoy.getDate() - i);

    etiquetas.push(
      d.toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric'
      })
    );

    valores.push(Math.round(120 + Math.random() * 80));

  }

  return { etiquetas, valores };

}