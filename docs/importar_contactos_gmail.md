# Importación de Contactos desde Gmail

Este documento describe el proceso de importación masiva de contactos desde Gmail para Taxiplus Maracaibo, conforme a los nuevos requisitos del sistema de registro.

## Resumen del Sistema

### Códigos de Identificación

#### Conductores
- **Formato**: `c110`, `c111`, `c112`, etc.
- **Campo en BD**: `codigo_conductor`
- **Inicio**: Los códigos de conductor empiezan desde `c110`

#### Clientes
- **Formato**: `p0001`, `p0002`, `p0003`, etc.
- **Campo en BD**: `codigo_cliente`
- **Inicio**: Los códigos de cliente empiezan desde `p0001`

### Flujo de Migración por Rechazo

Cuando un conductor es rechazado:
1. Su código `cXXX` se libera y queda disponible para futuros conductores
2. Es automáticamente registrado como cliente con el siguiente código `p000X` disponible
3. Se mantiene un registro de la migración en el campo `codigo_conductor_anterior`

## Proceso de Importación

### 1. Configuración Inicial

#### Credenciales de Gmail
- Configurar OAuth2 con Google
- Obtener permisos para People API
- Configurar email de origen: `taxiplus.con@gmail.com`

#### Prerequisitos
```typescript
// Instalar dependencias
npm install googleapis @types/googleapis
```

### 2. Clasificación de Contactos

Los contactos se clasifican automáticamente en:

#### Clientes
- Contactos marcados como clientes en Gmail
- Contactos sin clasificación específica (por defecto)

#### Conductores
- Contactos marcados específicamente como conductores
- Contactos con información de vehículos/licencias

### 3. Proceso de Importación

#### Para Clientes
```typescript
import { importacionGmailService } from '../scripts/importarContactosGmail';

// Importación automática
const resultado = await importacionGmailService.importarContactosYRegistrarClientes();
console.log(resultado.resumen);
```

#### Para Conductores
- Se asignan códigos empezando desde `c110`
- Quedan en estado `pendiente_inspeccion`
- Requieren verificación manual posterior

### 4. Recuperación de Números Antiguos

#### Para Clientes del Sistema Anterior
```typescript
import { registroClienteService } from '../verificaciones/registroCliente';

// Cliente quiere recuperar su número p123
const resultado = await registroClienteService.registrarCliente(
  datosCliente,
  'p123' // número antiguo deseado
);

if (resultado.recuperacion?.disponible) {
  console.log('Número recuperado exitosamente');
} else {
  console.log('Número no disponible, se asignó alternativo');
}
```

## Mensajes para el Usuario

### Registro de Cliente Nuevo
```
"Como nuevo cliente, se te asignará automáticamente un número de cliente."
```

### Recuperación de Número Antiguo
```
"Si eras cliente del sistema anterior, puedes ingresar tu número antiguo (ejemplo: p123) para intentar recuperarlo. Si no lo recuerdas o prefieres uno nuevo, déjalo en blanco."
```

### Número Recuperado Exitosamente
```
"¡Perfecto! Hemos recuperado tu número anterior: p123"
```

### Número No Disponible
```
"Lo sentimos, el número p123 ya no está disponible. Te hemos asignado el número p0456."
```

### Conductor Rechazado
```
"Has sido registrado como cliente con código p0789. Tu solicitud como conductor ha sido procesada."
```

## Scripts de Importación

### Importación Masiva Completa
```bash
# Ejecutar importación desde Gmail
node -e "
import('./backend/scripts/importarContactosGmail.js').then(async (module) => {
  const resultado = await module.importarContactosYRegistrarClientes();
  console.log(resultado.resumen);
});
"
```

### Migración de Conductor Rechazado
```typescript
import { importacionGmailService } from '../scripts/importarContactosGmail';

// Procesar rechazo de conductor c115
const resultado = await importacionGmailService.procesarRechazoYMigrarACliente(
  'c115',
  'Documentos no válidos'
);
console.log(resultado.mensaje);
```

## Estructura de Base de Datos

### Tabla Clientes
```sql
ALTER TABLE clientes 
ADD COLUMN codigo_cliente VARCHAR(10) NOT NULL,
ADD COLUMN es_migracion_desde_conductor BOOLEAN DEFAULT FALSE,
ADD COLUMN codigo_conductor_anterior VARCHAR(10);
```

### Tabla Conductores
```sql
ALTER TABLE conductores 
ADD COLUMN codigo_conductor VARCHAR(10) NOT NULL;
```

### Índices Recomendados
```sql
CREATE UNIQUE INDEX idx_clientes_codigo ON clientes(codigo_cliente);
CREATE UNIQUE INDEX idx_conductores_codigo ON conductores(codigo_conductor);
```

## Validaciones y Controles

### Formato de Códigos
- **Clientes**: Debe coincidir con patrón `/^p\d+$/`
- **Conductores**: Debe coincidir con patrón `/^c\d+$/` y ser >= 110

### Prevención de Duplicados
- Verificación automática antes de asignación
- Consulta a base de datos de códigos existentes
- Manejo de concurrencia en asignaciones simultáneas

### Manejo de Errores
- Log detallado de errores durante importación
- Rollback automático en caso de fallos críticos
- Notificación de contactos no procesados

## Monitoreo y Logs

### Logs de Importación
```
[2024-01-15 10:30:00] Iniciando importación masiva desde Gmail...
[2024-01-15 10:30:05] Se obtuvieron 150 contactos de Gmail
[2024-01-15 10:30:06] Clasificados: 120 clientes, 30 conductores
[2024-01-15 10:30:15] Importando clientes...
[2024-01-15 10:30:45] Importando conductores...
[2024-01-15 10:31:00] Importación completada
```

### Métricas de Éxito
- Total de contactos procesados
- Clientes importados exitosamente
- Conductores importados exitosamente
- Errores y rechazos
- Tiempo total de procesamiento

## Troubleshooting

### Problemas Comunes

#### Error de Autenticación Gmail
```
Error: Invalid credentials for Gmail API
```
**Solución**: Verificar OAuth2 tokens y permisos de People API

#### Códigos Duplicados
```
Error: Duplicate key violation on codigo_cliente
```
**Solución**: Verificar lógica de asignación secuencial y concurrencia

#### Contactos Sin Clasificar
```
Warning: Contact without type classification
```
**Solución**: Revisar criterios de clasificación automática

### Contacto de Soporte
Para problemas técnicos con la importación, contactar al equipo de desarrollo con:
- Logs completos del error
- Timestamp de la importación
- Número de contactos afectados