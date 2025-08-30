# Modelo de Datos Supabase - Taxiplus Maracaibo

## Tablas Principales

### 1. Tabla `conductores`

```sql
CREATE TABLE conductores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(6) UNIQUE NOT NULL, -- c0001, c0002, etc.
  telefono VARCHAR(15) NOT NULL,
  telefono_verificado BOOLEAN DEFAULT FALSE,
  email VARCHAR(255) NOT NULL,
  email_verificado BOOLEAN DEFAULT FALSE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  cedula VARCHAR(20) NOT NULL,
  foto_cedula BYTEA,
  selfie BYTEA,
  selfie_cedula BYTEA,
  direccion TEXT NOT NULL,
  sector VARCHAR(100),
  calle_o_avenida VARCHAR(200),
  numero_casa VARCHAR(20),
  placa VARCHAR(10) NOT NULL,
  rif VARCHAR(20) NOT NULL,
  foto_rif BYTEA,
  licencia VARCHAR(30) NOT NULL,
  tipo_licencia VARCHAR(10),
  vencimiento_licencia DATE,
  foto_titulo BYTEA,
  foto_compraventa BYTEA,
  status VARCHAR(20) DEFAULT 'pendiente_inspeccion' CHECK (status IN ('pendiente_inspeccion', 'aprobado', 'rechazado')),
  fecha_registro TIMESTAMP DEFAULT NOW(),
  fecha_ultima_actualizacion TIMESTAMP,
  razon_rechazo TEXT,
  inspector_id UUID,
  fecha_inspeccion TIMESTAMP,
  coordenadas_gps VARCHAR(50),
  verificacion_saime BOOLEAN DEFAULT FALSE,
  coincidencia_rostro INTEGER, -- Porcentaje 0-100
  ocr_cedula_resultado JSONB,
  ocr_licencia_resultado JSONB,
  ocr_rif_resultado JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_conductores_codigo ON conductores(codigo);
CREATE INDEX idx_conductores_cedula ON conductores(cedula);
CREATE INDEX idx_conductores_status ON conductores(status);
CREATE INDEX idx_conductores_fecha_registro ON conductores(fecha_registro);
```

### 2. Tabla `clientes`

```sql
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(6) UNIQUE NOT NULL, -- p0001, p0002, etc.
  telefono VARCHAR(15),
  telefono_verificado BOOLEAN DEFAULT FALSE,
  email VARCHAR(255) NOT NULL,
  email_verificado BOOLEAN DEFAULT FALSE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  cedula VARCHAR(20),
  foto_cedula BYTEA,
  selfie BYTEA,
  selfie_cedula BYTEA,
  direccion TEXT,
  sector VARCHAR(100),
  calle_o_avenida VARCHAR(200),
  numero_casa VARCHAR(20),
  status VARCHAR(20) DEFAULT 'aprobado' CHECK (status IN ('aprobado', 'inactivo')),
  fecha_registro TIMESTAMP DEFAULT NOW(),
  fecha_ultima_actualizacion TIMESTAMP,
  origen_registro VARCHAR(20) DEFAULT 'manual' CHECK (origen_registro IN ('manual', 'gmail_import', 'app')),
  coordenadas_gps VARCHAR(50),
  verificacion_saime BOOLEAN DEFAULT FALSE,
  coincidencia_rostro INTEGER,
  ocr_cedula_resultado JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_clientes_codigo ON clientes(codigo);
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_status ON clientes(status);
CREATE INDEX idx_clientes_origen ON clientes(origen_registro);
```

### 3. Tabla `verificaciones_otp`

```sql
CREATE TABLE verificaciones_otp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telefono VARCHAR(15) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  intentos INTEGER DEFAULT 0,
  expirado_en TIMESTAMP NOT NULL,
  verificado BOOLEAN DEFAULT FALSE,
  tipo VARCHAR(20) NOT NULL, -- 'conductor', 'cliente'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_otp_telefono ON verificaciones_otp(telefono);
CREATE INDEX idx_otp_expiry ON verificaciones_otp(expirado_en);
```

### 4. Tabla `verificaciones_email`

```sql
CREATE TABLE verificaciones_email (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(64) NOT NULL,
  expirado_en TIMESTAMP NOT NULL,
  verificado BOOLEAN DEFAULT FALSE,
  tipo VARCHAR(20) NOT NULL, -- 'conductor', 'cliente'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_token ON verificaciones_email(email, token);
CREATE INDEX idx_email_expiry ON verificaciones_email(expirado_en);
```

### 5. Tabla `auditoria_verificaciones`

```sql
CREATE TABLE auditoria_verificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_entidad VARCHAR(20) NOT NULL, -- 'conductor', 'cliente'
  entidad_id UUID NOT NULL,
  tipo_verificacion VARCHAR(50) NOT NULL, -- 'otp', 'email', 'ocr_cedula', etc.
  resultado BOOLEAN NOT NULL,
  detalles JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_auditoria_entidad ON auditoria_verificaciones(tipo_entidad, entidad_id);
CREATE INDEX idx_auditoria_tipo ON auditoria_verificaciones(tipo_verificacion);
CREATE INDEX idx_auditoria_fecha ON auditoria_verificaciones(created_at);
```

## Funciones de Base de Datos

### 1. Función para actualizar timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_conductores_updated_at BEFORE UPDATE ON conductores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Función para generar código automático

```sql
CREATE OR REPLACE FUNCTION generar_codigo_conductor()
RETURNS VARCHAR(6) AS $$
DECLARE
    nuevo_codigo VARCHAR(6);
    numero INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 2) AS INTEGER)), 0) + 1 
    INTO numero 
    FROM conductores 
    WHERE codigo ~ '^c[0-9]{4}$';
    
    nuevo_codigo := 'c' || LPAD(numero::TEXT, 4, '0');
    
    RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generar_codigo_cliente()
RETURNS VARCHAR(6) AS $$
DECLARE
    nuevo_codigo VARCHAR(6);
    numero INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 2) AS INTEGER)), 0) + 1 
    INTO numero 
    FROM clientes 
    WHERE codigo ~ '^p[0-9]{4}$';
    
    nuevo_codigo := 'p' || LPAD(numero::TEXT, 4, '0');
    
    RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql;
```

## Vistas Útiles

### 1. Vista de conductores con estado de verificaciones

```sql
CREATE VIEW vista_conductores_verificaciones AS
SELECT 
    c.*,
    CASE 
        WHEN c.telefono_verificado AND c.email_verificado AND c.verificacion_saime 
             AND c.ocr_cedula_resultado IS NOT NULL AND c.ocr_licencia_resultado IS NOT NULL 
             AND c.ocr_rif_resultado IS NOT NULL AND c.coincidencia_rostro >= 80
        THEN TRUE 
        ELSE FALSE 
    END as todas_verificaciones_completas
FROM conductores c;
```

### 2. Vista de clientes con formato de display

```sql
CREATE VIEW vista_clientes_display AS
SELECT 
    c.*,
    (c.codigo || ' - ' || c.nombre || ' ' || c.apellido) as nombre_display
FROM clientes c
ORDER BY c.codigo;
```

## Políticas de Seguridad (RLS)

```sql
-- Habilitar RLS
ALTER TABLE conductores ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Políticas para conductores
CREATE POLICY "Los conductores pueden ver sus propios datos" ON conductores
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Los administradores pueden ver todos los conductores" ON conductores
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para clientes
CREATE POLICY "Los clientes pueden ver sus propios datos" ON clientes
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Los administradores pueden ver todos los clientes" ON clientes
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```