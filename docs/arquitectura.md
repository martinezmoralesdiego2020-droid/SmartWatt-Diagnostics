# Arquitectura del Proyecto SmartWatt-Diagnostics

## Estructura general del proyecto

SmartWatt-Diagnostics/
│
├── backend/
│ ├── services/
│ │ ├── auth_service.py
│ │ ├── consumo_service.py
│ │ ├── equipos_service.py
│ │ ├── incidencias_service.py
│ │ ├── reportes_service.py
│ │ └── usuarios_service.py
│ ├── app.py
│ └── database.py
│
├── database/
│ └── energia.db
│
├── docs/
│ └── evidencias/
│ ├── arquitectura/
│ ├── entorno/
│ ├── github-flow/
│ ├── instalacion/
│ ├── sistema/
│ ├── arquitectura.md
│ ├── entorno-desarrollo.md
│ ├── flujo-github-flow.md
│ ├── instalacion.md
│ └── uso-del-sistema.md
│
├── frontend/
│ ├── img/
│ │ └── SmartWatt.png
│ ├── pages/
│ │ ├── consulta_equipos.html
│ │ ├── dashboard.html
│ │ ├── diagnostico.html
│ │ ├── equipos.html
│ │ ├── login.html
│ │ ├── monitoreo.html
│ │ ├── registro_consumo.html
│ │ ├── registro_incidencias.html
│ │ ├── registro_usuario.html
│ │ └── reportes.html
│ ├── scripts/
│ │ ├── auth.js
│ │ ├── consumo.js
│ │ ├── dashboard.js
│ │ ├── diagnostico.js
│ │ ├── equipos.js
│ │ ├── reportes.js
│ │ └── utils.js
│ └── styles/
│ └── main.css
│
├── .gitignore
├── LICENSE
├── README.md
├── main.py
└── requirements.txt


## Descripción de cada carpeta

### Backend
Contiene toda la lógica del servidor y la API del sistema.

| Archivo/Carpeta | Propósito |
|----------------|-----------|
| `app.py` | Punto de entrada principal de la aplicación backend |
| `database.py` | Configuración y conexión a la base de datos |
| `services/` | Carpeta con los servicios del sistema |

#### Servicios (services/)
| Archivo | Propósito |
|---------|-----------|
| `auth_service.py` | Autenticación y autorización de usuarios |
| `consumo_service.py` | Gestión de datos de consumo energético |
| `equipos_service.py` | Administración de equipos eléctricos |
| `incidencias_service.py` | Registro y seguimiento de incidencias técnicas |
| `reportes_service.py` | Generación de reportes técnicos en PDF |
| `usuarios_service.py` | Gestión de usuarios del sistema |

### Database
| Archivo | Propósito |
|---------|-----------|
| `energia.db` | Base de datos SQLite que almacena toda la información del sistema |

### Docs
Contiene toda la documentación del proyecto.

| Carpeta/Archivo | Propósito |
|-----------------|-----------|
| `evidencias/` | Carpeta principal de documentación |
| `arquitectura.md` | Este archivo - explica la estructura del proyecto |
| `entorno-desarrollo.md` | Guía de configuración del entorno de desarrollo |
| `flujo-github-flow.md` | Explicación del flujo de trabajo con GitHub |
| `instalacion.md` | Instrucciones de instalación del sistema |
| `uso-del-sistema.md` | Manual de usuario del sistema |

### Frontend
Contiene toda la interfaz de usuario y la lógica del cliente.

| Carpeta | Propósito |
|---------|-----------|
| `img/` | Imágenes y recursos gráficos del sistema |
| `pages/` | Archivos HTML de cada página de la aplicación |
| `scripts/` | Archivos JavaScript con la lógica del frontend |
| `styles/` | Archivos CSS para los estilos de la interfaz |

#### Páginas (pages/)
| Archivo | Propósito |
|---------|-----------|
| `consulta_equipos.html` | Consulta de equipos registrados |
| `dashboard.html` | Panel principal con resumen de datos |
| `diagnostico.html` | Diagnóstico de equipos eléctricos |
| `equipos.html` | Gestión de equipos |
| `login.html` | Pantalla de inicio de sesión |
| `monitoreo.html` | Monitoreo en tiempo real |
| `registro_consumo.html` | Registro de consumo energético |
| `registro_incidencias.html` | Registro de incidencias técnicas |
| `registro_usuario.html` | Registro de nuevos usuarios |
| `reportes.html` | Generación y visualización de reportes |

#### Scripts (scripts/)
| Archivo | Propósito |
|---------|-----------|
| `auth.js` | Lógica de autenticación |
| `consumo.js` | Manejo de datos de consumo |
| `dashboard.js` | Funciones del panel principal |
| `diagnostico.js` | Lógica de diagnóstico |
| `equipos.js` | Gestión de equipos en frontend |
| `reportes.js` | Generación de reportes |
| `utils.js` | Funciones auxiliares y utilerías |

### Archivos raíz

| Archivo | Propósito |
|---------|-----------|
| `.gitignore` | Archivos y carpetas ignorados por Git |
| `LICENSE` | Licencia del proyecto |
| `README.md` | Descripción general del proyecto |
| `main.py` | Script principal de entrada |
| `requirements.txt` | Dependencias de Python del proyecto |

## Diagrama de flujo de carpetas
┌─────────────────┐
│ main.py │
│ (Entrada) │
└────────┬────────┘
│
┌────────▼────────┐
│ backend/ │
│ app.py │
└────────┬────────┘
│
┌────────────────────┼────────────────────┐
│ │ │
┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐
│ services/ │ │ database.py │ │ database/ │
│ (Lógica) │◄──►│ (Conexión) │◄──►│ energia.db │
└───────┬───────┘ └───────────────┘ └───────────────┘
│
│ (API)
│
┌───────▼───────┐
│ frontend/ │
│ pages/ │
│ scripts/ │
│ styles/ │
└───────────────┘

## Relación entre carpetas

| Origen | Destino | Comunicación |
|--------|---------|--------------|
| `frontend/pages/` | `backend/services/` | Peticiones HTTP/API |
| `backend/services/` | `database/energia.db` | Consultas SQL |
| `frontend/scripts/` | `backend/app.py` | Llamadas a endpoints |
| `backend/app.py` | `frontend/pages/` | Renderizado de respuestas |

---

*Documentación de arquitectura - SmartWatt-Diagnostics*