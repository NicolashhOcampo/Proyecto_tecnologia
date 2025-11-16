# 🌡️ Sistema IoT de Monitoreo y Control de Temperatura y Humedad

Sistema integral de monitoreo ambiental con estabilización automática, desarrollado para la cátedra **Tecnologías para la Automatización**. Combina sensores IoT, procesamiento en la nube (ThingSpeak), control automático y notificaciones WhatsApp en tiempo real.

![Sistema Activo](https://img.shields.io/badge/Estado-Activo-success)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![React](https://img.shields.io/badge/React-18+-61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688)

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Sistema de Estabilización](#-sistema-de-estabilización)
- [API Endpoints](#-api-endpoints)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

## ✨ Características

### 🎯 Funcionalidades Principales

- **Monitoreo en Tiempo Real**: Visualización continua de temperatura y humedad con actualización automática cada 5 segundos
- **Estabilización Automática**: Sistema de control de lazo cerrado que corrige automáticamente valores críticos
- **Alertas Inteligentes**: Notificaciones WhatsApp automáticas cuando se detectan condiciones críticas
- **Gráficas Históricas**: Visualización de tendencias mediante ThingSpeak
- **Interfaz Moderna**: Dashboard responsive con diseño glassmorphism y animaciones fluidas
- **Control Manual**: Envío manual de datos y gestión de notificaciones

### 🔧 Características Técnicas

- Control selectivo independiente (temperatura/humedad)
- Ajuste gradual con pasos de 5 unidades
- Tiempo de estabilización predecible
- Registro completo de trayectoria de estabilización
- API RESTful con documentación automática (Swagger)
- Sistema de umbrales configurables

## 🏗️ Arquitectura del Sistema

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Sensores  │ ───────>│  ThingSpeak  │<────────│   Backend   │
│   (IoT)     │         │   (Cloud)    │         │  (FastAPI)  │
└─────────────┘         └──────────────┘         └──────┬──────┘
                                                         │
                        ┌────────────────────────────────┤
                        │                                │
                 ┌──────▼──────┐                 ┌──────▼──────┐
                 │  Frontend   │                 │   Twilio    │
                 │   (React)   │                 │  WhatsApp   │
                 └─────────────┘                 └─────────────┘
```

### Flujo de Datos

1. **Adquisición**: Los sensores envían datos a ThingSpeak
2. **Procesamiento**: El backend consulta ThingSpeak y analiza los datos
3. **Control**: Si detecta valores críticos, ejecuta estabilización automática
4. **Visualización**: El frontend muestra datos en tiempo real
5. **Notificación**: Se envían alertas por WhatsApp en condiciones críticas

## 🛠️ Tecnologías

### Backend
- **Python 3.11+**
- **FastAPI**: Framework web asíncrono
- **Uvicorn**: Servidor ASGI
- **Twilio**: API para WhatsApp
- **Requests**: Cliente HTTP
- **Python-dotenv**: Gestión de variables de entorno

### Frontend
- **React 18**: Biblioteca de UI
- **TypeScript**: Tipado estático
- **Vite**: Build tool y dev server
- **CSS3**: Estilos personalizados con variables CSS

### Servicios Cloud
- **ThingSpeak**: Plataforma IoT para almacenamiento y visualización
- **Twilio**: Servicio de mensajería WhatsApp

## 📦 Requisitos Previos

- **Python 3.11 o superior**
- **Node.js 18 o superior**
- **npm o yarn**
- **Cuenta de ThingSpeak** (gratuita)
- **Cuenta de Twilio** (con sandbox WhatsApp configurado)
- **Git**

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/NicolashhOcampo/Proyecto_tecnologia.git
cd Proyecto_tecnologia
```

### 2. Configurar Backend

```powershell
cd backend

# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Si hay problemas con la política de ejecución:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force

# Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configurar Frontend

```bash
cd frontend

# Instalar dependencias
npm install
```

## ⚙️ Configuración

### Variables de Entorno del Backend

Crear un archivo `.env` en la carpeta `backend`:

```env
# ThingSpeak Configuration
THINGSPEAK_CHANNEL_ID=tu_channel_id
THINGSPEAK_READ_API_KEY=tu_read_api_key
THINGSPEAK_WRITE_API_KEY=tu_write_api_key

# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
DEFAULT_NOTIFY_PHONE=+5491234567890
```

### Obtener Credenciales

#### ThingSpeak
1. Registrarse en [ThingSpeak](https://thingspeak.com/)
2. Crear un nuevo canal con 2 campos:
   - Field 1: Temperatura
   - Field 2: Humedad
3. Copiar Channel ID y API Keys desde la configuración del canal

#### Twilio
1. Registrarse en [Twilio](https://www.twilio.com/)
2. Activar WhatsApp Sandbox
3. Copiar Account SID y Auth Token del dashboard
4. El número de WhatsApp será el sandbox: `whatsapp:+14155238886`

### Variables de Entorno del Frontend (Opcional)

Crear un archivo `.env` en la carpeta `frontend`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 💻 Uso

### Iniciar el Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app:app --reload
```

El servidor estará disponible en:
- API: `http://localhost:8000`
- Documentación Swagger: `http://localhost:8000/docs`
- Documentación ReDoc: `http://localhost:8000/redoc`

### Iniciar el Frontend

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

### Acceder a la Aplicación

1. Abrir `http://localhost:5173` en el navegador
2. Click en "Comenzar" en la pantalla de bienvenida
3. El dashboard mostrará:
   - **Métricas en tiempo real** (actualización automática cada 5s)
   - **Estabilizador automático** (cuando detecte valores críticos)
   - **Panel de notificaciones** (envío manual de alertas WhatsApp)
   - **Envío de datos** (simulación manual de sensores)

## 📁 Estructura del Proyecto

```
Proyecto_tecnologia/
├── backend/
│   ├── .venv/                 # Entorno virtual Python
│   ├── app.py                 # Aplicación FastAPI principal
│   ├── requirements.txt       # Dependencias Python
│   ├── .env                   # Variables de entorno (no incluido)
│   └── README.md
│
├── frontend/
│   ├── public/               # Archivos estáticos
│   ├── src/
│   │   ├── assets/          # Imágenes y recursos
│   │   ├── components/      # Componentes React
│   │   │   ├── DataSender.tsx
│   │   │   ├── MetricsCard.tsx
│   │   │   ├── NotificationPanel.tsx
│   │   │   ├── Stabilizer.tsx
│   │   │   └── Welcome.tsx
│   │   ├── services/        # Servicios y API client
│   │   │   └── api.ts
│   │   ├── App.tsx          # Componente principal
│   │   ├── App.css
│   │   ├── main.tsx
│   │   └── types.ts         # Definiciones TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── README.md
│
└── README.md                # Este archivo
```

## 🎯 Sistema de Estabilización

### Funcionamiento

El sistema de estabilización implementa un **control de lazo cerrado** que:

1. **Detecta** valores críticos:
   - Temperatura < 10°C o > 30°C
   - Humedad < 20% o > 80%

2. **Calcula** la trayectoria óptima:
   - Punto objetivo: T = 25°C, H = 60%
   - Ajuste gradual de 5 unidades por paso

3. **Ejecuta** el control selectivo:
   - Si solo temperatura crítica → ajusta temperatura
   - Si solo humedad crítica → ajusta humedad
   - Si ambas críticas → ajusta ambas simultáneamente

4. **Registra** cada paso en ThingSpeak:
   - Intervalo de 16 segundos entre actualizaciones
   - Historial completo de la trayectoria

### Ejemplo de Estabilización

**Condición inicial:**
- Temperatura: 5°C (crítico bajo)
- Humedad: 55% (normal)

**Proceso:**
```
Paso 1: T = 10°C, H = 55% → Enviado a ThingSpeak
Paso 2: T = 15°C, H = 55% → Enviado a ThingSpeak
Paso 3: T = 20°C, H = 55% → Enviado a ThingSpeak
Paso 4: T = 25°C, H = 55% → Estabilización completa
```

**Tiempo total:** 3 pasos × 16s = 48 segundos

## 📡 API Endpoints

### Métricas

```http
GET /metrics
```
Obtiene los últimos valores de temperatura y humedad desde ThingSpeak.

**Respuesta:**
```json
{
  "temperature": 25,
  "humidity": 60,
  "created_at": "2025-11-15T10:30:00Z"
}
```

### Estabilización

```http
POST /stabilize
```
Ejecuta el proceso de estabilización automática.

**Respuesta:**
```json
{
  "stabilization_needed": true,
  "initial_values": { "temperature": 5, "humidity": 55 },
  "target_values": { "temperature": 25, "humidity": 60 },
  "steps": [
    { "step": 1, "temperature": 10, "humidity": 55, "entry_id": "1234" },
    { "step": 2, "temperature": 15, "humidity": 55, "entry_id": "1235" }
  ],
  "total_steps": 4,
  "messages": ["CRÍTICO - niveles MUY BAJOS de temperatura"]
}
```

### Enviar Datos

```http
POST /send-to-thingspeak
Content-Type: application/json

{
  "temperature": 25.5,
  "humidity": 65.0
}
```

### Verificar y Notificar

```http
POST /check-and-notify
```
Verifica condiciones críticas y envía notificación WhatsApp automáticamente.

### Notificación Manual

```http
POST /notify
Content-Type: application/json

{
  "phone": "+5491234567890",
  "message": "Alerta personalizada"
}
```

## 🎨 Interfaz de Usuario

### Dashboard Principal

- **Métricas en Tiempo Real**: Tarjetas animadas con código de colores según rangos
- **Gráficas Interactivas**: Visualización histórica de ThingSpeak
- **Estabilizador**: Panel dedicado con botón de acción y progreso en tiempo real
- **Notificaciones**: Gestión manual de alertas WhatsApp
- **Envío de Datos**: Simulación de lecturas de sensores

### Códigos de Color

- 🟢 **Verde**: Valores óptimos (15-30°C, 40-80%)
- 🟡 **Amarillo**: Valores de advertencia (10-15°C o 30-35°C, 20-40% o 80-90%)
- 🔴 **Rojo**: Valores críticos (<10°C o >35°C, <20% o >90%)

## 🧪 Desarrollo

### Ejecutar Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run test
```

### Build para Producción

```bash
# Frontend
cd frontend
npm run build
```

Los archivos compilados estarán en `frontend/dist/`

## 🐛 Solución de Problemas

### Error: "Import fastapi could not be resolved"

Asegúrate de tener el entorno virtual activado:
```powershell
.\.venv\Scripts\Activate.ps1
```

### Error: "Port 8000 already in use"

Mata el proceso existente o usa otro puerto:
```powershell
uvicorn app:app --reload --port 8001
```

### Frontend no se conecta al Backend

Verifica que:
1. El backend esté corriendo en `http://localhost:8000`
2. CORS esté habilitado (ya configurado en `app.py`)
3. La variable `VITE_API_BASE_URL` apunte a la URL correcta

### ThingSpeak no actualiza

El API gratuito tiene un límite de una escritura cada 15 segundos. El sistema respeta este límite con delays de 16 segundos.

## 👥 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto fue desarrollado para fines educativos en la cátedra **Tecnologías para la Automatización**.

## 👨‍💻 Autor

**Nicolás Ocampo**
- GitHub: [@NicolashhOcampo](https://github.com/NicolashhOcampo)

## 🙏 Agradecimientos

- Cátedra de Tecnologías para la Automatización
- ThingSpeak por la plataforma IoT gratuita
- Twilio por el servicio de WhatsApp
- Comunidad open source

---

⭐ **Si te gustó el proyecto, dale una estrella en GitHub!**

Proyecto Tecnología para la Automatización © 2025
