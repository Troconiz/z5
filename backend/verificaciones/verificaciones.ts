// Lógica de verificaciones automáticas - Sistema integrado
import { VerificacionesConductor } from './verificacionesConductor';
import { ClienteRegistro, EstadoVerificacionCliente, VALIDACIONES_CLIENTE_REQUERIDAS } from './tiposCliente';
import { asignarCodigo } from '../utils/asignarCodigo';
import { ocrCedula } from './servicios/ocr';
import { verificarSelfie, compararRostros } from './servicios/facial';
import { verificarOTP, enviarOTP } from './servicios/otp';
import { verificarEmail, enviarTokenEmail } from './servicios/email';
import { verificarDireccion } from './servicios/direccion';
import { verificarSAIME } from './servicios/saime';

export class VerificacionesGenerales {
  private verificadorConductor: VerificacionesConductor;

  constructor() {
    this.verificadorConductor = new VerificacionesConductor();
  }

  /**
   * Procesa el registro completo de un cliente con verificaciones
   */
  async procesarRegistroCliente(data: Partial<ClienteRegistro>, codigosExistentes: string[]): Promise<{
    exito: boolean;
    cliente?: ClienteRegistro;
    errores?: string[];
    mensaje?: { titulo: string; mensaje: string };
  }> {
    try {
      // 1. Asignar código único automáticamente
      const codigo = await asignarCodigo('cliente', codigosExistentes);
      
      // 2. Crear el registro inicial
      const cliente: ClienteRegistro = {
        ...data as ClienteRegistro,
        codigo,
        status: 'aprobado', // Los clientes se aprueban automáticamente si pasan validaciones
        fecha_registro: new Date(),
        origen_registro: 'manual'
      };

      // 3. Ejecutar verificaciones automáticas
      const estadoVerificacion = await this.ejecutarVerificacionesCliente(cliente);
      
      // 4. Determinar si todas las verificaciones pasaron
      const todasValidas = this.validarEstadoCliente(estadoVerificacion);
      
      if (!todasValidas) {
        const errores = this.obtenerErroresValidacionCliente(estadoVerificacion);
        return {
          exito: false,
          errores,
          cliente
        };
      }

      // 5. Mensaje de éxito para cliente
      const mensaje = {
        titulo: "¡Registro exitoso!",
        mensaje: `Bienvenido a Taxiplus Maracaibo. Su código de cliente es: ${codigo}. Ya puede usar nuestros servicios.`
      };

      return {
        exito: true,
        cliente,
        mensaje
      };

    } catch (error) {
      return {
        exito: false,
        errores: [`Error durante el procesamiento: ${error instanceof Error ? error.message : 'Error desconocido'}`]
      };
    }
  }

  /**
   * Procesa el registro de conductor usando el verificador especializado
   */
  async procesarRegistroConductor(data: any, codigosExistentes: string[]) {
    return await this.verificadorConductor.procesarRegistroConductor(data, codigosExistentes);
  }

  /**
   * Ejecuta verificaciones específicas para clientes
   */
  private async ejecutarVerificacionesCliente(cliente: ClienteRegistro): Promise<EstadoVerificacionCliente> {
    const estado: EstadoVerificacionCliente = {
      otp_verificado: false,
      email_verificado: false,
      ocr_cedula_valido: false,
      selfie_valido: false,
      coincidencia_rostro_valida: false,
      direccion_verificada: false,
      saime_verificado: false
    };

    try {
      // Verificación OTP
      if (cliente.otp_input) {
        estado.otp_verificado = await verificarOTP(cliente.telefono, cliente.otp_input);
      }

      // Verificación Email
      if (cliente.token_email) {
        estado.email_verificado = await verificarEmail(cliente.email, cliente.token_email);
      }

      // OCR de Cédula
      if (cliente.foto_cedula && cliente.cedula) {
        const resultadoOCR = await ocrCedula(cliente.foto_cedula);
        cliente.ocr_cedula_resultado = resultadoOCR;
        estado.ocr_cedula_valido = this.validarOCRCedulaCliente(resultadoOCR, cliente);
      }

      // Verificación de Selfie
      if (cliente.selfie) {
        estado.selfie_valido = await verificarSelfie(cliente.selfie);
      }

      // Comparación de rostros (selfie vs foto cédula)
      if (cliente.selfie && cliente.foto_cedula) {
        const porcentajeCoincidencia = await compararRostros(cliente.selfie, cliente.foto_cedula);
        cliente.coincidencia_rostro = porcentajeCoincidencia;
        estado.coincidencia_rostro_valida = porcentajeCoincidencia >= 75; // Umbral menor para clientes
      }

      // Verificación de dirección (opcional para clientes)
      if (cliente.direccion) {
        const resultadoDireccion = await verificarDireccion(cliente.direccion, cliente.sector);
        estado.direccion_verificada = resultadoDireccion.valida;
        cliente.coordenadas_gps = resultadoDireccion.coordenadas;
      } else {
        estado.direccion_verificada = true; // No requerida para clientes
      }

      // Verificación SAIME (opcional para clientes si no tienen cédula completa)
      if (cliente.cedula && cliente.nombre && cliente.apellido) {
        estado.saime_verificado = await verificarSAIME(cliente.cedula, cliente.nombre, cliente.apellido);
        cliente.verificacion_saime = estado.saime_verificado;
      } else {
        estado.saime_verificado = true; // No requerida si faltan datos
      }

    } catch (error) {
      console.error('Error durante las verificaciones de cliente:', error);
    }

    return estado;
  }

