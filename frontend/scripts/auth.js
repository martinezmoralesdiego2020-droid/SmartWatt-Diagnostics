// frontend/scripts/auth.js

/**
 * Envía las credenciales al backend Flask y redirige según el rol.
 */
async function iniciarSesion() {
  const usuario    = document.getElementById('usuario').value.trim();
  const contrasena = document.getElementById('contrasena').value.trim();
  const errorDiv   = document.getElementById('mensajeError');

  // Validación básica en el cliente (M2 — Captura y validación)
  if (!usuario || !contrasena) {
    mostrarError('Por favor completa todos los campos.');
    return;
  }

  try {
    const respuesta = await fetch('/api/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ usuario, contrasena })
    });

    const datos = await respuesta.json();

    if (datos.exito) {
      // Guardar sesión en localStorage
      localStorage.setItem('usuario_id',   datos.id);
      localStorage.setItem('usuario_nombre', datos.nombre);
      localStorage.setItem('usuario_rol',    datos.rol);

      // Redirigir según el rol
      if (datos.rol === 'ingeniero') {
        window.location.href = '/pages/dashboard.html';
      } else {
        window.location.href = '/pages/registro_consumo.html';
      }
    } else {
      mostrarError(datos.mensaje || 'Credenciales incorrectas.');
    }

  } catch (error) {
    mostrarError('No se pudo conectar con el servidor. Intenta de nuevo.');
    console.error('[Auth] Error:', error);
  }
}

function mostrarError(mensaje) {
  const div = document.getElementById('mensajeError');
  div.textContent = mensaje;
  div.classList.add('visible');
  setTimeout(() => div.classList.remove('visible'), 4000);
}

// Permitir login con Enter
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') iniciarSesion();
});