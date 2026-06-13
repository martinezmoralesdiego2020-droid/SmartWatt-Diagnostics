# backend/app.py

# Importaciones principales de Flask para crear la API y servir archivos del frontend
from flask import Flask, jsonify, request, send_from_directory
import os
import sys

# Inicialización de la base de datos al arrancar la aplicación
from backend.database import inicializar_db

# Utilizado para enviar archivos PDF generados dinámicamente
from flask import send_file
import io

# Librerías necesarias para generar reportes PDF
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet

# Detectar si la aplicación se ejecuta como ejecutable generado con PyInstaller.
# Esto permite encontrar correctamente las carpetas del proyecto tanto en desarrollo
# como en la versión distribuida.
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Crear las tablas necesarias antes de iniciar el servidor.
inicializar_db()

app = Flask(
    __name__,
    static_folder=os.path.join(BASE_DIR, 'frontend'),
    template_folder=os.path.join(BASE_DIR, 'frontend', 'pages')
)

# ──────────────────────────────────────────────
# RUTAS PARA SERVIR LAS PÁGINAS HTML
# ──────────────────────────────────────────────

# Página principal del sistema.
@app.route('/')
def index():
    return send_from_directory(
        os.path.join(BASE_DIR, 'frontend', 'pages'),
        'login.html'
    )

# Permite acceder a las demás páginas HTML del frontend.
@app.route('/pages/<path:filename>')
def pages(filename):
    return send_from_directory(
        os.path.join(BASE_DIR, 'frontend', 'pages'),
        filename
    )

# Servir archivos CSS al navegador.
@app.route('/styles/<path:filename>')
def styles(filename):
    return send_from_directory(
        os.path.join(BASE_DIR, 'frontend', 'styles'),
        filename
    )

# Servir archivos JavaScript utilizados por la interfaz.
@app.route('/scripts/<path:filename>')
def scripts(filename):
    return send_from_directory(
        os.path.join(BASE_DIR, 'frontend', 'scripts'),
        filename
    )

# Servir imágenes utilizadas por el sistema.
@app.route('/img/<path:filename>')
def images(filename):
    return send_from_directory(
        os.path.join(BASE_DIR, 'frontend', 'img'),
        filename
    )

# ──────────────────────────────────────────────
# RUTAS DE LA API (ejemplos base)
# ──────────────────────────────────────────────

# Validación de acceso al sistema.
@app.route('/api/login', methods=['POST'])
def login():
    from backend.services.auth_service import autenticar_usuario
    data = request.get_json()
    resultado = autenticar_usuario(data.get('usuario'), data.get('contrasena'))
    return jsonify(resultado)

# Registro de nuevos usuarios.
@app.route('/api/usuarios', methods=['POST'])
def crear_usuario():
    from backend.services.usuarios_service import registrar_usuario
    data = request.get_json()
    return jsonify(registrar_usuario(data))

# Obtener todos los usuarios registrados.
@app.route('/api/usuarios', methods=['GET'])
def listar_usuarios():
    from backend.services.usuarios_service import obtener_usuarios
    return jsonify(obtener_usuarios())

# Consultar todos los equipos existentes.
@app.route('/api/equipos', methods=['GET'])
def get_equipos():
    from backend.services.equipos_service import obtener_equipos
    equipos = obtener_equipos()
    return jsonify(equipos)

# Crear un nuevo equipo dentro del sistema.
@app.route('/api/equipos', methods=['POST'])
def crear_equipo():
    from backend.services.equipos_service import registrar_equipo
    data = request.get_json()
    resultado = registrar_equipo(data)
    return jsonify(resultado)

# Actualizar el estado operativo de un equipo.
@app.route('/api/equipos/<int:id>/estado', methods=['PATCH'])
def cambiar_estado_equipo(id):

    from backend.services.equipos_service import actualizar_estado_equipo

    data = request.get_json()
    estado = data.get('estado')

    resultado = actualizar_estado_equipo(id, estado)

    return jsonify(resultado)

# Eliminación de equipos por identificador.
@app.route('/api/equipos/<int:id>', methods=['DELETE'])
def eliminar_equipo(id):

    from backend.services.equipos_service import eliminar_equipo_service

    return jsonify(eliminar_equipo_service(id))

# Consultar registros de consumo energético.
@app.route('/api/consumo', methods=['GET'])
def get_consumo():

    try:
        from backend.services.consumo_service import obtener_consumo

        # Permite filtrar el consumo de un equipo específico.
        equipo_id = request.args.get('equipo_id')

        return jsonify(obtener_consumo(equipo_id))

    except Exception as e:

        print('\n[ERROR API CONSUMO]')
        print(e)

        return jsonify({
            'exito': False,
            'mensaje': str(e)
        }), 500

# Registrar un nuevo consumo energético.
@app.route('/api/consumo', methods=['POST'])
def registrar_consumo():

    from backend.database import get_connection
    from backend.services.consumo_service import guardar_consumo

    data = request.get_json()
    equipo_id = data.get('equipo_id')

    conn = get_connection()
    cursor = conn.cursor()

    # Verificar el estado actual del equipo antes de registrar consumo.
    cursor.execute("""
        SELECT estado FROM equipos WHERE id = ?
    """, (equipo_id,))

    equipo = cursor.fetchone()
    conn.close()

    # Evitar registrar información sobre equipos inexistentes.
    if not equipo:
        return jsonify({
            "exito": False,
            "mensaje": "Equipo no existe"
        }), 404

    # Regla de negocio:
    # Un equipo inactivo no debe generar nuevos registros de consumo.
    if equipo["estado"] == "inactivo":
        return jsonify({
            "exito": False,
            "mensaje": "No se puede registrar consumo en equipos inactivos"
        }), 403

    resultado = guardar_consumo(data)
    return jsonify(resultado)

