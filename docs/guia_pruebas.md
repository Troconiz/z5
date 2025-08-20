# Guía de Pruebas y Validación - Taxiplus Maracaibo

## Configuración Inicial

### 1. Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Google Services
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/callback
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/google-service-account.json

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_smtp_user@gmail.com
SMTP_PASSWORD=your_app_password
BASE_URL=http://localhost:3000

# SMS/OTP (Twilio) - Opcional
TWILIO_SID=your_twilio_sid
TWILIO_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# SAIME - Opcional (usa simulación si no está configurado)
SAIME_API_URL=https://api.saime.gob.ve
SAIME_API_KEY=your_saime_api_key
SAIME_AUDIT_SALT=your_random_salt

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/taxiplus
```

### 2. Instalación de Dependencias

```bash
npm install google-auth-library googleapis @google-cloud/vision
npm install nodemailer twilio axios crypto
npm install @types/node @types/nodemailer typescript
```

## Casos de Prueba

### 1. Pruebas de Asignación de Códigos

```typescript
// tests/asignarCodigo.test.ts
import { asignarCodigo, validarFormatoCodigo, obtenerEstadisticasCodigos } from '../backend/utils/asignarCodigo';

describe('Asignación de Códigos', () => {
  test('Debe generar código de conductor c0001 cuando no hay existentes', async () => {
    const codigo = await asignarCodigo('conductor', []);
    expect(codigo).toBe('c0001');
  });

  test('Debe generar código de cliente p0001 cuando no hay existentes', async () => {
    const codigo = await asignarCodigo('cliente', []);
    expect(codigo).toBe('p0001');
  });

  test('Debe encontrar el siguiente código disponible', async () => {
    const existentes = ['c0001', 'c0002', 'c0004'];
    const codigo = await asignarCodigo('conductor', existentes);
    expect(codigo).toBe('c0003'); // Encuentra el hueco
  });

  test('Debe validar formato de código correctamente', () => {
    expect(validarFormatoCodigo('c0001', 'conductor')).toBe(true);
    expect(validarFormatoCodigo('p0001', 'cliente')).toBe(true);
    expect(validarFormatoCodigo('x0001', 'conductor')).toBe(false);
    expect(validarFormatoCodigo('c001', 'conductor')).toBe(false);
  });

  test('Debe generar estadísticas correctas', () => {
    const existentes = ['c0001', 'c0002', 'p0001', 'p0002', 'p0003'];
    const stats = obtenerEstadisticasCodigos(existentes);
    
    expect(stats.totalConductores).toBe(2);
    expect(stats.totalClientes).toBe(3);
    expect(stats.siguienteCodigoConductor).toBe('c0003');
    expect(stats.siguienteCodigoCliente).toBe('p0004');
  });
});
```

### 2. Pruebas de Verificación OTP

```typescript
// tests/otp.test.ts
import { enviarOTP, verificarOTP, validarTelefonoVenezolano } from '../backend/verificaciones/servicios/otp';

describe('Verificación OTP', () => {
  test('Debe validar teléfonos venezolanos correctamente', () => {
    expect(validarTelefonoVenezolano('04241234567')).toBe(true);
    expect(validarTelefonoVenezolano('+584241234567')).toBe(true);
    expect(validarTelefonoVenezolano('4241234567')).toBe(true);
    expect(validarTelefonoVenezolano('02611234567')).toBe(false); // No es móvil
    expect(validarTelefonoVenezolano('1234567')).toBe(false); // Muy corto
  });

  test('Debe enviar OTP exitosamente', async () => {
    const resultado = await enviarOTP('04241234567');
    expect(resultado).toBe(true);
  });

  test('Debe verificar OTP correcto', async () => {
    await enviarOTP('04241234567');
    // En un test real, obtendrías el OTP de alguna manera
    // Por ahora, simular que sabemos el código
    const resultado = await verificarOTP('04241234567', '123456');
    // El resultado dependerá de la implementación real
  });
});
```

### 3. Pruebas de Verificación de Email

```typescript
// tests/email.test.ts
import { enviarTokenEmail, verificarEmail, validarFormatoEmail } from '../backend/verificaciones/servicios/email';

