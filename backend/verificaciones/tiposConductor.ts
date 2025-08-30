
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

  fecha_registro: Date;
  fecha_ultima_actualizacion?: Date;
  razon_rechazo?: string;         // Razón del rechazo si aplica
  inspector_id?: string;          // ID del inspector que aprobó/rechazó
  fecha_inspeccion?: Date;        // Fecha de la inspección física
  coordenadas_gps?: string;       // GPS de la dirección para verificación
  verificacion_saime?: boolean;   // Verificación con SAIME
  coincidencia_rostro?: number;   // Porcentaje de coincidencia facial (0-100)
  ocr_cedula_resultado?: any;     // Resultado del OCR de cédula
  ocr_licencia_resultado?: any;   // Resultado del OCR de licencia
  ocr_rif_resultado?: any;        // Resultado del OCR de RIF
};

// Estado del conductor durante el proceso de registro
export type EstadoVerificacion = {
  otp_verificado: boolean;
  email_verificado: boolean;
  ocr_cedula_valido: boolean;
  ocr_licencia_valido: boolean;
  ocr_rif_valido: boolean;
  selfie_valido: boolean;
  coincidencia_rostro_valida: boolean;
  direccion_verificada: boolean;
  saime_verificado: boolean;
};

// Validaciones requeridas para aprobar el registro
export const VALIDACIONES_REQUERIDAS: (keyof EstadoVerificacion)[] = [
  'otp_verificado',
  'email_verificado', 
  'ocr_cedula_valido',
  'ocr_licencia_valido',
  'ocr_rif_valido',
  'selfie_valido',
  'coincidencia_rostro_valida',
  'direccion_verificada',
  'saime_verificado'
];

// Mensaje de éxito para mostrar al conductor
export const MENSAJE_REGISTRO_EXITOSO = {
  titulo: "¡Registro exitoso!",
  mensaje: "Su registro ha sido procesado correctamente. Su código de conductor es: {codigo}. Ahora debe pasar por la inspección física en nuestras oficinas para activar su cuenta.",
  instrucciones: "Por favor, diríjase a nuestras oficinas con todos los documentos originales para completar la inspección física. Le notificaremos una vez aprobada su solicitud."

};