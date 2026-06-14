# backend/services/incidencias_service.py
from ..database import get_connection

def obtener_incidencias():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT i.*, e.nombre as equipo_nombre, u.nombre as tecnico_nombre
        FROM incidencias i
        JOIN equipos e ON i.equipo_id = e.id
        LEFT JOIN usuarios u ON i.tecnico_id = u.id
        ORDER BY i.fecha_reporte DESC
    ''')
    filas = cursor.fetchall()
    conn.close()
    return [dict(f) for f in filas]

def registrar_incidencia(data):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''INSERT INTO incidencias
           (equipo_id, descripcion, severidad, tecnico_id)
           VALUES (?,?,?,?)''',
        (data['equipo_id'], data['descripcion'],
         data['severidad'], data.get('tecnico_id'))
    )
    conn.commit()
    conn.close()
    return {"exito": True, "mensaje": "Incidencia registrada"}