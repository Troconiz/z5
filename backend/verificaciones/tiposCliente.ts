export type ClienteRegistro = {
  codigo: string;                // Código único: p0001, p0002, ...
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
  status: 'aprobado' | 'inactivo';
};