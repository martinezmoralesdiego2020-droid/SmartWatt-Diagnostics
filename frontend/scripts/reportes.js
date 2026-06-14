// frontend/scripts/reportes.js

// ── Estado global ───────────────────────────────────────────
let datosReporte = [];

// ── Inicialización ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSidebar('reportes'); // 👈 CLAVE (reemplaza todo lo que quitamos)
  establecerFechasDefault();
});

/**
 * Establece fecha_inicio = primer día del mes actual, fecha_fin = hoy.
 */
function establecerFechasDefault() {
  const hoy = new Date();
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  document.getElementById('fechaInicio').value = formatearFechaInput(primerDia);
  document.getElementById('fechaFin').value    = formatearFechaInput(hoy);
}

function formatearFechaInput(fecha) {
  return fecha.toISOString().split('T')[0];
}

// ── Generación del reporte ──────────────────────────────────
async function generarReporte() {
  const fechaInicio = document.getElementById('fechaInicio').value;
  const fechaFin    = document.getElementById('fechaFin').value;
  const btnGenerar  = document.getElementById('btnGenerar');

  if (!fechaInicio || !fechaFin) {
    toast('Selecciona ambas fechas.', 'warning');
    return;
  }

  if (fechaInicio > fechaFin) {
    toast('La fecha inicio no puede ser mayor a la final.', 'error');
    return;
  }

  btnGenerar.disabled = true;
  btnGenerar.textContent = 'Generando…';

  try {
    const params = new URLSearchParams({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    });

    const respuesta = await fetch(`/api/reportes/consumo?${params}`);

    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

    datosReporte = await respuesta.json();

    renderizarTabla(datosReporte);
    actualizarResumen(datosReporte);

    document.getElementById('seccionResultados').style.display = 'block';

    toast(`Reporte generado (${datosReporte.length} equipos)`, 'exito');

  } catch (error) {
    console.error('[Reportes] Error:', error);
    toast('Error al generar el reporte.', 'error');

  } finally {
    btnGenerar.disabled = false;
    btnGenerar.textContent = '📊 Generar reporte';
  }
}

// ── Tabla ───────────────────────────────────────────────────
function renderizarTabla(datos) {
  const tbody = document.getElementById('tablaReporteCuerpo');
  tbody.innerHTML = '';

  if (datos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:32px; color:#9CA3AF;">
          No hay datos para el período seleccionado.
        </td>
      </tr>`;
    return;
  }

  datos.forEach(fila => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fila.equipo || '—'}</td>
      <td>${fila.tipo || '—'}</td>
      <td>${fila.ubicacion || '—'}</td>
      <td style="text-align:center;">${fila.registros ?? 0}</td>
      <td style="text-align:right; font-weight:600;">
        ${fila.total_kwh?.toFixed(2) || '0.00'}
      </td>
      <td style="text-align:right;">
        ${fila.promedio_kwh?.toFixed(2) || '0.00'}
      </td>
      <td style="text-align:right;">
        ${fila.max_kwh?.toFixed(2) || '0.00'}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Resumen ─────────────────────────────────────────────────
function actualizarResumen(datos) {
  const totalKwh = datos.reduce((s, f) => s + (f.total_kwh || 0), 0);
  const totalRegistros = datos.reduce((s, f) => s + (f.registros || 0), 0);
  const equipos = datos.filter(f => (f.registros || 0) > 0).length;

  document.getElementById('resumenTotalKwh').textContent = totalKwh.toFixed(2);
  document.getElementById('resumenRegistros').textContent = totalRegistros;
  document.getElementById('resumenEquiposActivos').textContent = equipos;
}

// ── Exportar PDF ────────────────────────────────────────────
function exportarPDF() {
  if (datosReporte.length === 0) {
    toast('Genera un reporte primero.', 'warning');
    return;
  }

  const fechaInicio = document.getElementById('fechaInicio').value;
  const fechaFin = document.getElementById('fechaFin').value;

  const url = `/api/reportes/consumo/pdf?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;

  const link = document.createElement('a');
  link.href = url;
  link.download = 'reporte_consumo.pdf';
  link.click();
}