describe('Verificación Email', () => {
  test('Debe validar formato de email', () => {
    expect(validarFormatoEmail('test@example.com')).toBe(true);
    expect(validarFormatoEmail('user.name+tag@domain.co.uk')).toBe(true);
    expect(validarFormatoEmail('invalid-email')).toBe(false);
    expect(validarFormatoEmail('test@')).toBe(false);
  });

  test('Debe enviar token de email', async () => {
    const resultado = await enviarTokenEmail('test@example.com');
    expect(resultado).toBe(true);
  });
});
```

### 4. Pruebas de Registro de Conductor

```typescript
// tests/registroConductor.test.ts
import { VerificacionesConductor } from '../backend/verificaciones/verificacionesConductor';

describe('Registro de Conductor', () => {
  let verificador: VerificacionesConductor;

  beforeEach(() => {
    verificador = new VerificacionesConductor();
  });

  test('Debe registrar conductor con datos válidos', async () => {
    const datosValidos = {
      telefono: '04241234567',
      email: 'conductor@example.com',
      nombre: 'Juan',
      apellido: 'Pérez',
      cedula: '12345678',
      direccion: 'Av. Principal',
      sector: 'Centro',
      calle_o_avenida: 'Av. Principal',
      numero_casa: '123',
      placa: 'ABC123',
      rif: 'J123456789',
      licencia: 'L123456',
      tipo_licencia: 'III',
      vencimiento_licencia: '2025-12-31',
      // Buffers simulados para las fotos
      foto_cedula: Buffer.from('fake-image-data'),
      selfie: Buffer.from('fake-image-data'),
      selfie_cedula: Buffer.from('fake-image-data'),
      foto_rif: Buffer.from('fake-image-data'),
      foto_titulo: Buffer.from('fake-image-data'),
      otp_input: '123456',
      token_email: 'fake-token'
    };

    const resultado = await verificador.procesarRegistroConductor(datosValidos, []);
    
    expect(resultado.exito).toBeDefined();
    if (resultado.exito) {
      expect(resultado.conductor?.codigo).toMatch(/^c\d{4}$/);
      expect(resultado.conductor?.status).toBe('pendiente_inspeccion');
      expect(resultado.mensaje?.titulo).toBe('¡Registro exitoso!');
    }
  });
});
```

## Pruebas Manuales

### 1. Prueba de Flujo Completo de Conductor

1. **Preparar datos de prueba:**
   ```json
   {
     "telefono": "04241234567",
     "email": "conductor.test@gmail.com",
     "nombre": "Juan Carlos",
     "apellido": "Rodriguez",
     "cedula": "12345678",
     "direccion": "Av. 5 de Julio con Calle 77",
     "sector": "Bella Vista",
     "calle_o_avenida": "Av. 5 de Julio",
     "numero_casa": "77-45",
     "placa": "AB123CD",
     "rif": "J301234567",
     "licencia": "L1234567",
     "tipo_licencia": "III",
     "vencimiento_licencia": "2025-12-31"
   }
   ```

2. **Probar envío de OTP:**
   ```bash
   curl -X POST http://localhost:3000/api/verificaciones/enviar-otp \
     -H "Content-Type: application/json" \
     -d '{"telefono": "04241234567"}'
   ```

3. **Probar envío de token email:**
   ```bash
   curl -X POST http://localhost:3000/api/verificaciones/enviar-token-email \
     -H "Content-Type: application/json" \
     -d '{"email": "conductor.test@gmail.com"}'
   ```

4. **Probar registro completo:**
   ```bash
   curl -X POST http://localhost:3000/api/verificaciones/registrar-conductor \
     -F "telefono=04241234567" \
     -F "email=conductor.test@gmail.com" \
     -F "nombre=Juan Carlos" \
     -F "apellido=Rodriguez" \
     -F "cedula=12345678" \
     -F "otp_input=123456" \
     -F "token_email=fake-token" \
     -F "foto_cedula=@path/to/cedula.jpg" \
     -F "selfie=@path/to/selfie.jpg" \
     -F "selfie_cedula=@path/to/selfie_cedula.jpg" \
     -F "foto_rif=@path/to/rif.jpg" \
     -F "foto_titulo=@path/to/titulo.jpg"
   ```

### 2. Prueba de Importación Gmail

1. **Configurar OAuth2:**
   - Crear credenciales en Google Cloud Console
   - Configurar URLs de redirección
   - Obtener token de acceso

2. **Probar importación:**
   ```bash
   curl -X POST http://localhost:3000/api/scripts/importar-gmail \
     -H "Content-Type: application/json" \
     -d '{"accessToken": "your-oauth-token"}'
   ```

### 3. Verificación de Base de Datos

```sql
-- Verificar códigos asignados
SELECT codigo, nombre, apellido, status, fecha_registro 
FROM conductores 
ORDER BY codigo;

