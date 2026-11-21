# backend/services/equipos_service.py

from ..database import get_connection


# Obtiene todos los equipos registrados en la base de datos.
def obtener_equipos():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM equipos ORDER BY nombre")

    filas = cursor.fetchall()

    conn.close()

    return [dict(f) for f in filas]


# Registra un nuevo equipo dentro de la base de datos.
def registrar_equipo(data):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO equipos
        (nombre, tipo, ubicacion, potencia_kw, estado)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            data['nombre'],
            data['tipo'],
            data['ubicacion'],
            data['potencia_kw'],
            data.get('estado', 'activo')
        )
    )

    nuevo_id = cursor.fetchone()["id"]

    conn.commit()
    conn.close()

    return {
        "exito": True,
        "id": nuevo_id,
        "mensaje": "Equipo registrado"
    }


# Actualiza el estado de un equipo existente.
def actualizar_estado_equipo(equipo_id, estado):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE equipos SET estado=%s WHERE id=%s",
        (estado, equipo_id)
    )

    conn.commit()
    conn.close()

    return {
        "exito": True,
        "mensaje": "Estado actualizado"
    }


# Elimina un equipo existente.
def eliminar_equipo(equipo_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM equipos WHERE id=%s",
        (equipo_id,)
    )

    conn.commit()
    conn.close()

    return {
        "exito": True,
        "mensaje": "Equipo eliminado"
    }