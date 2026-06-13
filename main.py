# main.py
"""
Punto de entrada principal del sistema.
Este archivo es el que PyInstaller empaqueta en el .exe
"""
import webbrowser
import threading
import time

import backend.database as database
from backend.app import app

def abrir_navegador():
    """Abre el navegador automáticamente después de que Flask inicie."""
    time.sleep(1.5)
    webbrowser.open("http://localhost:5000")

if __name__ == '__main__':
    print("=" * 50)
    print("  SistemaControlEnergetico  v1.0")
    print("  Iniciando servidor...")
    print("=" * 50)

    # Inicializar base de datos
    database.inicializar_db()

    # Abrir navegador en segundo plano
    threading.Thread(target=abrir_navegador, daemon=True).start()

    # Iniciar Flask
    app.run(
        host='127.0.0.1',
        port=5000,
        debug=False,
        use_reloader=False
    )