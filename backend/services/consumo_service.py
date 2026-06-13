# backend/services/consumo_service.py


# Importa la función encargada de establecer conexiones con la base de datos.
from backend.database import get_connection



# Registra un nuevo consumo energético asociado a un equipo.
def guardar_consumo(data):

    # Crea una conexión con la base de datos.
    conn = get_connection()

    # Crea un cursor para ejecutar instrucciones SQL.
    cursor = conn.cursor()


    # Inserta los datos del consumo energético en la tabla correspondiente.
    cursor.execute(
        '''INSERT INTO consumo_energetico
           (equipo_id, kwh_consumidos, voltaje, corriente, factor_potencia, tecnico_id)
           VALUES (?,?,?,?,?,?)''',
        (data['equipo_id'], data['kwh_consumidos'],
         data.get('voltaje'), data.get('corriente'),
         data.get('factor_potencia'), data.get('tecnico_id'))
    )


    # Confirma los cambios realizados en la base de datos.
    conn.commit()


    # Cierra la conexión después de completar la operación.
    conn.close()


    # Retorna una respuesta indicando que el registro fue exitoso.
    return {"exito": True, "mensaje": "Consumo registrado correctamente"}



# Obtiene los registros de consumo energético.
# Puede recibir un identificador de equipo para filtrar los resultados.
def obtener_consumo(equipo_id=None):

    # Establece conexión con la base de datos.
    conn = get_connection()

    # Crea un cursor para ejecutar consultas.
    cursor = conn.cursor()



    # Si se proporciona un equipo, obtiene únicamente sus registros de consumo.
    if equipo_id:

        # Consulta los consumos relacionados con un equipo específico,
        # incluyendo información adicional del equipo y técnico responsable.
        cursor.execute('''
            SELECT 
                c.*,
                e.nombre as equipo_nombre,
                e.tipo as equipo_tipo,
                u.nombre as tecnico_nombre
            FROM consumo_energetico c
            JOIN equipos e ON c.equipo_id = e.id
            LEFT JOIN usuarios u ON c.tecnico_id = u.id
            WHERE c.equipo_id = ?
            ORDER BY c.fecha_registro DESC
            LIMIT 200
        ''', (equipo_id,))


    else:

        # Consulta todos los registros de consumo energético existentes.
        cursor.execute('''
            SELECT 
                c.*,
                e.nombre as equipo_nombre,
                e.tipo as equipo_tipo,
                u.nombre as tecnico_nombre
            FROM consumo_energetico c
            JOIN equipos e ON c.equipo_id = e.id
            LEFT JOIN usuarios u ON c.tecnico_id = u.id
            ORDER BY c.fecha_registro DESC
            LIMIT 200
        ''')



    # Obtiene todos los registros encontrados.
    filas = cursor.fetchall()


    # Cierra la conexión con la base de datos.
    conn.close()


    # Convierte cada fila obtenida en un diccionario y retorna la lista.
    return [dict(f) for f in filas]




# Obtiene los indicadores principales utilizados en el dashboard del ingeniero.
def obtener_resumen_dashboard():

    # Crea una conexión con la base de datos.
    conn = get_connection()

    # Crea un cursor para realizar consultas.
    cursor = conn.cursor()



    # Consulta el consumo energético total del mes actual.
    cursor.execute(
        "SELECT COALESCE(SUM(kwh_consumidos),0) as total FROM consumo_energetico "
        "WHERE strftime('%Y-%m', fecha_registro) = strftime('%Y-%m', 'now')"
    )

    # Obtiene el valor total calculado.
    total_kwh = cursor.fetchone()["total"]



    # Consulta la cantidad de equipos que actualmente están activos.
    cursor.execute("SELECT COUNT(*) as total FROM equipos WHERE estado='activo'")

    # Guarda el número de equipos activos.
    equipos_activos = cursor.fetchone()["total"]



    # Consulta la cantidad de incidencias que permanecen abiertas.
    cursor.execute("SELECT COUNT(*) as total FROM incidencias WHERE estado='abierta'")

    # Guarda el número de incidencias abiertas.
    incidencias_abiertas = cursor.fetchone()["total"]



    # Consulta las incidencias abiertas con severidad alta o crítica.
    cursor.execute(
        "SELECT COUNT(*) as total FROM incidencias "
        "WHERE estado='abierta' AND severidad IN ('alta','critica')"
    )

    # Guarda la cantidad de incidencias críticas.
    incidencias_criticas = cursor.fetchone()["total"]




    # Obtiene los equipos con mayor consumo energético del mes actual.
    cursor.execute('''
        SELECT e.nombre, COALESCE(SUM(c.kwh_consumidos), 0) as total_kwh
        FROM equipos e
        LEFT JOIN consumo_energetico c ON e.id = c.equipo_id
        WHERE strftime('%Y-%m', c.fecha_registro) = strftime('%Y-%m', 'now')
           OR c.fecha_registro IS NULL
        GROUP BY e.id, e.nombre
        ORDER BY total_kwh DESC
        LIMIT 6
    ''')


    # Convierte los resultados obtenidos en una lista de diccionarios.
    consumo_por_equipo = [dict(f) for f in cursor.fetchall()]



    # Obtiene la tendencia diaria del consumo durante los últimos siete días.
    cursor.execute('''
        SELECT 
            DATE(fecha_registro) as fecha,
            SUM(kwh_consumidos) as total_kwh
        FROM consumo_energetico
        WHERE fecha_registro >= DATE('now', '-7 days')
        GROUP BY DATE(fecha_registro)
        ORDER BY fecha ASC
    ''')


    # Guarda los registros obtenidos para procesar la gráfica.
    tendencia_filas = cursor.fetchall()



    # Formatea la información para utilizarla en Chart.js.
    if tendencia_filas:

        # Se separan fechas y valores en listas independientes.
        tendencia_diaria = {
            "etiquetas": [f["fecha"] for f in tendencia_filas],
            "valores": [float(f["total_kwh"]) for f in tendencia_filas]
        }

    else:

        # Indica que no existen datos disponibles para la gráfica.
        tendencia_diaria = None



    # Cierra la conexión con la base de datos.
    conn.close()



    # Retorna todos los indicadores calculados para el dashboard.
    return {
        "total_kwh_mes":        round(total_kwh, 2),
        "equipos_activos":      equipos_activos,
        "incidencias_abiertas": incidencias_abiertas,
        "incidencias_criticas": incidencias_criticas,
        "consumo_por_equipo":   consumo_por_equipo,
        "tendencia_diaria":     tendencia_diaria
    }




