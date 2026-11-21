# backend/services/auth_service.py

from ..database import get_connection
from werkzeug.security import check_password_hash


def autenticar_usuario(usuario, contrasena):
    """
    Valida las credenciales del usuario utilizando
    contraseñas almacenadas como hash.
    """

    if not usuario or not contrasena:
        return {
            "exito": False,
            "mensaje": "Usuario y contraseña requeridos"
        }

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, nombre, rol, contrasena
        FROM usuarios
        WHERE usuario = %s AND activo = 1
        """,
        (usuario,)
    )

    fila = cursor.fetchone()
    conn.close()

    # Si el usuario no existe, devolver un mensaje genérico.
    if not fila:
        return {
            "exito": False,
            "mensaje": "Credenciales incorrectas"
        }

    # Comparar la contraseña introducida contra el hash almacenado.
    if not check_password_hash(fila["contrasena"], contrasena):
        return {
            "exito": False,
            "mensaje": "Credenciales incorrectas"
        }

    return {
        "exito": True,
        "id": fila["id"],
        "nombre": fila["nombre"],
        "rol": fila["rol"]
    }