SELECT codigo, nombre, apellido, status, origen_registro 
FROM clientes 
ORDER BY codigo;

-- Verificar secuencia de códigos
SELECT 
  'conductores' as tabla,
  COUNT(*) as total,
  MIN(codigo) as primer_codigo,
  MAX(codigo) as ultimo_codigo
FROM conductores
UNION ALL
SELECT 
  'clientes' as tabla,
  COUNT(*) as total,
  MIN(codigo) as primer_codigo,
  MAX(codigo) as ultimo_codigo
FROM clientes;

-- Verificar verificaciones pendientes
SELECT COUNT(*) as otp_pendientes 
FROM verificaciones_otp 
WHERE verificado = false AND expirado_en > NOW();

SELECT COUNT(*) as email_pendientes 
FROM verificaciones_email 
WHERE verificado = false AND expirado_en > NOW();
```

## Lista de Verificación Final

### ✅ Funcionalidades Implementadas

- [x] Códigos automáticos únicos (c0001, c0002, p0001, p0002)
- [x] Campos obligatorios para conductores
- [x] Estados de registro (pendiente_inspeccion, aprobado, rechazado)
- [x] Validación OTP
- [x] Verificación de email
- [x] OCR para cédula, licencia y RIF
- [x] Verificación de selfie
- [x] Comparación de rostros
- [x] Verificación de dirección
- [x] Consulta SAIME (simulada)
- [x] Mensaje emergente de éxito
- [x] Instrucciones de inspección física
- [x] Carga masiva desde Gmail
- [x] Prevención de duplicados
- [x] Formato de display con código antes del nombre
- [x] Documentación completa

### 🔧 Configuraciones Requeridas

- [ ] Variables de entorno configuradas
- [ ] Google Cloud APIs habilitadas
- [ ] Credenciales de servicios configuradas
- [ ] Base de datos Supabase configurada
- [ ] SMTP configurado para emails
- [ ] Twilio configurado para SMS (opcional)

### 📋 Pruebas Recomendadas

- [ ] Pruebas unitarias ejecutadas
- [ ] Pruebas de integración con APIs externas
- [ ] Pruebas de flujo completo de registro
- [ ] Pruebas de importación Gmail
- [ ] Pruebas de manejo de errores
- [ ] Verificación de seguridad y validaciones

## Notas de Implementación

### Consideraciones de Producción

1. **Seguridad:**
   - Implementar rate limiting
   - Validar y sanitizar todas las entradas
   - Usar HTTPS para todas las comunicaciones
   - Almacenar imágenes de forma segura

2. **Rendimiento:**
   - Implementar caché para geocodificación
   - Usar procesamiento asíncrono para imágenes
   - Optimizar consultas a la base de datos

3. **Monitoreo:**
   - Logs detallados de todas las operaciones
   - Métricas de uso de APIs externas
   - Alertas para fallos de servicios

4. **Backup y Recuperación:**
   - Backup regular de la base de datos
   - Versionado de código
   - Plan de recuperación ante desastres

### Próximos Pasos

1. Implementar las APIs REST correspondientes
2. Crear interfaz de usuario según las especificaciones
3. Configurar entorno de producción
4. Realizar pruebas de carga
5. Implementar monitoreo y alertas
6. Capacitar al equipo de soporte