  /**
   * Valida que las verificaciones requeridas para cliente hayan pasado
   */
  private validarEstadoCliente(estado: EstadoVerificacionCliente): boolean {
    // Para clientes, requerimos menos validaciones
    const validacionesMinimas: (keyof EstadoVerificacionCliente)[] = [
      'email_verificado',
      'selfie_valido'
    ];

    return validacionesMinimas.every(validacion => estado[validacion]);
  }

  /**
   * Obtiene errores específicos para clientes
   */
  private obtenerErroresValidacionCliente(estado: EstadoVerificacionCliente): string[] {
    const errores: string[] = [];
    
    if (!estado.email_verificado) errores.push('Email no verificado');
    if (!estado.selfie_valido) errores.push('Selfie no es válido');
    
    // Advertencias opcionales
    if (!estado.otp_verificado && errores.length === 0) {
      errores.push('Recomendamos verificar el teléfono');
    }
    
    if (!estado.ocr_cedula_valido && errores.length === 0) {
      errores.push('Recomendamos subir foto de cédula');
    }

    return errores;
  }

  /**
   * Valida OCR de cédula para cliente
   */
  private validarOCRCedulaCliente(resultado: any, cliente: ClienteRegistro): boolean {
    if (!resultado || !cliente.cedula) return true; // Opcional para clientes
    
    const cedulaExtraida = resultado.cedula?.replace(/\D/g, '');
    const cedulaIngresada = cliente.cedula?.replace(/\D/g, '');
    
    return cedulaExtraida === cedulaIngresada;
  }

  /**
   * Envía OTP para verificación
   */
  async enviarOTP(telefono: string): Promise<boolean> {
    return await enviarOTP(telefono);
  }

  /**
   * Envía token de verificación de email
   */
  async enviarTokenEmail(email: string): Promise<boolean> {
    return await enviarTokenEmail(email);
  }

  /**
   * Verifica la configuración de todos los servicios
   */
  async verificarConfiguracion(): Promise<{
    servicios: { [key: string]: boolean };
    errores: string[];
  }> {
    const servicios: { [key: string]: boolean } = {};
    const errores: string[] = [];

    try {
      // Verificar Google Vision
      servicios.googleVision = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (!servicios.googleVision) {
        errores.push('Google Vision API no configurada');
      }

      // Verificar Google Maps
      servicios.googleMaps = !!process.env.GOOGLE_MAPS_API_KEY;
      if (!servicios.googleMaps) {
        errores.push('Google Maps API no configurada');
      }

      // Verificar SMTP
      servicios.smtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
      if (!servicios.smtp) {
        errores.push('Configuración SMTP incompleta');
      }

      // Verificar Twilio (opcional)
      servicios.twilio = !!(process.env.TWILIO_SID && process.env.TWILIO_TOKEN);
      if (!servicios.twilio) {
        errores.push('Twilio no configurado (SMS opcional)');
      }

      // Verificar SAIME (opcional)
      servicios.saime = !!(process.env.SAIME_API_URL && process.env.SAIME_API_KEY);
      if (!servicios.saime) {
        console.log('SAIME no configurado, usando simulación');
      }

    } catch (error) {
      errores.push(`Error verificando configuración: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    return { servicios, errores };
  }

  /**
   * Obtiene estadísticas generales del sistema
   */
  async obtenerEstadisticas(): Promise<{
    conductores: {
      pendientes: number;
      aprobados: number;
      rechazados: number;
    };
    clientes: {
      activos: number;
      inactivos: number;
    };
    verificaciones: {
      otpPendientes: number;
      emailsPendientes: number;
    };
  }> {
    // Esta función sería implementada con consultas a la base de datos
    return {
      conductores: {
        pendientes: 0,
        aprobados: 0,
        rechazados: 0
      },
      clientes: {
        activos: 0,
        inactivos: 0
      },
      verificaciones: {
        otpPendientes: 0,
        emailsPendientes: 0
      }
    };
  }
}

// Instancia singleton para uso global
export const verificaciones = new VerificacionesGenerales();

// Función de utilidad para verificación rápida
export function verificarRegistro(data: any, tipo: 'conductor' | 'cliente') {
  if (tipo === 'conductor') {
    return verificaciones.procesarRegistroConductor(data, []);
  } else {
    return verificaciones.procesarRegistroCliente(data, []);
  }
}