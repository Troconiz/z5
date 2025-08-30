// OCR con Google Vision API para cédula y documentos
import vision from '@google-cloud/vision';
const client = new vision.ImageAnnotatorClient();

export async function ocrCedula(buffer: Buffer) {
  try {
    const [result] = await client.textDetection({ image: { content: buffer } });
    const detections = result?.textAnnotations;
    if (!detections || detections.length === 0) return null;
    
    const text = detections[0].description;
    
    // Extrae campos básicos de la cédula venezolana
    const cedula = text.match(/\b[VE]?-?\s*(\d{6,9})\b/i)?.[1];
    const nombre = text.match(/(?:NOMBRE|NAMES?):?\s*([A-ZÁÉÍÓÚÑ ]+)/i)?.[1]?.trim();
    const apellido = text.match(/(?:APELLIDO|SURNAME):?\s*([A-ZÁÉÍÓÚÑ ]+)/i)?.[1]?.trim();
    const fechaNacimiento = text.match(/(\d{2}\/\d{2}\/\d{4})/)?.[1];
    const sexo = text.match(/(?:SEXO|SEX):?\s*([MF])/i)?.[1];
    
    return { 
      cedula, 
      nombre, 
      apellido, 
      fecha_nacimiento: fechaNacimiento,
      sexo,
      text_original: text,
      confianza: detections[0].score || 0.8
    };
  } catch (error) {
    console.error('Error en OCR de cédula:', error);
    return null;
  }
}

export async function ocrLicencia(buffer: Buffer) {
  try {
    const [result] = await client.textDetection({ image: { content: buffer } });
    const detections = result?.textAnnotations;
    if (!detections || detections.length === 0) return null;
    
    const text = detections[0].description;
    
    // Extrae campos de licencia de conducir
    const numeroLicencia = text.match(/(?:LICENCIA|LICENSE):?\s*([A-Z0-9]+)/i)?.[1];
    const categoria = text.match(/(?:CATEGORÍA|CATEGORY):?\s*([A-Z0-9]+)/i)?.[1];
    const vencimiento = text.match(/(?:VENCIMIENTO|EXPIRY):?\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1];
    const emision = text.match(/(?:EMISIÓN|ISSUE):?\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1];
    
    return {
      numero_licencia: numeroLicencia,
      categoria,
      fecha_vencimiento: vencimiento,
      fecha_emision: emision,
      text_original: text,
      confianza: detections[0].score || 0.8
    };
  } catch (error) {
    console.error('Error en OCR de licencia:', error);
    return null;
  }
}

export async function ocrRIF(buffer: Buffer) {
  try {
    const [result] = await client.textDetection({ image: { content: buffer } });
    const detections = result?.textAnnotations;
    if (!detections || detections.length === 0) return null;
    
    const text = detections[0].description;
    
    // Extrae campos del RIF
    const rif = text.match(/\b[JGVEP]-?\s*(\d{8,9})-?\s*(\d)\b/i);
    const rifCompleto = rif ? `${rif[0]}` : null;
    const razonSocial = text.match(/(?:RAZÓN SOCIAL|NOMBRE):?\s*([A-ZÁÉÍÓÚÑ .,]+)/i)?.[1]?.trim();
    const direccion = text.match(/(?:DIRECCIÓN|DOMICILIO):?\s*([A-ZÁÉÍÓÚÑ0-9 .,#-]+)/i)?.[1]?.trim();
    
    return {
      rif: rifCompleto,
      razon_social: razonSocial,
      direccion_rif: direccion,
      text_original: text,
      confianza: detections[0].score || 0.8
    };
  } catch (error) {
    console.error('Error en OCR de RIF:', error);
    return null;
  }
}

// Función para mejorar la calidad de imagen antes del OCR
export async function preprocesarImagen(buffer: Buffer): Promise<Buffer> {
  // Aquí se podría implementar preprocesamiento de imagen
  // usando librerías como sharp para mejorar contraste, brillo, etc.
  return buffer;
}

// Validación de confianza del OCR
export function validarConfianzaOCR(resultado: any, umbralMinimo: number = 0.7): boolean {
  return resultado?.confianza && resultado.confianza >= umbralMinimo;
}
