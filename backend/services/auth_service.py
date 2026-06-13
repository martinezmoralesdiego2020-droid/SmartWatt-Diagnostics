# backend/services/auth_service.py

# Importar la función encargada de crear conexiones con la base de datos.
from ..database import get_connection

def autenticar_usuario(usuario, contrasena):
    """
    Valida credenciales y retorna datos del usuario o error.
    """

    # Validación inicial para evitar consultas innecesarias cuando faltan datos.
    if not usuario or not contrasena:
        return {"exito": False, "mensaje": "Usuario y contraseña requeridos"}

    conn = get_connection()
    cursor = conn.cursor()

    # Se consulta únicamente a usuarios activos para impedir accesos
    # de cuentas deshabilitadas dentro del sistema.
    cursor.execute(
        "SELECT id, nombre, rol FROM usuarios WHERE usuario=? AND contrasena=? AND activo=1",
        (usuario, contrasena)
    )

    fila = cursor.fetchone()
    conn.close()

    # Si existe coincidencia en la base de datos se devuelven
    # los datos necesarios para identificar al usuario autenticado.
    if fila:
        return {
            "exito": True,
            "id":     fila["id"],
            "nombre": fila["nombre"],
            "rol":    fila["rol"]
        }

    # Respuesta genérica para evitar revelar información sobre usuarios existentes.
    return {"exito": False, "mensaje": "Credenciales incorrectas"}