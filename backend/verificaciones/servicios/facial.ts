// Servicios de verificación facial y selfie
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient();

/**
 * Verifica que una imagen sea un selfie válido
 */
export async function verificarSelfie(buffer: Buffer): Promise<boolean> {
  try {
    // Detección de rostros
    const [result] = await client.faceDetection({ image: { content: buffer } });
    const faces = result.faceAnnotations;
    
    if (!faces || faces.length === 0) {
      return false; // No se detectó ningún rostro
    }
    
    if (faces.length > 1) {
      return false; // Más de un rostro detectado
    }
    
    const face = faces[0];
    
    // Verificar que el rostro esté bien centrado y visible
    const boundingPoly = face.boundingPoly;
    if (!boundingPoly || !boundingPoly.vertices) {
      return false;
    }
    
    // Verificar características de calidad del selfie
    const confianza = face.detectionConfidence || 0;
    const anguloRotacion = Math.abs(face.rollAngle || 0);
    const anguloPan = Math.abs(face.panAngle || 0);
    const anguloTilt = Math.abs(face.tiltAngle || 0);
    
    // Criterios de validación
    const confianzaMinima = 0.8;
    const anguloMaximo = 15; // grados
    
    return (
      confianza >= confianzaMinima &&
      anguloRotacion <= anguloMaximo &&
      anguloPan <= anguloMaximo &&
      anguloTilt <= anguloMaximo
    );
    
  } catch (error) {
    console.error('Error verificando selfie:', error);
    return false;
  }
}

/**
 * Compara dos rostros y retorna el porcentaje de similitud
 */
export async function compararRostros(selfie: Buffer, fotoCedula: Buffer): Promise<number> {
  try {
    // Extraer características faciales de ambas imágenes
    const [resultSelfie] = await client.faceDetection({ image: { content: selfie } });
    const [resultCedula] = await client.faceDetection({ image: { content: fotoCedula } });
    
    const facesSelfie = resultSelfie.faceAnnotations;
    const facesCedula = resultCedula.faceAnnotations;
    
    if (!facesSelfie || !facesCedula || facesSelfie.length === 0 || facesCedula.length === 0) {
      return 0; // No se pudieron detectar rostros en una o ambas imágenes
    }
    
    const faceSelfie = facesSelfie[0];
    const faceCedula = facesCedula[0];
    
    // Comparar landmarks faciales si están disponibles
    if (faceSelfie.landmarks && faceCedula.landmarks) {
      return compararLandmarks(faceSelfie.landmarks, faceCedula.landmarks);
    }
    
    // Fallback: usar características básicas
    return compararCaracteristicasBasicas(faceSelfie, faceCedula);
    
  } catch (error) {
    console.error('Error comparando rostros:', error);
    return 0;
  }
}

/**
 * Compara landmarks faciales entre dos rostros
 */
function compararLandmarks(landmarks1: any[], landmarks2: any[]): number {
  if (landmarks1.length !== landmarks2.length) {
    return 0;
  }
  
  let distanciaTotal = 0;
  let puntosComparados = 0;
  
  // Puntos clave para comparación
  const puntosImportantes = [
    'LEFT_EYE', 'RIGHT_EYE', 'NOSE_TIP', 'LEFT_EAR_TRAGION', 'RIGHT_EAR_TRAGION'
  ];
  
  for (const punto of puntosImportantes) {
    const landmark1 = landmarks1.find(l => l.type === punto);
    const landmark2 = landmarks2.find(l => l.type === punto);
    
    if (landmark1 && landmark2) {
      const distancia = calcularDistanciaEuclidiana(
        landmark1.position,
        landmark2.position
      );
      distanciaTotal += distancia;
      puntosComparados++;
    }
  }
  
  if (puntosComparados === 0) {
    return 0;
  }
  
  const distanciaPromedio = distanciaTotal / puntosComparados;
  
  // Convertir distancia a porcentaje de similitud (0-100%)
  // Ajustar estos valores según calibración con datos reales
  const distanciaMaxima = 50;
  const similitud = Math.max(0, 100 - (distanciaPromedio / distanciaMaxima * 100));
  
  return Math.round(similitud);
}

/**
 * Compara características básicas entre dos rostros
 */
function compararCaracteristicasBasicas(face1: any, face2: any): number {
  let similitud = 0;
  let factores = 0;
  
  // Comparar ángulos
  if (face1.rollAngle !== undefined && face2.rollAngle !== undefined) {
    const diferenciaRoll = Math.abs(face1.rollAngle - face2.rollAngle);
    similitud += Math.max(0, 100 - diferenciaRoll * 2);
    factores++;
  }
  
  if (face1.panAngle !== undefined && face2.panAngle !== undefined) {
    const diferenciaPan = Math.abs(face1.panAngle - face2.panAngle);
    similitud += Math.max(0, 100 - diferenciaPan * 2);
    factores++;
  }
  
  // Comparar dimensiones del rostro
  if (face1.boundingPoly && face2.boundingPoly) {
    const area1 = calcularAreaRostro(face1.boundingPoly);
    const area2 = calcularAreaRostro(face2.boundingPoly);
    
    if (area1 > 0 && area2 > 0) {
      const ratioArea = Math.min(area1, area2) / Math.max(area1, area2);
      similitud += ratioArea * 100;
      factores++;
    }
  }
  
  return factores > 0 ? Math.round(similitud / factores) : 0;
}

/**
 * Calcula la distancia euclidiana entre dos puntos
 */
function calcularDistanciaEuclidiana(punto1: any, punto2: any): number {
  const dx = punto1.x - punto2.x;
  const dy = punto1.y - punto2.y;
  const dz = (punto1.z || 0) - (punto2.z || 0);
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calcula el área de un rostro basado en su bounding box
 */
function calcularAreaRostro(boundingPoly: any): number {
  if (!boundingPoly.vertices || boundingPoly.vertices.length < 4) {
    return 0;
  }
  
  const vertices = boundingPoly.vertices;
  const ancho = Math.abs(vertices[2].x - vertices[0].x);
  const alto = Math.abs(vertices[2].y - vertices[0].y);
  
  return ancho * alto;
}

/**
 * Detecta si hay múltiples personas en una imagen
 */
export async function detectarMultiplesPersonas(buffer: Buffer): Promise<number> {
  try {
    const [result] = await client.faceDetection({ image: { content: buffer } });
    const faces = result.faceAnnotations;
    
    return faces ? faces.length : 0;
    
  } catch (error) {
    console.error('Error detectando múltiples personas:', error);
    return 0;
  }
}