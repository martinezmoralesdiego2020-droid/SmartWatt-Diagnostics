from ..database import get_connection

def registrar_usuario(data):
    conn = get_connection()
    cursor = conn.cursor()

    try:

        # Verificar si ya existe una cuenta con el mismo nombre de usuario
        # para evitar registros duplicados dentro del sistema.
        cursor.execute(
            "SELECT id FROM usuarios WHERE usuario = ?",
            (data['usuario'],)
        )

        usuario_existente = cursor.fetchone()

        if usuario_existente:
            return {
                "exito": False,
                "mensaje": "El usuario ya existe"
            }

        # Registrar el nuevo usuario utilizando la información recibida.
        cursor.execute("""
            INSERT INTO usuarios (nombre, usuario, contrasena, rol)
            VALUES (?, ?, ?, ?)
        """, (
            data['nombre'],
            data['usuario'],
            data['contrasena'],
            data['rol']
        ))

        conn.commit()

        return {
            "exito": True,
            "mensaje": "Usuario registrado"
        }

    except Exception as e:

        # Retornar el error para facilitar la detección de problemas
        # durante el proceso de registro.
        return {
            "exito": False,
            "mensaje": str(e)
        }

    finally:
        # Asegurar el cierre de la conexión independientemente del resultado.
        conn.close()


def obtener_usuarios():

    conn = get_connection()
    cursor = conn.cursor()

    # Recuperar únicamente los datos necesarios para mostrar
    # la información de los usuarios en la interfaz.
    cursor.execute("""
        SELECT id, nombre, usuario, rol
        FROM usuarios
    """)

    filas = cursor.fetchall()

    conn.close()

    # Convertir cada registro a diccionario para facilitar
    # su serialización en formato JSON.
    return [dict(f) for f in filas]