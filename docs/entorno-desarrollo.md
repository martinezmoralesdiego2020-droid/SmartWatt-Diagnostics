# Entorno de desarrollo

## Objetivo

Documentar el entorno utilizado para el desarrollo, pruebas y ejecución del sistema SmartWatt Diagnostics.

---

## Sistema operativo

El desarrollo del proyecto se realizó utilizando un entorno híbrido compuesto por Windows y Linux mediante Windows Subsystem for Linux (WSL2).

### Configuración utilizada

| Componente        | Configuración |
| ----------------- | ------------- |
| Sistema principal | Windows 11    |
| Entorno Linux     | Ubuntu (WSL2) |
| Arquitectura      | x64           |

---

## Evidencias de trabajo en WSL2

Cada integrante trabajó dentro del entorno Linux (WSL2), comprobado mediante terminal activa, usuario y directorio del proyecto.

### Integrante 1
![WSL2 Integrante 1](evidencias/entorno/wsl2_1.png)

### Integrante 2
![WSL2 Integrante 2](evidencias/entorno/wsl2_2.png)

### Integrante 3
![WSL2 Integrante 3](evidencias/entorno/wsl2_3.png)

### Integrante 4
![WSL2 Integrante 4](evidencias/entorno/wsl2_4.png)

---

## Entorno de programación

Para el desarrollo del sistema se utilizó Visual Studio Code como editor principal.

### Herramientas utilizadas

| Herramienta        | Uso                     |
| ------------------ | ----------------------- |
| Visual Studio Code | Desarrollo              |
| Git                | Control de versiones    |
| GitHub             | Gestión del repositorio |
| Terminal Ubuntu    | Ejecución               |

![Visual Studio Code](evidencias/entorno/vscode.png)

---

## Lenguajes y tecnologías

Las tecnologías utilizadas durante el desarrollo fueron las siguientes:

| Tecnología | Función                |
| ---------- | ---------------------- |
| Python     | Backend                |
| Flask      | Servidor               |
| SQLite     | Base de datos          |
| HTML       | Interfaz               |
| CSS        | Diseño                 |
| JavaScript | Funcionalidad          |
| ReportLab  | Generación de reportes |

---

## Configuración de Python

Se utilizó Python dentro de un entorno virtual para aislar dependencias del proyecto.

### Versión utilizada

```bash
python --version
```

Resultado esperado:

```text
Python 3.14
```

![Python](evidencias/entorno/terminal.png)

---

## Entorno virtual

Se utilizó un entorno virtual para administrar dependencias.

Creación:

```bash
python -m venv venv
```

Activación Linux:

```bash
source venv/bin/activate
```

Activación Windows:

```bash
venv\Scripts\activate
```

Verificación:

```text
(venv)
```

![Entorno virtual](evidencias/entorno/entorno-virtual.png)

---

## Organización del proyecto

La estructura del repositorio fue administrada utilizando Git y GitHub.

Consultar:

[Arquitectura del sistema](arquitectura.md)

![Repositorio](evidencias/entorno/github.png)

---

## Resultado

El entorno permitió desarrollar, probar y ejecutar correctamente el sistema SmartWatt Diagnostics tanto en Windows como en Linux mediante WSL2.
