// Servicios de verificación OTP
import crypto from 'crypto';

// Simulador de almacenamiento de OTPs (en producción usar Redis o base de datos)
const otpStorage = new Map<string, { otp: string; expiry: Date; attempts: number }>();

/**
 * Genera y envía un código OTP al teléfono especificado
 */
export async function enviarOTP(telefono: string): Promise<boolean> {
  try {
    // Generar código OTP de 6 dígitos
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Configurar expiración (5 minutos)
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);
    
    // Almacenar OTP
    otpStorage.set(telefono, {
      otp,
      expiry,
      attempts: 0
    });
    
    // Simular envío por SMS (aquí integrar con servicio real como Twilio)
    console.log(`SMS enviado a ${telefono}: Tu código Taxiplus es ${otp}`);
    
    // En producción, aquí iría la integración con el proveedor de SMS
    const resultado = await enviarSMS(telefono, `Tu código Taxiplus es ${otp}. Válido por 5 minutos.`);
    
    return resultado;
    
  } catch (error) {
    console.error('Error enviando OTP:', error);
    return false;
  }
}

/**
 * Verifica un código OTP ingresado por el usuario
 */
export async function verificarOTP(telefono: string, otpIngresado: string): Promise<boolean> {
  try {
    const datos = otpStorage.get(telefono);
    
    if (!datos) {
      console.log(`OTP no encontrado para teléfono ${telefono}`);
      return false;
    }
    
    // Verificar si ha expirado
    if (new Date() > datos.expiry) {
      otpStorage.delete(telefono);
      console.log(`OTP expirado para teléfono ${telefono}`);
      return false;
    }
    
    // Incrementar intentos
    datos.attempts++;
    
    // Verificar límite de intentos (máximo 3)
    if (datos.attempts > 3) {
      otpStorage.delete(telefono);
      console.log(`Demasiados intentos fallidos para teléfono ${telefono}`);
      return false;
    }
    
    // Verificar código
    if (datos.otp === otpIngresado.trim()) {
      otpStorage.delete(telefono); // Limpiar después de verificación exitosa
      console.log(`OTP verificado exitosamente para teléfono ${telefono}`);
      return true;
    }
    
    console.log(`OTP incorrecto para teléfono ${telefono}. Intento ${datos.attempts}/3`);
    return false;
    
  } catch (error) {
    console.error('Error verificando OTP:', error);
    return false;
  }
}

/**
 * Reenvía un código OTP (con límites)
 */
export async function reenviarOTP(telefono: string): Promise<{ exito: boolean; mensaje: string }> {
  try {
    const datos = otpStorage.get(telefono);
    
    // Verificar que no se abuse del reenvío
    if (datos && new Date() < datos.expiry) {
      const tiempoRestante = Math.ceil((datos.expiry.getTime() - new Date().getTime()) / 1000);
      if (tiempoRestante > 240) { // Solo permitir reenvío si quedan menos de 4 minutos
        return {
          exito: false,
          mensaje: `Espera ${Math.ceil(tiempoRestante / 60)} minutos antes de solicitar otro código`
        };
      }
    }
    
    const exito = await enviarOTP(telefono);
    
    return {
      exito,
      mensaje: exito ? 'Código reenviado exitosamente' : 'Error reenviando código'
    };
    
  } catch (error) {
    console.error('Error reenviando OTP:', error);
    return {
      exito: false,
      mensaje: 'Error interno del servidor'
    };
  }
}

/**
 * Simula el envío de SMS (integrar con proveedor real)
 */
async function enviarSMS(telefono: string, mensaje: string): Promise<boolean> {
  // Aquí iría la integración con un proveedor de SMS como Twilio, AWS SNS, etc.
  
  // Ejemplo de integración con Twilio:
  /*
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  
  try {
    await client.messages.create({
      body: mensaje,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: telefono
    });
    return true;
  } catch (error) {
    console.error('Error enviando SMS:', error);
    return false;
  }
  */
  
  // Por ahora simular éxito
  console.log(`SMS simulado enviado a ${telefono}: ${mensaje}`);
  return true;
}

/**
 * Limpia OTPs expirados (ejecutar periódicamente)
 */
export function limpiarOTPsExpirados(): number {
  const ahora = new Date();
  let limpiados = 0;
  
  for (const [telefono, datos] of otpStorage.entries()) {
    if (ahora > datos.expiry) {
      otpStorage.delete(telefono);
      limpiados++;
    }
  }
  
  console.log(`OTPs expirados limpiados: ${limpiados}`);
  return limpiados;
}

/**
 * Obtiene estadísticas de OTPs
 */
export function obtenerEstadisticasOTP(): {
  total: number;
  pendientes: number;
  expirados: number;
} {
  const ahora = new Date();
  let pendientes = 0;
  let expirados = 0;
  
  for (const datos of otpStorage.values()) {
    if (ahora <= datos.expiry) {
      pendientes++;
    } else {
      expirados++;
    }
  }
  
  return {
    total: otpStorage.size,
    pendientes,
    expirados
  };
}

/**
 * Valida formato de teléfono venezolano
 */
export function validarTelefonoVenezolano(telefono: string): boolean {
  // Formatos válidos: +58XXXXXXXXX, 0XXXXXXXXX, XXXXXXXXX
  const regex = /^(\+58|0)?[4][0-9]{9}$/;
  const telefonoLimpio = telefono.replace(/\D/g, '');
  
  if (telefonoLimpio.startsWith('58')) {
    return telefonoLimpio.length === 12 && telefonoLimpio[2] === '4';
  }
  
  if (telefonoLimpio.startsWith('0')) {
    return telefonoLimpio.length === 11 && telefonoLimpio[1] === '4';
  }
  
  return telefonoLimpio.length === 10 && telefonoLimpio[0] === '4';
}