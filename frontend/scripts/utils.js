// ─────────────────────────────────────────────
//  Verificar sesión
// ─────────────────────────────────────────────
async function verificarSesion() {
    try {
        const respuesta = await fetch('/api/session');

        if (!respuesta.ok) {
            window.location.href = '/pages/login.html';
            return null;
        }

        const datos = await respuesta.json();

        return datos;
    } catch (error) {
        console.error('Error al verificar la sesión:', error);
        window.location.href = '/pages/login.html';
        return null;
    }
}

// ─────────────────────────────────────────────
//  Mostrar nombre del usuario
// ─────────────────────────────────────────────
async function mostrarNombreUsuario() {
  try {
    const respuesta = await fetch('/api/session');

    if (!respuesta.ok) {
      return;
    }

    const datos = await respuesta.json();

    const el = document.getElementById('usuarioNombre');

    if (el && datos.autenticado) {
      el.textContent = datos.nombre || '';
    }

  } catch (error) {
    console.error('Error al obtener el nombre del usuario:', error);
  }
}

// ─────────────────────────────────────────────
//  Sidebar (activo + nombre)
// ─────────────────────────────────────────────
async function initSidebar(paginaActiva) {

  // Marcar opción activa
  document.querySelectorAll('.nav-item').forEach(link => {
    link.classList.remove('activo');

    if (link.href.includes(paginaActiva)) {
      link.classList.add('activo');
    }
  });

  // Mostrar nombre
  await mostrarNombreUsuario();
}

// ─────────────────────────────────────────────
//  Cerrar sesión
// ─────────────────────────────────────────────
async function cerrarSesion() {
    try {
        await fetch('/api/logout', {
            method: 'POST'
        });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }

    window.location.href = '/';
}

// ─────────────────────────────────────────────
//  Toast simple (para consumo.js)
// ─────────────────────────────────────────────
function toast(mensaje, tipo = 'info', tiempo = 3000) {
  console.log(`[${tipo.toUpperCase()}] ${mensaje}`);

  // Si quieres luego lo hacemos visual (bonito)
}

// ─────────────────────────────────────────────
//  Loading simple (evita errores)
// ─────────────────────────────────────────────
function setLoading(id, estado) {
  const el = document.getElementById(id);
  if (!el) return;

  if (estado) {
    el.style.opacity = '0.5';
    el.style.pointerEvents = 'none';
  } else {
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
  }
}

// ─────────────────────────────────────────────
// Formatear número
// ─────────────────────────────────────────────
function formatNum(num, decimales = 2) {
  return Number(num).toFixed(decimales);
}

// ─────────────────────────────────────────────
//  Formatear fecha
// ─────────────────────────────────────────────
function formatFecha(fecha) {
  if (!fecha) return '—';

  try {
    const fechaTexto = String(fecha).trim();

    // Formato enviado por Flask:
    // "Sat, 16 May 2026 23:13:51 GMT"
    const partes = fechaTexto.match(
      /^[A-Za-z]{3}, (\d{2}) ([A-Za-z]{3}) (\d{4})/
    );

    if (partes) {
      const meses = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11
      };

      const dia = parseInt(partes[1], 10);
      const mes = meses[partes[2]];
      const año = parseInt(partes[3], 10);

      if (mes === undefined) {
        return 'Fecha inválida';
      }

      return `${String(dia).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}/${año}`;
    }

    // Intento normal para otros formatos de fecha.
    const fechaObj = new Date(fechaTexto);

    if (Number.isNaN(fechaObj.getTime())) {
      console.warn('[Fecha] Fecha no válida:', fecha);
      return 'Fecha inválida';
    }

    return fechaObj.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

  } catch (error) {
    console.error('[Fecha] Error al formatear:', fecha, error);
    return 'Fecha inválida';
  }
}
// ─────────────────────────────────────────────
// Helpers visuales (BADGES)
// ─────────────────────────────────────────────
function badgeSeveridad(sev) {
  const clases = {
    baja: 'badge-azul',
    media: 'badge-amarillo',
    alta: 'badge-rojo',
    critica: 'badge-rojo'
  };
  return `<span class="badge ${clases[sev] || 'badge-gris'}">${sev}</span>`;
}

function badgeEstado(est) {
  const clases = {
    abierta: 'badge-rojo',
    en_proceso: 'badge-amarillo',
    resuelta: 'badge-verde'
  };

  const texto = {
    abierta: 'Abierta',
    en_proceso: 'En proceso',
    resuelta: 'Resuelta'
  };

  return `<span class="badge ${clases[est] || 'badge-gris'}">${texto[est] || est}</span>`;
}