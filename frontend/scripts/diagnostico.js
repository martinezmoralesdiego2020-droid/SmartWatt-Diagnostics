// ─────────────────────────────────────────────
// Estado global
// ─────────────────────────────────────────────
let todasIncidencias = [];
let todosEquipos = [];

// ─────────────────────────────────────────────
// Inicialización
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSidebar('diagnostico');
  cargarDiagnostico();
});

// ─────────────────────────────────────────────
// CARGAR DIAGNÓSTICO
// ─────────────────────────────────────────────
async function cargarDiagnostico() {

  try {

    const [respIncidencias, respEquipos] = await Promise.all([
      fetch('/api/incidencias'),
      fetch('/api/equipos')
    ]);

    todasIncidencias = await respIncidencias.json();
    todosEquipos = await respEquipos.json();

    // Mostrar solo incidencias NO resueltas
    renderizarTabla(
      todasIncidencias.filter(i => i.estado !== 'resuelta')
    );

    actualizarKPIs();

  } catch (e) {

    console.error('[Diagnóstico]', e);

  }
}

// ─────────────────────────────────────────────
// KPIs
// ─────────────────────────────────────────────
function actualizarKPIs() {

  const normales = todosEquipos.filter(
    e => e.estado === 'activo'
  ).length;

const equiposAlerta = new Set();

todasIncidencias.forEach(i => {

  if (
    ['baja', 'media', 'alta'].includes(i.severidad) &&
    i.estado !== 'resuelta'
  ) {
    equiposAlerta.add(i.equipo_id);
  }
});

// También agregar equipos en mantenimiento
todosEquipos.forEach(e => {

  if (e.estado === 'mantenimiento') {
    equiposAlerta.add(e.id);
  }
});

const alertas = equiposAlerta.size;
  const inactivos = todosEquipos.filter(
    e => e.estado === 'inactivo'
  ).length;

  // Equipos con incidencias críticas abiertas
  const equiposCriticos = new Set();

  todasIncidencias.forEach(i => {

    if (
      i.severidad === 'critica' &&
      i.estado !== 'resuelta'
    ) {
      equiposCriticos.add(i.equipo_id);
    }
  });

  document.getElementById('diag-normal').textContent =
    normales;

  document.getElementById('diag-alerta').textContent =
    alertas;

  document.getElementById('diag-critico').textContent =
    equiposCriticos.size;

  document.getElementById('diag-sin-datos').textContent =
    inactivos;
}

// ─────────────────────────────────────────────
// Filtro
// ─────────────────────────────────────────────
function filtrarIncidencias() {

  const filtro = document.getElementById('filtro-diag').value;

  let filtradas = [];

  // NORMAL
  if (filtro === 'normal') {

  const equiposNormales = todosEquipos.filter(e => {

    // Debe estar activo
    if (e.estado !== 'activo') {
      return false;
    }

    // Buscar incidencias abiertas
    const tieneIncidenciasAbiertas = todasIncidencias.some(i => {

      return (
        i.equipo_id === e.id &&
        i.estado !== 'resuelta'
      );
    });

    // Normal = NO tiene incidencias abiertas
    return !tieneIncidenciasAbiertas;
  });

  filtradas = equiposNormales.map(e => ({
    id: null,
    equipo_nombre: e.nombre,
    descripcion: 'Operando correctamente',
    severidad: 'baja',
    estado: 'resuelta',
    fecha_reporte: null
  }));
}

  // ALERTA
  else if (filtro === 'alerta') {

    filtradas = todasIncidencias.filter(i => {

      return (
        ['baja', 'media', 'alta'].includes(i.severidad) &&
        i.estado !== 'resuelta'
      );
    });
  }

  // CRÍTICO
  else if (filtro === 'critico') {

    filtradas = todasIncidencias.filter(i => {

      return (
        i.severidad === 'critica' &&
        i.estado !== 'resuelta'
      );
    });
  }

  // INACTIVO
  else if (filtro === 'inactivo') {

    filtradas = todasIncidencias.filter(i => {

      const equipo = todosEquipos.find(
        e => e.id === i.equipo_id
      );

      return equipo?.estado === 'inactivo';
    });
  }

  // TODOS
  else {

    filtradas = todasIncidencias.filter(
      i => i.estado !== 'resuelta'
    );
  }

  renderizarTabla(filtradas);
}

function filtrarDiag() {
  filtrarIncidencias();
}

// ─────────────────────────────────────────────
// Render tabla
// ─────────────────────────────────────────────
function renderizarTabla(lista) {

  const tbody = document.getElementById(
    'tabla-diag-incidencias'
  );

  if (!tbody) return;

  if (lista.length === 0) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="tabla-vacia">
          Sin incidencias activas
        </td>
      </tr>
    `;

    return;
  }

tbody.innerHTML = lista.map(i => {

  const esVirtual = !i.id;

  return `

    <tr>

      <td>${i.equipo_nombre || '—'}</td>

      <td>${i.descripcion}</td>

      <td>
        ${esVirtual
          ? '<span class="badge badge-verde">Normal</span>'
          : badgeSeveridad(i.severidad)
        }
      </td>

      <td>
        ${esVirtual
          ? '<span class="badge badge-verde">Operando</span>'
          : badgeEstado(i.estado)
        }
      </td>

      <td>
        ${i.fecha_reporte
          ? formatFecha(i.fecha_reporte)
          : '—'
        }
      </td>

      <td>

        ${esVirtual
          ? '—'
          : `
            <select
              class="form-control"
              onchange="cambiarEstadoIncidencia(${i.id}, this.value)"
            >

              <option value="abierta"
                ${i.estado === 'abierta' ? 'selected' : ''}>
                Abierta
              </option>

              <option value="en_proceso"
                ${i.estado === 'en_proceso' ? 'selected' : ''}>
                En proceso
              </option>

              <option value="resuelta"
                ${i.estado === 'resuelta' ? 'selected' : ''}>
                Resuelta
              </option>

            </select>
          `
        }

      </td>

    </tr>

  `;

}).join('');
}


// ─────────────────────────────────────────────
// Cambiar estado incidencia
// ─────────────────────────────────────────────
async function cambiarEstadoIncidencia(id, estado) {

  try {

    const resp = await fetch(
      `/api/incidencias/${id}/estado`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado })
      }
    );

    const data = await resp.json();

    if (data.exito) {

      toast('Estado actualizado', 'exito');

      cargarDiagnostico();

    } else {

      toast(
        data.mensaje || 'No se pudo actualizar',
        'error'
      );
    }

  } catch (e) {

    console.error(e);

    toast('Error del servidor', 'error');
  }
}
