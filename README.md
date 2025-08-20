# Taxiplus Maracaibo - Sistema de Registro y Verificación

Sistema completo de registro y verificación automática para conductores y clientes de Taxiplus Maracaibo, con códigos únicos automáticos, validaciones múltiples y integración con servicios externos.

## 🚀 Características Principales

### ✅ Códigos Automáticos Únicos
- **Conductores**: c0001, c0002, c0003, ...
- **Clientes**: p0001, p0002, p0003, ...
- Asignación automática sin duplicados
- Manejo de códigos reservados incluso si se rechaza el registro

### ✅ Registro Completo de Conductores
- **Campos obligatorios**: foto de cédula, selfie, selfie con cédula, dirección completa, placa, RIF, licencia y datos, foto del título del vehículo
- **Documento opcional**: foto de documento de compra-venta (obligatorio enviar si se tiene)
- **Estados**: `pendiente_inspeccion`, `aprobado`, `rechazado`
- **Mensaje emergente** de éxito con instrucciones para inspección física

### ✅ Verificaciones Automáticas Completas
- **OTP por SMS**: Validación de número de teléfono
- **Email**: Token de verificación con enlace
- **OCR avanzado**: Cédula, licencia de conducir y RIF
- **Verificación facial**: Selfie válido y comparación de rostros
- **Dirección**: Geocodificación y validación en Maracaibo
- **SAIME**: Consulta con registro nacional (simulada)

### ✅ Importación Masiva Gmail
- Conexión con cuenta `taxiplus.con@mgmail.com`
- Asignación automática de códigos de cliente
- Prevención de duplicados por email
- Importación en lote con reporte de resultados

### ✅ Display con Código
- Los clientes se muestran como: `p0001 - Juan Pérez`
- Formato consistente en registros, consultas y aplicación
- Ordenamiento y búsqueda por código

## 📁 Estructura del Proyecto

```
backend/
├── verificaciones/
│   ├── tiposConductor.ts          # Tipos y validaciones de conductor
│   ├── tiposCliente.ts            # Tipos y formateo de cliente
│   ├── verificacionesConductor.ts # Lógica completa de verificación
│   ├── verificaciones.ts          # Sistema integrado general
│   └── servicios/
│       ├── ocr.ts                 # Reconocimiento óptico de caracteres
│       ├── facial.ts              # Verificación facial y comparación
│       ├── otp.ts                 # Verificación SMS/OTP
│       ├── email.ts               # Verificación de email
│       ├── direccion.ts           # Validación de direcciones
│       └── saime.ts               # Consulta registro nacional
├── utils/
│   └── asignarCodigo.ts           # Generación de códigos únicos
├── scripts/
│   └── importarContactosGmail.ts  # Importación masiva Gmail
└── api-example.ts                 # Ejemplo de implementación API

docs/
├── modelo_datos_supabase.md       # Esquema de base de datos
├── verificacion_automatica.md     # Detalle de verificaciones
├── frontend_integracion.md        # Guía de integración UI
└── guia_pruebas.md               # Casos de prueba y validación
```

## 🛠️ Tecnologías Utilizadas

### APIs y Servicios Externos
- **Google Vision API**: OCR de documentos
- **Google Maps API**: Geocodificación de direcciones
- **Gmail API / People API**: Importación de contactos
- **Twilio**: Envío de SMS/OTP
- **SAIME API**: Verificación de cédulas (simulada)

### Librerías Node.js
- `@google-cloud/vision`: Reconocimiento óptico
- `googleapis`: Integración con Google APIs
- `nodemailer`: Envío de emails
- `twilio`: Servicios SMS
- `axios`: Cliente HTTP

## ⚙️ Configuración

### 1. Variables de Entorno

```env
# Google Services
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/callback
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
BASE_URL=http://localhost:3000

# SMS (Opcional)
TWILIO_SID=your_twilio_sid
TWILIO_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# SAIME (Opcional)
SAIME_API_URL=https://api.saime.gob.ve
SAIME_API_KEY=your_saime_key
```

### 2. Instalación

```bash
npm install google-auth-library googleapis @google-cloud/vision
npm install nodemailer twilio axios crypto
npm install @types/node @types/nodemailer typescript
```

## 🚦 Uso Básico

### Registro de Conductor

```typescript
import { VerificacionesConductor } from './backend/verificaciones/verificacionesConductor';

const verificador = new VerificacionesConductor();

const resultado = await verificador.procesarRegistroConductor({
  telefono: '04241234567',
  email: 'conductor@example.com',
  nombre: 'Juan',
  apellido: 'Pérez',
  cedula: '12345678',
  // ... más campos
  foto_cedula: imageBuffer,
  selfie: imageBuffer,
  otp_input: '123456',
  token_email: 'verification-token'
}, codigosExistentes);

if (resultado.exito) {
  console.log(`Conductor registrado: ${resultado.conductor.codigo}`);
  // Mostrar popup con resultado.mensaje
} else {
  console.log('Errores:', resultado.errores);
}
```

