# backend/services/reportes_service.py
from ..database import get_connection

def generar_reporte_consumo(fecha_inicio, fecha_fin):
    """Genera datos de reporte en un rango de fechas."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT
            e.nombre              as equipo,
            e.tipo                as tipo,
            e.ubicacion           as ubicacion,
            COUNT(c.id)           as registros,
            ROUND(COALESCE(SUM(c.kwh_consumidos),0), 2) as total_kwh,
            ROUND(COALESCE(AVG(c.kwh_consumidos),0), 2) as promedio_kwh,
            ROUND(COALESCE(MAX(c.kwh_consumidos),0), 2) as max_kwh
        FROM equipos e
        LEFT JOIN consumo_energetico c
            ON e.id = c.equipo_id
            AND DATE(c.fecha_registro) BETWEEN DATE(?) AND DATE(?)
        GROUP BY e.id, e.nombre, e.tipo, e.ubicacion
        ORDER BY total_kwh DESC
    ''', (fecha_inicio, fecha_fin))
    filas = cursor.fetchall()
    conn.close()
    return [dict(f) for f in filas]

def obtener_incidencias_activas():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            e.nombre as equipo,
            i.descripcion,
            i.severidad,
            i.estado,
            i.fecha_reporte
        FROM incidencias i
        JOIN equipos e ON e.id = i.equipo_id
        WHERE i.estado != 'resuelta'
        ORDER BY i.fecha_reporte DESC
    """)

    filas = cursor.fetchall()
    conn.close()

    return [dict(f) for f in filas]