# Obtener todas las incidencias registradas.
@app.route('/api/incidencias', methods=['GET'])
def get_incidencias():
    from backend.services.incidencias_service import obtener_incidencias
    incidencias = obtener_incidencias()
    return jsonify(incidencias)

# Crear una nueva incidencia asociada a un equipo.
@app.route('/api/incidencias', methods=['POST'])
def crear_incidencia():

    from backend.database import get_connection
    from backend.services.incidencias_service import registrar_incidencia

    data = request.get_json()
    equipo_id = data.get('equipo_id')

    conn = get_connection()
    cursor = conn.cursor()

    # Comprobar que el equipo exista antes de registrar la incidencia.
    cursor.execute("""
        SELECT estado FROM equipos WHERE id = ?
    """, (equipo_id,))

    equipo = cursor.fetchone()
    conn.close()

    if not equipo:
        return jsonify({
            "exito": False,
            "mensaje": "Equipo no existe"
        }), 404

    # Regla de negocio:
    # No se permiten incidencias nuevas sobre equipos marcados como inactivos.
    if equipo["estado"] == "inactivo":
        return jsonify({
            "exito": False,
            "mensaje": "No se pueden crear incidencias en equipos inactivos"
        }), 403

    resultado = registrar_incidencia(data)
    return jsonify(resultado)

# Cambiar el estado de una incidencia y sincronizar el estado del equipo relacionado.
@app.route('/api/incidencias/<int:id>/estado', methods=['PATCH'])
def actualizar_estado_incidencia(id):

    from backend.database import get_connection

    data = request.json
    estado = data.get('estado')

    try:

        conn = get_connection()
        cursor = conn.cursor()

        # ─────────────────────────────────────
        # Actualizar incidencia
        # ─────────────────────────────────────
        cursor.execute("""
            UPDATE incidencias
            SET estado = ?
            WHERE id = ?
        """, (estado, id))

        # ─────────────────────────────────────
        # Obtener equipo relacionado
        # ─────────────────────────────────────
        cursor.execute("""
            SELECT equipo_id
            FROM incidencias
            WHERE id = ?
        """, (id,))

        fila = cursor.fetchone()

        if fila:

            equipo_id = fila['equipo_id']

            # Mantener consistencia entre el estado de la incidencia
            # y la disponibilidad del equipo asociado.
            if estado == 'en_proceso':

                cursor.execute("""
                    UPDATE equipos
                    SET estado = 'mantenimiento'
                    WHERE id = ?
                """, (equipo_id,))

            elif estado == 'resuelta':

                cursor.execute("""
                    UPDATE equipos
                    SET estado = 'activo'
                    WHERE id = ?
                """, (equipo_id,))

        conn.commit()
        conn.close()

        return jsonify({
            'exito': True,
            'mensaje': 'Incidencia actualizada'
        })

    except Exception as e:

        print('\n[ERROR incidencia estado]')
        print(e)

        return jsonify({
            'exito': False,
            'mensaje': 'Error al actualizar incidencia'
        }), 500

# Obtener información resumida para el dashboard principal.
@app.route('/api/dashboard/resumen', methods=['GET'])
def get_resumen_dashboard():
    from backend.services.consumo_service import obtener_resumen_dashboard
    resumen = obtener_resumen_dashboard()
    return jsonify(resumen)

# Generar reporte de consumo filtrado por rango de fechas.
@app.route('/api/reportes/consumo', methods=['GET'])
def reporte_consumo():
    from backend.services.reportes_service import generar_reporte_consumo

    fecha_inicio = request.args.get('fecha_inicio')
    fecha_fin = request.args.get('fecha_fin')

    # Las fechas son obligatorias para evitar consultas ambiguas.
    if not fecha_inicio or not fecha_fin:
        return jsonify({
            "exito": False,
            "mensaje": "Faltan fechas"
        }), 400

    datos = generar_reporte_consumo(fecha_inicio, fecha_fin)

    return jsonify(datos)

# Exportar el reporte de consumo en formato PDF.
@app.route('/api/reportes/consumo/pdf', methods=['GET'])
def reporte_consumo_pdf():

    from backend.services.reportes_service import generar_reporte_consumo

    fecha_inicio = request.args.get('fecha_inicio')
    fecha_fin = request.args.get('fecha_fin')

    datos = generar_reporte_consumo(fecha_inicio, fecha_fin)

    # Se utiliza un buffer en memoria para evitar crear archivos temporales.
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer)

    styles = getSampleStyleSheet()
    elements = []

    # Encabezado del reporte.
    elements.append(Paragraph("Reporte de Consumo Energético", styles['Title']))
    elements.append(Paragraph(f"{fecha_inicio} → {fecha_fin}", styles['Normal']))
    elements.append(Spacer(1, 12))

    data = [["Equipo", "Tipo", "Ubicación", "Registros", "kWh Total"]]

    # Construcción de las filas de la tabla a partir de los datos consultados.
    for d in datos:
        data.append([
            d["equipo"],
            d["tipo"],
            d["ubicacion"],
            d["registros"],
            d["total_kwh"]
        ])

    table = Table(data)

    # Aplicar formato para mejorar la legibilidad del reporte generado.
    table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.grey),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("GRID", (0,0), (-1,-1), 0.5, colors.black),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("ALIGN", (3,1), (-1,-1), "CENTER"),
    ]))

    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="reporte_consumo.pdf",
        mimetype="application/pdf"
    )

# Punto de entrada principal de la aplicación.
if __name__ == '__main__':
    app.run(debug=True, port=5000)