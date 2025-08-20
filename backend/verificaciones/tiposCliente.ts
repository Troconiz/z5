// Tipos de datos para el registro de cliente (completo)
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
  fecha_registro: Date;
  fecha_ultima_actualizacion?: Date;
  origen_registro: 'manual' | 'gmail_import' | 'app';
  coordenadas_gps?: string;
  verificacion_saime?: boolean;
  coincidencia_rostro?: number;
  ocr_cedula_resultado?: any;
};

// Función para mostrar el nombre del cliente con código al inicio
export function formatearNombreClienteConCodigo(cliente: ClienteRegistro): string {
  return `${cliente.codigo} - ${cliente.nombre} ${cliente.apellido}`;
}

// Función para obtener el display name del cliente para la app
export function obtenerDisplayNameCliente(cliente: ClienteRegistro): string {
  return formatearNombreClienteConCodigo(cliente);
}

// Estado del cliente durante el proceso de registro
export type EstadoVerificacionCliente = {
  otp_verificado: boolean;
  email_verificado: boolean;
  ocr_cedula_valido: boolean;
  selfie_valido: boolean;
  coincidencia_rostro_valida: boolean;
  direccion_verificada: boolean;
  saime_verificado: boolean;
};

// Validaciones requeridas para aprobar el registro de cliente
export const VALIDACIONES_CLIENTE_REQUERIDAS: (keyof EstadoVerificacionCliente)[] = [
  'otp_verificado',
  'email_verificado',
  'ocr_cedula_valido',
  'selfie_valido',
  'coincidencia_rostro_valida',
  'direccion_verificada',
  'saime_verificado'
];

// Configuración para importación desde Gmail
export const GMAIL_IMPORT_CONFIG = {
  email_taxiplus: 'taxiplus.con@mgmail.com',
  campos_requeridos: ['email', 'nombre'],
  auto_asignar_codigo: true,
  evitar_duplicados: true,
  status_inicial: 'aprobado' as const
};