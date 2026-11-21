# backend/database.py
import os
import psycopg
from psycopg.rows import dict_row
from werkzeug.security import generate_password_hash

DATABASE_URL = os.environ.get("DATABASE_URL")


def get_connection():
    """Retorna una conexión activa a PostgreSQL en Neon."""
    if not DATABASE_URL:
        raise RuntimeError("No se ha configurado DATABASE_URL")

    return psycopg.connect(
        DATABASE_URL,
        row_factory=dict_row
    )


def inicializar_db():
    """Crea las tablas si no existen."""

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            nombre TEXT NOT NULL,
            usuario TEXT UNIQUE NOT NULL,
            contrasena TEXT NOT NULL,
            rol TEXT NOT NULL CHECK(rol IN ('ingeniero', 'tecnico')),
            activo INTEGER DEFAULT 1,
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS equipos (
            id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            nombre TEXT NOT NULL,
            tipo TEXT NOT NULL,
            ubicacion TEXT NOT NULL,
            potencia_kw REAL NOT NULL,
            estado TEXT DEFAULT 'activo'
                CHECK(estado IN ('activo', 'inactivo', 'mantenimiento')),
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS consumo_energetico (
            id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            equipo_id INTEGER NOT NULL,
            kwh_consumidos REAL NOT NULL,
            voltaje REAL,
            corriente REAL,
            factor_potencia REAL,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            tecnico_id INTEGER,
            FOREIGN KEY(equipo_id) REFERENCES equipos(id),
            FOREIGN KEY(tecnico_id) REFERENCES usuarios(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS incidencias (
            id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            equipo_id INTEGER NOT NULL,
            descripcion TEXT NOT NULL,
            severidad TEXT NOT NULL
                CHECK(severidad IN ('baja', 'media', 'alta', 'critica')),
            estado TEXT DEFAULT 'abierta'
                CHECK(estado IN ('abierta', 'en_proceso', 'resuelta')),
            tecnico_id INTEGER,
            fecha_reporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_resolucion TIMESTAMP,
            FOREIGN KEY(equipo_id) REFERENCES equipos(id),
            FOREIGN KEY(tecnico_id) REFERENCES usuarios(id)
        )
    """)

    cursor.execute("SELECT COUNT(*) AS total FROM usuarios")
    resultado = cursor.fetchone()

    if resultado["total"] == 0:
        cursor.executemany(
            """
            INSERT INTO usuarios
            (nombre, usuario, contrasena, rol)
            VALUES (%s, %s, %s, %s)
            """,
            [
                (
                    "Ing. Carlos López",
                    "ingeniero1",
                    generate_password_hash("ing123"),
                    "ingeniero"
                ),
                (
                    "Téc. Ana Martínez",
                    "tecnico1",
                    generate_password_hash("tec123"),
                    "tecnico"
                ),
            ]
        )

    conn.commit()
    cursor.close()
    conn.close()

    print("[DB] Base de datos PostgreSQL iniciada correctamente.")