// Verificación completa con todos los requisitos, asignación automática de código y estado
import { ConductorRegistro, EstadoVerificacion, VALIDACIONES_REQUERIDAS, MENSAJE_REGISTRO_EXITOSO } from './tiposConductor';
import { asignarCodigo } from '../utils/asignarCodigo';
import { ocrCedula, ocrLicencia, ocrRIF } from './servicios/ocr';
import { verificarSelfie, compararRostros } from './servicios/facial';
import { verificarOTP, enviarOTP } from './servicios/otp';
import { verificarEmail, enviarTokenEmail } from './servicios/email';
import { verificarDireccion } from './servicios/direccion';
import { verificarSAIME } from './servicios/saime';

export class VerificacionesConductor {
  
  /**
   * Procesa el registro completo de un conductor con todas las validaciones
   */
  async procesarRegistroConductor(data: Partial<ConductorRegistro>, codigosExistentes: string[]): Promise<{
    exito: boolean;
    conductor?: ConductorRegistro;
    errores?: string[];
    mensaje?: { titulo: string; mensaje: string; instrucciones: string };
  }> {
    try {
      // 1. Asignar código único automáticamente
      const codigo = await asignarCodigo('conductor', codigosExistentes);
      
      // 2. Crear el registro inicial con status pendiente_inspeccion
      const conductor: ConductorRegistro = {
        ...data as ConductorRegistro,
        codigo,
        status: 'pendiente_inspeccion',
        fecha_registro: new Date()
      };

      // 3. Ejecutar todas las verificaciones automáticas
      const estadoVerificacion = await this.ejecutarVerificacionesCompletas(conductor);
      
      // 4. Determinar si todas las verificaciones pasaron
      const todasValidas = this.validarEstadoCompleto(estadoVerificacion);
      
      if (!todasValidas) {
        const errores = this.obtenerErroresValidacion(estadoVerificacion);
        return {
          exito: false,
          errores,
          conductor
        };
      }

      // 5. Si todas las validaciones pasaron, mostrar mensaje de éxito
      const mensaje = {
        titulo: MENSAJE_REGISTRO_EXITOSO.titulo,
        mensaje: MENSAJE_REGISTRO_EXITOSO.mensaje.replace('{codigo}', codigo),
        instrucciones: MENSAJE_REGISTRO_EXITOSO.instrucciones
      };

      return {
        exito: true,
        conductor,
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
   * Ejecuta todas las verificaciones automáticas requeridas
   */
  private async ejecutarVerificacionesCompletas(conductor: ConductorRegistro): Promise<EstadoVerificacion> {
    const estado: EstadoVerificacion = {
      otp_verificado: false,
      email_verificado: false,
      ocr_cedula_valido: false,
      ocr_licencia_valido: false,
      ocr_rif_valido: false,
      selfie_valido: false,
      coincidencia_rostro_valida: false,
      direccion_verificada: false,
      saime_verificado: false
    };

    try {
      // Verificación OTP
      if (conductor.otp_input) {
        estado.otp_verificado = await verificarOTP(conductor.telefono, conductor.otp_input);
      }

      // Verificación Email
      if (conductor.token_email) {
        estado.email_verificado = await verificarEmail(conductor.email, conductor.token_email);
      }

      // OCR de Cédula
      if (conductor.foto_cedula) {
        const resultadoOCR = await ocrCedula(conductor.foto_cedula);
        conductor.ocr_cedula_resultado = resultadoOCR;
        estado.ocr_cedula_valido = this.validarOCRCedula(resultadoOCR, conductor);
      }

      // OCR de Licencia
      if (conductor.licencia && conductor.foto_titulo) {
        const resultadoOCR = await ocrLicencia(conductor.foto_titulo);
        conductor.ocr_licencia_resultado = resultadoOCR;
        estado.ocr_licencia_valido = this.validarOCRLicencia(resultadoOCR, conductor);
      }

      // OCR de RIF
      if (conductor.foto_rif) {
        const resultadoOCR = await ocrRIF(conductor.foto_rif);
        conductor.ocr_rif_resultado = resultadoOCR;
        estado.ocr_rif_valido = this.validarOCRRIF(resultadoOCR, conductor);
      }

      // Verificación de Selfie
      if (conductor.selfie) {
        estado.selfie_valido = await verificarSelfie(conductor.selfie);
      }

      // Comparación de rostros (selfie vs foto cédula)
      if (conductor.selfie && conductor.foto_cedula) {
        const porcentajeCoincidencia = await compararRostros(conductor.selfie, conductor.foto_cedula);
        conductor.coincidencia_rostro = porcentajeCoincidencia;
        estado.coincidencia_rostro_valida = porcentajeCoincidencia >= 80; // 80% mínimo
      }

      // Verificación de dirección
      if (conductor.direccion) {
        const resultadoDireccion = await verificarDireccion(conductor.direccion, conductor.sector);
        estado.direccion_verificada = resultadoDireccion.valida;
        conductor.coordenadas_gps = resultadoDireccion.coordenadas;
      }

      // Verificación SAIME
      if (conductor.cedula) {
        estado.saime_verificado = await verificarSAIME(conductor.cedula, conductor.nombre, conductor.apellido);
        conductor.verificacion_saime = estado.saime_verificado;
      }

    } catch (error) {
      console.error('Error durante las verificaciones:', error);
    }

    return estado;
  }

  /**
   * Valida que todas las verificaciones requeridas hayan pasado
   */
  private validarEstadoCompleto(estado: EstadoVerificacion): boolean {
    return VALIDACIONES_REQUERIDAS.every(validacion => estado[validacion]);
  }

  /**
   * Obtiene una lista de errores basada en las validaciones fallidas
   */
  private obtenerErroresValidacion(estado: EstadoVerificacion): string[] {
    const errores: string[] = [];
    
    if (!estado.otp_verificado) errores.push('Código OTP inválido');
    if (!estado.email_verificado) errores.push('Email no verificado');
    if (!estado.ocr_cedula_valido) errores.push('Cédula no pudo ser verificada');
    if (!estado.ocr_licencia_valido) errores.push('Licencia no pudo ser verificada');
    if (!estado.ocr_rif_valido) errores.push('RIF no pudo ser verificado');
    if (!estado.selfie_valido) errores.push('Selfie no es válido');
    if (!estado.coincidencia_rostro_valida) errores.push('Rostro no coincide con la cédula');
    if (!estado.direccion_verificada) errores.push('Dirección no pudo ser verificada');
    if (!estado.saime_verificado) errores.push('No se pudo verificar con SAIME');

    return errores;
  }

  /**
   * Valida el resultado del OCR de cédula
   */
  private validarOCRCedula(resultado: any, conductor: ConductorRegistro): boolean {
    if (!resultado) return false;
    
    // Verificar que el número de cédula coincida
    const cedulaExtraida = resultado.cedula?.replace(/\D/g, '');
    const cedulaIngresada = conductor.cedula?.replace(/\D/g, '');
    
    return cedulaExtraida === cedulaIngresada;
  }

  /**
   * Valida el resultado del OCR de licencia
   */
  private validarOCRLicencia(resultado: any, conductor: ConductorRegistro): boolean {
    if (!resultado) return false;
    
    // Verificar que el número de licencia coincida
    const licenciaExtraida = resultado.numero_licencia?.replace(/\D/g, '');
    const licenciaIngresada = conductor.licencia?.replace(/\D/g, '');
    
    return licenciaExtraida === licenciaIngresada;
  }

  /**
   * Valida el resultado del OCR de RIF
   */
  private validarOCRRIF(resultado: any, conductor: ConductorRegistro): boolean {
    if (!resultado) return false;
    
    // Verificar que el RIF coincida
    const rifExtraido = resultado.rif?.replace(/\D/g, '');
    const rifIngresado = conductor.rif?.replace(/\D/g, '');
    
    return rifExtraido === rifIngresado;
  }

  /**
   * Actualiza el estado de un conductor después de la inspección física
   */
  async actualizarEstadoInspeccion(
    codigo: string, 
    aprobado: boolean, 
    inspectorId: string, 
    razonRechazo?: string
  ): Promise<void> {
    // Este método sería implementado para actualizar el estado en la base de datos
    // después de la inspección física
    const nuevoEstado = aprobado ? 'aprobado' : 'rechazado';
    const fechaInspeccion = new Date();
    
    // Aquí iría la lógica para actualizar en la base de datos
    console.log(`Conductor ${codigo} ${nuevoEstado} por inspector ${inspectorId}`);
    if (razonRechazo) {
      console.log(`Razón de rechazo: ${razonRechazo}`);
    }
  }

  /**
   * Envía OTP al teléfono del conductor
   */
  async enviarOTPConductor(telefono: string): Promise<boolean> {
    try {
      return await enviarOTP(telefono);
    } catch (error) {
      console.error('Error enviando OTP:', error);
      return false;
    }
  }

  /**
   * Envía token de verificación al email del conductor
   */
  async enviarTokenEmailConductor(email: string): Promise<boolean> {
    try {
      return await enviarTokenEmail(email);
    } catch (error) {
      console.error('Error enviando token email:', error);
      return false;
    }
  }
}