# backend/services/equipos_service.py

# Importa la función encargada de establecer la conexión con la base de datos.
from ..database import get_connection


# Obtiene todos los equipos registrados en la base de datos.
def obtener_equipos():

    # Crea una conexión con la base de datos.
    conn = get_connection()

    # Crea un cursor para ejecutar consultas SQL.
    cursor = conn.cursor()

    # Ejecuta una consulta para obtener los equipos ordenados alfabéticamente por nombre.
    cursor.execute("SELECT * FROM equipos ORDER BY nombre")

    # Recupera todos los registros obtenidos por la consulta.
    filas = cursor.fetchall()

    # Cierra la conexión con la base de datos.
    conn.close()

    # Convierte cada registro obtenido en un diccionario y retorna la lista de equipos.
    return [dict(f) for f in filas]


# Registra un nuevo equipo dentro de la base de datos.
def registrar_equipo(data):

    # Establece una conexión con la base de datos.
    conn = get_connection()

    # Genera un cursor para realizar operaciones sobre la base de datos.
    cursor = conn.cursor()

    # Inserta la información del nuevo equipo en la tabla correspondiente.
    cursor.execute(
        "INSERT INTO equipos (nombre, tipo, ubicacion, potencia_kw, estado) VALUES (?,?,?,?,?)",
        (data['nombre'], data['tipo'], data['ubicacion'],
         data['potencia_kw'], data.get('estado', 'activo'))
    )

    # Confirma los cambios realizados en la base de datos.
    conn.commit()

    # Obtiene el identificador generado para el nuevo equipo registrado.
    nuevo_id = cursor.lastrowid

    # Cierra la conexión con la base de datos.
    conn.close()

    # Retorna una respuesta indicando que el registro fue exitoso.
    return {"exito": True, "id": nuevo_id, "mensaje": "Equipo registrado"}


# Actualiza el estado de un equipo existente mediante su identificador.
def actualizar_estado_equipo(equipo_id, estado):

    # Abre una conexión con la base de datos.
    conn = get_connection()

    # Crea un cursor para ejecutar la actualización.
    cursor = conn.cursor()

    # Actualiza el campo estado del equipo indicado.
    cursor.execute(
        "UPDATE equipos SET estado=? WHERE id=?",
        (estado, equipo_id)
    )

    # Guarda los cambios efectuados en la base de datos.
    conn.commit()

    # Cierra la conexión después de completar la operación.
    conn.close()

    # Retorna un mensaje confirmando la actualización.
    return {"exito": True, "mensaje": "Estado actualizado"}


# Elimina un equipo y sus registros relacionados dentro de la base de datos.
def eliminar_equipo_service(equipo_id):

    # Establece una conexión con la base de datos.
    conn = get_connection()

    # Crea un cursor para ejecutar las instrucciones SQL.
    cursor = conn.cursor()

    try:

        # Elimina primero los consumos energéticos asociados al equipo.
        cursor.execute("""
            DELETE FROM consumo_energetico
            WHERE equipo_id = ?
        """, (equipo_id,))

        # Elimina las incidencias relacionadas con el equipo seleccionado.
        cursor.execute("""
            DELETE FROM incidencias
            WHERE equipo_id = ?
        """, (equipo_id,))

        # Finalmente elimina el registro principal del equipo.
        cursor.execute("""
            DELETE FROM equipos
            WHERE id = ?
        """, (equipo_id,))

        # Confirma la eliminación de los datos en la base de datos.
        conn.commit()

        # Retorna una respuesta indicando que la eliminación fue exitosa.
        return {
            "exito": True,
            "mensaje": "Equipo eliminado"
        }

    except Exception as e:

        # En caso de error, retorna una respuesta con la descripción del problema.
        return {
            "exito": False,
            "mensaje": str(e)
        }

    finally:

        # Cierra la conexión con la base de datos sin importar si ocurrió un error o no.
        conn.close()