// Tipos de datos para el registro de conductor (actualizado para nuevos requisitos)
export type ConductorRegistro = {
  codigo_conductor: string;        // Código único: c110, c111, ... (campo principal en BD)
  telefono: string;
  telefono_verificado?: boolean;
  otp_input?: string;
  email: string;
  email_verificado?: boolean;
  token_email?: string;
  nombre: string;
  apellido: string;
  cedula: string;
  foto_cedula: Buffer;
  selfie: Buffer;
  selfie_cedula: Buffer;
  direccion: string;
  sector: string;
  calle_o_avenida: string;
  numero_casa: string;
  placa: string;
  rif: string;
  foto_rif: Buffer;
  licencia: string;
  tipo_licencia: string;
  vencimiento_licencia: string;
  foto_titulo: Buffer;            // Título del vehículo
  foto_compraventa?: Buffer;      // Documento compra-venta (opcional, pero si se tiene es obligatorio enviar)
  status: 'pendiente_inspeccion' | 'aprobado' | 'rechazado';
};

// Estado de un conductor rechazado que será migrado a cliente
export type ConductorRechazadoMigracion = {
  codigo_conductor_liberado: string; // El código cXXX que se libera
  nuevo_codigo_cliente: string;      // El código p000X asignado como cliente
  razon_rechazo?: string;
  fecha_migracion: Date;
};