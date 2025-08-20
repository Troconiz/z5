// OCR con Google Vision API para cédula y documentos
import vision from '@google-cloud/vision';
const client = new vision.ImageAnnotatorClient();

export async function ocrCedula(buffer: Buffer) {
  const [result] = await client.textDetection({ image: { content: buffer } });
  const detections = result?.textAnnotations;
  if (!detections || detections.length === 0) return null;
  const text = detections[0].description;
  // Extrae campos básicos de la cédula (personalizar según formato real)
  const cedula = text.match(/\d{6,9}/)?.[0];
  const nombre = text.match(/NOMBRE:?\s*([A-ZÁÉÍÓÚÑ ]+)/i)?.[1]?.trim();
  const apellido = text.match(/APELLIDO:?\s*([A-ZÁÉÍÓÚÑ ]+)/i)?.[1]?.trim();
  return { cedula, nombre, apellido, text_original: text };
}