# Analiza el estado de los equipos utilizando información de consumo reciente.
# Permite detectar posibles anomalías o situaciones que requieren atención.
def obtener_diagnostico_equipos():


    # Crea una conexión con la base de datos.
    conn = get_connection()

    # Crea un cursor para ejecutar consultas.
    cursor = conn.cursor()



    # Obtiene los equipos junto con información de consumo reciente.
    cursor.execute('''
        SELECT 
            e.id,
            e.nombre,
            e.tipo,
            e.ubicacion,
            e.estado as estado_equipo,
            e.potencia_kw,
            COUNT(c.id) as registros_recientes,
            ROUND(AVG(c.kwh_consumidos), 2) as promedio_kwh,
            ROUND(MAX(c.kwh_consumidos), 2) as maximo_kwh,
            MAX(c.fecha_registro) as ultimo_registro
        FROM equipos e
        LEFT JOIN consumo_energetico c 
            ON e.id = c.equipo_id 
            AND c.fecha_registro >= DATETIME('now', '-48 hours')
        GROUP BY e.id, e.nombre, e.tipo, e.ubicacion, e.estado, e.potencia_kw
        ORDER BY e.nombre
    ''')



    # Convierte los equipos obtenidos en una lista de diccionarios.
    equipos = [dict(f) for f in cursor.fetchall()]



    # Obtiene la cantidad de incidencias abiertas asociadas a cada equipo.
    cursor.execute('''
        SELECT equipo_id, COUNT(*) as incidencias_abiertas
        FROM incidencias
        WHERE estado IN ('abierta', 'en_proceso')
        GROUP BY equipo_id
    ''')



    # Crea un mapa para relacionar equipos con sus incidencias.
    incidencias_map = {row["equipo_id"]: row["incidencias_abiertas"] for row in cursor.fetchall()}



    # Cierra la conexión con la base de datos.
    conn.close()



    # Inicializa los contadores de clasificación de equipos.
    resumen = {"normal": 0, "alerta": 0, "critico": 0, "sin_datos": 0}



    # Recorre cada equipo para determinar su diagnóstico.
    for eq in equipos:


        # Asigna la cantidad de incidencias abiertas del equipo actual.
        eq["incidencias_abiertas"] = incidencias_map.get(eq["id"], 0)



        # Clasificación cuando no existen registros recientes de consumo.
        if eq["registros_recientes"] == 0:

            eq["diagnostico"] = "sin_datos"
            eq["mensaje"] = "Sin registros en las últimas 48 horas"

            resumen["sin_datos"] += 1



        # Clasificación crítica cuando existen incidencias activas.
        elif eq["incidencias_abiertas"] > 0:

            eq["diagnostico"] = "critico"
            eq["mensaje"] = f"{eq['incidencias_abiertas']} incidencia(s) activa(s)"

            resumen["critico"] += 1



        # Clasificación de alerta cuando el equipo está en mantenimiento.
        elif eq["estado_equipo"] == "mantenimiento":

            eq["diagnostico"] = "alerta"
            eq["mensaje"] = "Equipo en mantenimiento"

            resumen["alerta"] += 1



        # Analiza si el consumo promedio supera considerablemente la potencia nominal.
        elif eq["promedio_kwh"] and eq["potencia_kw"]:


            # Detecta consumos anómalos comparando consumo promedio y potencia.
            if eq["promedio_kwh"] > eq["potencia_kw"] * 1.5:

                eq["diagnostico"] = "alerta"
                eq["mensaje"] = f"Consumo elevado: {eq['promedio_kwh']} kWh promedio"

                resumen["alerta"] += 1


            else:

                eq["diagnostico"] = "normal"
                eq["mensaje"] = "Operando normalmente"

                resumen["normal"] += 1



        # Clasifica como normal cuando no existen condiciones de alerta.
        else:

            eq["diagnostico"] = "normal"
            eq["mensaje"] = "Operando normalmente"

            resumen["normal"] += 1



    # Retorna la información del diagnóstico y el resumen general.
    return {
        "equipos": equipos,
        "resumen": resumen
    }