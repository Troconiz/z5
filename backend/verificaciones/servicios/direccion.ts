// Servicios de verificación de dirección
import axios from 'axios';

interface ResultadoVerificacionDireccion {
  valida: boolean;
  coordenadas?: string;
  direccionCompleta?: string;
  sector?: string;
  ciudad?: string;
  estado?: string;
  codigoPostal?: string;
  confianza?: number;
  mensaje?: string;
}

/**
 * Verifica una dirección usando servicios de geocodificación
 */
export async function verificarDireccion(
  direccion: string, 
  sector?: string, 
  ciudad: string = 'Maracaibo',
  estado: string = 'Zulia'
): Promise<ResultadoVerificacionDireccion> {
  try {
    // Construir dirección completa
    const direccionCompleta = construirDireccionCompleta(direccion, sector, ciudad, estado);
    
    // Intentar geocodificación con multiple proveedores
    let resultado = await verificarConGoogleMaps(direccionCompleta);
    
    if (!resultado.valida) {
      resultado = await verificarConOpenStreetMap(direccionCompleta);
    }
    
    if (!resultado.valida) {
      resultado = await verificarConNominatim(direccionCompleta);
    }
    
    // Validar que esté en Maracaibo/Zulia
    if (resultado.valida && resultado.coordenadas) {
      const enMaracaibo = await validarUbicacionMaracaibo(resultado.coordenadas);
      if (!enMaracaibo) {
        resultado.valida = false;
        resultado.mensaje = 'La dirección no está ubicada en Maracaibo';
      }
    }
    
    return resultado;
    
  } catch (error) {
    console.error('Error verificando dirección:', error);
    return {
      valida: false,
      mensaje: 'Error interno al verificar la dirección'
    };
  }
}

/**
 * Construye una dirección completa para geocodificación
 */
function construirDireccionCompleta(
  direccion: string, 
  sector?: string, 
  ciudad: string = 'Maracaibo', 
  estado: string = 'Zulia'
): string {
  const partes = [direccion];
  
  if (sector) {
    partes.push(sector);
  }
  
  partes.push(ciudad, estado, 'Venezuela');
  
  return partes.join(', ');
}

/**
 * Verifica dirección usando Google Maps Geocoding API
 */
async function verificarConGoogleMaps(direccion: string): Promise<ResultadoVerificacionDireccion> {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return { valida: false, mensaje: 'Google Maps API no configurada' };
    }
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: direccion,
        key: process.env.GOOGLE_MAPS_API_KEY,
        region: 've' // Venezuela
      },
      timeout: 10000
    });
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const resultado = response.data.results[0];
      const location = resultado.geometry.location;
      
      return {
        valida: true,
        coordenadas: `${location.lat},${location.lng}`,
        direccionCompleta: resultado.formatted_address,
        confianza: calcularConfianzaGoogleMaps(resultado)
      };
    }
    
    return { valida: false, mensaje: 'Dirección no encontrada en Google Maps' };
    
  } catch (error) {
    console.error('Error con Google Maps:', error);
    return { valida: false, mensaje: 'Error consultando Google Maps' };
  }
}

/**
 * Verifica dirección usando OpenStreetMap Nominatim
 */
async function verificarConNominatim(direccion: string): Promise<ResultadoVerificacionDireccion> {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: direccion,
        format: 'json',
        limit: 1,
        countrycodes: 've' // Venezuela
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'TaxiplusMaracaibo/1.0'
      }
    });
    
    if (response.data && response.data.length > 0) {
      const resultado = response.data[0];
      
      return {
        valida: true,
        coordenadas: `${resultado.lat},${resultado.lon}`,
        direccionCompleta: resultado.display_name,
        confianza: parseFloat(resultado.importance || '0.5') * 100
      };
    }
    
    return { valida: false, mensaje: 'Dirección no encontrada en OpenStreetMap' };
    
  } catch (error) {
    console.error('Error con Nominatim:', error);
    return { valida: false, mensaje: 'Error consultando OpenStreetMap' };
  }
}

/**
 * Verifica dirección usando un servicio alternativo
 */
async function verificarConOpenStreetMap(direccion: string): Promise<ResultadoVerificacionDireccion> {
  // Implementación similar a Nominatim pero con otro endpoint
  return await verificarConNominatim(direccion);
}

