// ─────────────────────────────────────────────
//  Verificar sesión
// ─────────────────────────────────────────────
function verificarSesion() {
  const usuarioId = localStorage.getItem('usuario_id');

  if (!usuarioId) {
    window.location.href = '/pages/login.html';
  }
}

// ─────────────────────────────────────────────
//  Mostrar nombre del usuario
// ─────────────────────────────────────────────
function mostrarNombreUsuario() {
  const nombre = localStorage.getItem('usuario_nombre') || '';
  const el = document.getElementById('usuarioNombre');

  if (el && nombre) {
    el.textContent = nombre;
  }
}

// ─────────────────────────────────────────────
//  Sidebar (activo + nombre)
// ─────────────────────────────────────────────
function initSidebar(paginaActiva) {

  // Marcar opción activa
  document.querySelectorAll('.nav-item').forEach(link => {
    link.classList.remove('activo');

    if (link.href.includes(paginaActiva)) {
      link.classList.add('activo');
    }
  });

  // Mostrar nombre
  mostrarNombreUsuario();
}

// ─────────────────────────────────────────────
//  Cerrar sesión
// ─────────────────────────────────────────────
function cerrarSesion() {
  localStorage.removeItem('usuario_id');
  localStorage.removeItem('usuario_nombre');
  localStorage.removeItem('usuario_rol');

  window.location.href = '/pages/login.html';
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

  return new Date(fecha.replace(' ', 'T'))
    .toLocaleString('es-MX');
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