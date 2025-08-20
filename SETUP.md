# 🚀 Cómo Ejecutar el Sistema Taxiplus Maracaibo

## Instalación Rápida

### 1. Clonar y Configurar

```bash
git clone https://github.com/Troconiz/z5.git
cd z5
npm install
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales reales
```

### 3. Ejecutar Demo

```bash
npm run demo
```

## 📋 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run demo` | Ejecuta demostración completa del sistema |
| `npm test` | Ejecuta tests unitarios |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm run dev` | Inicia servidor de desarrollo |
| `npm start` | Inicia servidor en producción |
| `npm run lint` | Ejecuta linter |

## 🔧 Configuración de APIs Externas

### Google Cloud APIs
```bash
# 1. Crear proyecto en https://console.cloud.google.com
# 2. Habilitar APIs: Vision, Maps, Gmail, People
# 3. Crear credenciales OAuth2 y Service Account
# 4. Configurar en .env:
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_MAPS_API_KEY=tu_api_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

### SMTP para Emails
```bash
# Gmail App Password
SMTP_HOST=smtp.gmail.com
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_app_password
```

### Twilio para SMS (Opcional)
```bash
TWILIO_SID=tu_twilio_sid
TWILIO_TOKEN=tu_auth_token
```

## 🧪 Ejecutar Tests

```bash
# Tests completos
npm test

# Tests específicos
npx jest tests/asignarCodigo.test.ts

# Tests con coverage
npm run test:coverage
```

## 🖥️ Ejecutar Servidor API

```bash
# Desarrollo
npm run dev

# Producción  
npm run build
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📡 Endpoints de API

### Verificaciones
- `POST /api/enviar-otp` - Enviar código OTP
- `POST /api/enviar-token-email` - Enviar token de email

### Registro
- `POST /api/registrar-conductor` - Registrar conductor
- `POST /api/registrar-cliente` - Registrar cliente

### Consultas
- `GET /api/conductores` - Listar conductores
- `GET /api/clientes` - Listar clientes
- `GET /api/conductores/:codigo` - Obtener conductor por código

### Gmail Import
- `POST /api/importar-gmail` - Importar contactos desde Gmail

## 🗃️ Base de Datos

1. **Crear proyecto en Supabase**
2. **Ejecutar SQL del archivo**: `docs/modelo_datos_supabase.md`
3. **Configurar connection string**: `DATABASE_URL=postgresql://...`

## 📚 Documentación Completa

- `docs/guia_pruebas.md` - Casos de prueba y validación
- `docs/verificacion_automatica.md` - Detalles técnicos de verificaciones
- `docs/frontend_integracion.md` - Guía de integración UI
- `docs/modelo_datos_supabase.md` - Esquema de base de datos

## 🎯 Funcionalidades Principales

### ✅ Registro de Conductores
- Verificación OTP y email
- OCR para cédula, licencia y RIF
- Verificación facial con comparación
- Validación de dirección en Maracaibo
- Consulta SAIME
- Estado: pendiente_inspeccion → aprobado/rechazado

### ✅ Registro de Clientes  
- Verificación simplificada
- Aprobación automática
- Importación desde Gmail

### ✅ Códigos Únicos
- Conductores: c0001, c0002, c0003...
- Clientes: p0001, p0002, p0003...
- Detección y relleno de huecos

### ✅ Importación Gmail
- Conexión con taxiplus.con@mgmail.com
- Asignación automática de códigos
- Prevención de duplicados

## 🚨 Solución de Problemas

### Error: "Google Vision API not configured"
```bash
# Configurar credenciales de Google Cloud
export GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

### Error: "SMTP not configured"  
```bash
# Verificar configuración de email en .env
SMTP_HOST=smtp.gmail.com
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_app_password
```

### Error: "Database connection failed"
```bash
# Verificar connection string de Supabase
DATABASE_URL=postgresql://usuario:password@host:puerto/database
```

## 📞 Soporte

- **Documentación**: Ver archivos en `/docs/`
- **Issues**: Crear issue en GitHub
- **Tests**: `npm test` para verificar funcionalidad

---

**🚖 Taxiplus Maracaibo** - Sistema completo de registro con verificación automática