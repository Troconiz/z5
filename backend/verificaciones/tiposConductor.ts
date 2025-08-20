// Tipos de datos para el registro de conductor (modificado)
export type ConductorRegistro = {
  codigo: string;                // Código único: c0001, c0002, ...
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