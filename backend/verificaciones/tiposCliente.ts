// Tipos de datos para el registro de cliente (actualizado para nuevos requisitos)
export type ClienteRegistro = {
  codigo_cliente: string;         // Código único: p0001, p0002, ... (campo principal en BD)
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
  es_migracion_desde_conductor?: boolean; // Indica si proviene de conductor rechazado
  codigo_conductor_anterior?: string;     // Si proviene de conductor rechazado, guarda el código original
};

// Datos para recuperación de número antiguo
export type RecuperacionNumeroAntiguo = {
  numero_antiguo_deseado: string;    // El número que el cliente quiere recuperar
  disponible: boolean;               // Si está disponible
  codigo_asignado: string;           // El código finalmente asignado
  mensaje_usuario: string;           // Mensaje para mostrar al usuario
};

// Respuesta del proceso de registro de cliente
export type RespuestaRegistroCliente = {
  exito: boolean;
  cliente?: ClienteRegistro;
  recuperacion_numero?: RecuperacionNumeroAntiguo;
  mensaje: string;
};