/**
 * Calcula la confianza basada en la respuesta de Google Maps
 */
function calcularConfianzaGoogleMaps(resultado: any): number {
  let confianza = 50; // Base
  
  // Aumentar confianza basada en tipos de ubicación
  const tipos = resultado.types || [];
  
  if (tipos.includes('street_address')) confianza += 40;
  else if (tipos.includes('route')) confianza += 30;
  else if (tipos.includes('neighborhood')) confianza += 20;
  else if (tipos.includes('sublocality')) confianza += 15;
  
  // Verificar componentes de dirección
  const componentes = resultado.address_components || [];
  const tiposComponentes = componentes.map((c: any) => c.types).flat();
  
  if (tiposComponentes.includes('street_number')) confianza += 10;
  if (tiposComponentes.includes('administrative_area_level_1')) confianza += 5;
  
  return Math.min(100, confianza);
}

/**
 * Valida que las coordenadas estén dentro del área de Maracaibo
 */
async function validarUbicacionMaracaibo(coordenadas: string): Promise<boolean> {
  try {
    const [lat, lng] = coordenadas.split(',').map(parseFloat);
    
    // Límites aproximados de Maracaibo y área metropolitana
    const limitesMaracaibo = {
      norte: 10.8,
      sur: 10.4,
      este: -71.4,
      oeste: -71.8
    };
    
    return (
      lat >= limitesMaracaibo.sur &&
      lat <= limitesMaracaibo.norte &&
      lng >= limitesMaracaibo.oeste &&
      lng <= limitesMaracaibo.este
    );
    
  } catch (error) {
    console.error('Error validando ubicación en Maracaibo:', error);
    return false;
  }
}

/**
 * Obtiene información detallada de una dirección
 */
export async function obtenerInformacionDireccion(coordenadas: string): Promise<{
  sector?: string;
  barrio?: string;
  parroquia?: string;
  municipio?: string;
  referencias?: string[];
}> {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return {};
    }
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: coordenadas,
        key: process.env.GOOGLE_MAPS_API_KEY,
        language: 'es'
      },
      timeout: 10000
    });
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const resultado = response.data.results[0];
      const componentes = resultado.address_components || [];
      
      return extraerInformacionLocalizada(componentes);
    }
    
    return {};
    
  } catch (error) {
    console.error('Error obteniendo información de dirección:', error);
    return {};
  }
}

/**
 * Extrae información localizada de los componentes de dirección
 */
function extraerInformacionLocalizada(componentes: any[]): {
  sector?: string;
  barrio?: string;
  parroquia?: string;
  municipio?: string;
  referencias?: string[];
} {
  const info: any = {};
  const referencias: string[] = [];
  
  for (const componente of componentes) {
    const tipos = componente.types;
    const nombre = componente.long_name;
    
    if (tipos.includes('sublocality_level_1') || tipos.includes('neighborhood')) {
      info.sector = nombre;
      referencias.push(`Sector ${nombre}`);
    }
    
    if (tipos.includes('sublocality_level_2')) {
      info.barrio = nombre;
      referencias.push(`Barrio ${nombre}`);
    }
    
    if (tipos.includes('administrative_area_level_3')) {
      info.parroquia = nombre;
      referencias.push(`Parroquia ${nombre}`);
    }
    
    if (tipos.includes('administrative_area_level_2')) {
      info.municipio = nombre;
    }
    
    if (tipos.includes('establishment') || tipos.includes('point_of_interest')) {
      referencias.push(`Cerca de ${nombre}`);
    }
  }
  
  info.referencias = referencias;
  return info;
}

/**
 * Normaliza una dirección para comparación
 */
export function normalizarDireccion(direccion: string): string {
  return direccion
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\b(calle|avenida|av|c|carrera|cr|transversal|tv|diagonal|dg)\b/g, '')
    .trim();
}

/**
 * Calcula la distancia entre dos coordenadas
 */
export function calcularDistancia(coord1: string, coord2: string): number {
  const [lat1, lng1] = coord1.split(',').map(parseFloat);
  const [lat2, lng2] = coord2.split(',').map(parseFloat);
  
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distancia = R * c;
  
  return Math.round(distancia * 1000); // Retorna en metros
}