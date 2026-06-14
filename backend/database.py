# backend/database.py
import sqlite3
import os
import sys

# Ruta dinámica que funciona en modo desarrollo y en .exe
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DB_PATH = os.path.join(BASE_DIR, 'database', 'energia.db')

def get_connection():
    """Retorna una conexión activa a la base de datos SQLite."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row   # permite acceder columnas por nombre
    return conn

def inicializar_db():
    """Crea todas las tablas si no existen. Se llama al iniciar el sistema."""
    conn = get_connection()
    cursor = conn.cursor()

    # Tabla de usuarios y roles
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre      TEXT NOT NULL,
            usuario     TEXT UNIQUE NOT NULL,
            contrasena  TEXT NOT NULL,
            rol         TEXT NOT NULL CHECK(rol IN ('ingeniero', 'tecnico')),
            activo      INTEGER DEFAULT 1,
            creado_en   TEXT DEFAULT (datetime('now'))
        )
    ''')

    # Tabla de equipos eléctricos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS equipos (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre          TEXT NOT NULL,
            tipo            TEXT NOT NULL,
            ubicacion       TEXT NOT NULL,
            potencia_kw     REAL NOT NULL,
            estado          TEXT DEFAULT 'activo' CHECK(estado IN ('activo','inactivo','mantenimiento')),
            fecha_registro  TEXT DEFAULT (datetime('now'))
        )
    ''')

    # Tabla de registros de consumo energético
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS consumo_energetico (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            equipo_id       INTEGER NOT NULL,
            kwh_consumidos  REAL NOT NULL,
            voltaje         REAL,
            corriente       REAL,
            factor_potencia REAL,
            fecha_registro  TEXT DEFAULT (datetime('now')),
            tecnico_id      INTEGER,
            FOREIGN KEY(equipo_id)  REFERENCES equipos(id),
            FOREIGN KEY(tecnico_id) REFERENCES usuarios(id)
        )
    ''')

    # Tabla de incidencias técnicas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS incidencias (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            equipo_id       INTEGER NOT NULL,
            descripcion     TEXT NOT NULL,
            severidad       TEXT NOT NULL CHECK(severidad IN ('baja','media','alta','critica')),
            estado          TEXT DEFAULT 'abierta' CHECK(estado IN ('abierta','en_proceso','resuelta')),
            tecnico_id      INTEGER,
            fecha_reporte   TEXT DEFAULT (datetime('now')),
            fecha_resolucion TEXT,
            FOREIGN KEY(equipo_id)  REFERENCES equipos(id),
            FOREIGN KEY(tecnico_id) REFERENCES usuarios(id)
        )
    ''')

    # Insertar usuarios de prueba si no existen
    cursor.execute("SELECT COUNT(*) FROM usuarios")
    if cursor.fetchone()[0] == 0:
        cursor.executemany(
            "INSERT INTO usuarios (nombre, usuario, contrasena, rol) VALUES (?,?,?,?)",
            [
                ('Ing. Carlos López',   'ingeniero1', 'ing123', 'ingeniero'),
                ('Téc. Ana Martínez',   'tecnico1',   'tec123', 'tecnico'),
            ]
        )

    conn.commit()
    conn.close()
    print(f"[DB] Base de datos iniciada en: {DB_PATH}")