### Registro de Cliente

```typescript
import { VerificacionesGenerales } from './backend/verificaciones/verificaciones';

const verificaciones = new VerificacionesGenerales();

const resultado = await verificaciones.procesarRegistroCliente({
  telefono: '04241234567',
  email: 'cliente@example.com',
  nombre: 'María',
  apellido: 'González',
  selfie: imageBuffer
}, codigosExistentes);

// Cliente se aprueba automáticamente si pasa validaciones básicas
```

### Importación Gmail

```typescript
import { ImportadorContactosGmail } from './backend/scripts/importarContactosGmail';

const importador = new ImportadorContactosGmail();

const resultado = await importador.importarContactosYRegistrarClientes(
  'oauth-access-token',
  codigosExistentes,
  emailsExistentes
);

console.log(`Importados: ${resultado.clientesImportados.length} clientes`);
```

## 📋 Flujo de Verificación

### Para Conductores
1. **Datos básicos** → Validación de formato
2. **OTP** → Verificación de teléfono
3. **Email** → Token de verificación
4. **OCR Cédula** → Extracción y validación de datos
5. **OCR Licencia** → Verificación de vigencia
6. **OCR RIF** → Validación de formato
7. **Selfie** → Detección facial válida
8. **Comparación** → Rostro vs foto de cédula (≥80%)
9. **Dirección** → Geocodificación en Maracaibo
10. **SAIME** → Consulta registro nacional
11. **Estado** → `pendiente_inspeccion`
12. **Inspección física** → `aprobado` o `rechazado`

### Para Clientes
1. **Datos básicos** → Email y nombre mínimos
2. **Selfie** → Verificación facial básica
3. **Estado** → `aprobado` inmediatamente

## 🎨 Integración Frontend

### Popup de Éxito

```typescript
const PopupExito = ({ mensaje, onClose }) => (
  <div className="popup-overlay">
    <div className="popup-content">
      <h2>{mensaje.titulo}</h2>
      <p>{mensaje.mensaje}</p>
      {mensaje.instrucciones && (
        <div className="instrucciones">
          <strong>Próximos pasos:</strong>
          <p>{mensaje.instrucciones}</p>
        </div>
      )}
      <button onClick={onClose}>Entendido</button>
    </div>
  </div>
);
```

### Lista de Clientes

```typescript
// Los clientes se muestran con código al inicio
{clientes.map(cliente => (
  <div key={cliente.codigo}>
    <strong>{cliente.codigo} - {cliente.nombre} {cliente.apellido}</strong>
    <span>{cliente.email}</span>
  </div>
))}
```

## 🧪 Pruebas

```bash
# Ejecutar pruebas unitarias
npm test

# Pruebar verificación completa
npm run test:verificaciones

# Probar importación Gmail
npm run test:gmail
```

Ver `docs/guia_pruebas.md` para casos de prueba detallados.

## 📊 Base de Datos

Esquema completo en `docs/modelo_datos_supabase.md`:

- **conductores**: Registro completo con verificaciones
- **clientes**: Registro simplificado con código
- **verificaciones_otp**: Control de códigos SMS
- **verificaciones_email**: Tokens de email
- **auditoria_verificaciones**: Trazabilidad completa

## 🔒 Seguridad

- Validación exhaustiva de todos los inputs
- Rate limiting para APIs externas
- Almacenamiento seguro de imágenes
- Logs de auditoría completos
- Tokens con expiración automática

## 📈 Monitoreo

- Métricas de éxito por tipo de verificación
- Tiempo de respuesta de servicios externos
- Distribución geográfica de registros
- Alertas de servicios caídos

## 🚀 Próximos Pasos

1. **API REST**: Implementar endpoints según `api-example.ts`
2. **UI/UX**: Crear interfaces según `frontend_integracion.md`
3. **Producción**: Configurar entorno con todas las APIs
4. **Pruebas**: Ejecutar suite completa de validación
5. **Despliegue**: Implementar en Supabase y servicios cloud

## 📞 Soporte

Para configuración, integración o problemas técnicos, consultar:
- `docs/verificacion_automatica.md` - Detalles técnicos
- `docs/guia_pruebas.md` - Casos de prueba
- `docs/frontend_integracion.md` - Integración UI

---

**Taxiplus Maracaibo** - Sistema completo de registro con verificación automática y códigos únicos.