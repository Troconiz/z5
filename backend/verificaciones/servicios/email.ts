// Servicios de verificación de email
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Simulador de almacenamiento de tokens (en producción usar Redis o base de datos)
const tokenStorage = new Map<string, { token: string; expiry: Date; verified: boolean }>();

// Configuración del transportador de email
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

/**
 * Envía un token de verificación al email especificado
 */
export async function enviarTokenEmail(email: string): Promise<boolean> {
  try {
    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');
    
    // Configurar expiración (24 horas)
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    
    // Almacenar token
    tokenStorage.set(email, {
      token,
      expiry,
      verified: false
    });
    
    // Crear enlace de verificación
    const enlaceVerificacion = `${process.env.BASE_URL}/verificar-email?token=${token}&email=${encodeURIComponent(email)}`;
    
    // Enviar email
    const resultado = await enviarEmailVerificacion(email, enlaceVerificacion, token);
    
    if (resultado) {
      console.log(`Token de verificación enviado a ${email}`);
    }
    
    return resultado;
    
  } catch (error) {
    console.error('Error enviando token de email:', error);
    return false;
  }
}

/**
 * Verifica un token de email
 */
export async function verificarEmail(email: string, token: string): Promise<boolean> {
  try {
    const datos = tokenStorage.get(email);
    
    if (!datos) {
      console.log(`Token no encontrado para email ${email}`);
      return false;
    }
    
    // Verificar si ha expirado
    if (new Date() > datos.expiry) {
      tokenStorage.delete(email);
      console.log(`Token expirado para email ${email}`);
      return false;
    }
    
    // Verificar token
    if (datos.token === token) {
      datos.verified = true;
      console.log(`Email verificado exitosamente: ${email}`);
      return true;
    }
    
    console.log(`Token incorrecto para email ${email}`);
    return false;
    
  } catch (error) {
    console.error('Error verificando email:', error);
    return false;
  }
}

/**
 * Reenvía el token de verificación
 */
export async function reenviarTokenEmail(email: string): Promise<{ exito: boolean; mensaje: string }> {
  try {
    const datos = tokenStorage.get(email);
    
    // Si ya está verificado, no reenviar
    if (datos && datos.verified) {
      return {
        exito: false,
        mensaje: 'El email ya está verificado'
      };
    }
    
    // Verificar que no se abuse del reenvío
    if (datos && new Date() < datos.expiry) {
      const tiempoRestante = Math.ceil((datos.expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60));
      if (tiempoRestante > 23) { // Solo permitir reenvío si quedan menos de 23 horas
        return {
          exito: false,
          mensaje: `Espera antes de solicitar otro token de verificación`
        };
      }
    }
    
    const exito = await enviarTokenEmail(email);
    
    return {
      exito,
      mensaje: exito ? 'Token de verificación reenviado' : 'Error reenviando token'
    };
    
  } catch (error) {
    console.error('Error reenviando token de email:', error);
    return {
      exito: false,
      mensaje: 'Error interno del servidor'
    };
  }
}

/**
 * Envía el email de verificación
 */
async function enviarEmailVerificacion(email: string, enlace: string, token: string): Promise<boolean> {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verificación de Email - Taxiplus Maracaibo</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { 
            display: inline-block; 
            background-color: #007bff; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 4px; 
            margin: 20px 0;
          }
          .code { 
            background-color: #f8f9fa; 
            padding: 10px; 
            border-radius: 4px; 
            font-family: monospace; 
            font-size: 18px; 
            text-align: center; 
            border: 2px dashed #dee2e6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Taxiplus Maracaibo</h1>
            <h2>Verificación de Email</h2>
          </div>
          <div class="content">
            <p>¡Hola!</p>
            <p>Gracias por registrarte en Taxiplus Maracaibo. Para completar tu registro, necesitamos verificar tu dirección de email.</p>
            
            <p><strong>Opción 1: Hacer clic en el enlace</strong></p>
            <p><a href="${enlace}" class="button">Verificar Email</a></p>
            
            <p><strong>Opción 2: Ingresar el código manualmente</strong></p>
            <div class="code">${token.substring(0, 8).toUpperCase()}</div>
            
            <p><small>Si no puedes hacer clic en el enlace, copia y pega esta URL en tu navegador:</small></p>
            <p><small>${enlace}</small></p>
            
            <p><strong>Este enlace expirará en 24 horas.</strong></p>
            
            <p>Si no solicitaste este registro, puedes ignorar este email.</p>
            
            <hr>
            <p><small>Taxiplus Maracaibo - Tu servicio de taxi confiable</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `
      Taxiplus Maracaibo - Verificación de Email
      
      ¡Hola!
      
      Gracias por registrarte en Taxiplus Maracaibo. Para completar tu registro, verifica tu email usando una de estas opciones:
      
      1. Enlace de verificación: ${enlace}
      2. Código manual: ${token.substring(0, 8).toUpperCase()}
      
      Este enlace expirará en 24 horas.
      
      Si no solicitaste este registro, puedes ignorar este email.
      
      Taxiplus Maracaibo - Tu servicio de taxi confiable
    `;
    
    const mailOptions = {
      from: `"Taxiplus Maracaibo" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verifica tu email - Taxiplus Maracaibo',
      text: textContent,
      html: htmlContent
    };
    
    await transporter.sendMail(mailOptions);
    return true;
    
  } catch (error) {
    console.error('Error enviando email de verificación:', error);
    return false;
  }
}

/**
 * Verifica si un email ya está verificado
 */
export function emailYaVerificado(email: string): boolean {
  const datos = tokenStorage.get(email);
  return datos ? datos.verified : false;
}

/**
 * Marca un email como verificado
 */
export function marcarEmailVerificado(email: string): boolean {
  const datos = tokenStorage.get(email);
  if (datos) {
    datos.verified = true;
    return true;
  }
  return false;
}

/**
 * Limpia tokens expirados
 */
export function limpiarTokensExpirados(): number {
  const ahora = new Date();
  let limpiados = 0;
  
  for (const [email, datos] of tokenStorage.entries()) {
    if (ahora > datos.expiry) {
      tokenStorage.delete(email);
      limpiados++;
    }
  }
  
  console.log(`Tokens de email expirados limpiados: ${limpiados}`);
  return limpiados;
}

/**
 * Obtiene estadísticas de verificaciones de email
 */
export function obtenerEstadisticasEmail(): {
  total: number;
  verificados: number;
  pendientes: number;
  expirados: number;
} {
  const ahora = new Date();
  let verificados = 0;
  let pendientes = 0;
  let expirados = 0;
  
  for (const datos of tokenStorage.values()) {
    if (datos.verified) {
      verificados++;
    } else if (ahora <= datos.expiry) {
      pendientes++;
    } else {
      expirados++;
    }
  }
  
  return {
    total: tokenStorage.size,
    verificados,
    pendientes,
    expirados
  };
}

/**
 * Valida formato de email
 */
export function validarFormatoEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Verifica configuración de email
 */
export function verificarConfiguracionEmail(): { valido: boolean; errores: string[] } {
  const errores: string[] = [];
  
  if (!process.env.SMTP_HOST) {
    errores.push('SMTP_HOST no configurado');
  }
  
  if (!process.env.SMTP_USER) {
    errores.push('SMTP_USER no configurado');
  }
  
  if (!process.env.SMTP_PASSWORD) {
    errores.push('SMTP_PASSWORD no configurado');
  }
  
  if (!process.env.BASE_URL) {
    errores.push('BASE_URL no configurado');
  }
  
  return {
    valido: errores.length === 0,
    errores
  };
}