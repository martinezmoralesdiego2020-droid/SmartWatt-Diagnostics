from ..database import get_connection
from werkzeug.security import generate_password_hash


def registrar_usuario(data):
    conn = get_connection()
    cursor = conn.cursor()

    try:

        cursor.execute(
            "SELECT id FROM usuarios WHERE usuario = %s",
            (data['usuario'],)
        )

        usuario_existente = cursor.fetchone()

        if usuario_existente:
            return {
                "exito": False,
                "mensaje": "El usuario ya existe"
            }

        # Convertir la contraseña en un hash antes de almacenarla.
        contrasena_hash = generate_password_hash(
            data['contrasena']
        )

        cursor.execute("""
            INSERT INTO usuarios (nombre, usuario, contrasena, rol)
            VALUES (%s, %s, %s, %s)
        """, (
            data['nombre'],
            data['usuario'],
            contrasena_hash,
            data['rol']
        ))

        conn.commit()

        return {
            "exito": True,
            "mensaje": "Usuario registrado"
        }

    except Exception as e:

        return {
            "exito": False,
            "mensaje": "No se pudo registrar el usuario"
        }

    finally:
        conn.close()


def obtener_usuarios():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, nombre, usuario, rol
        FROM usuarios
    """)

    filas = cursor.fetchall()

    conn.close()

    return [dict(f) for f in filas]