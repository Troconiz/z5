// Servicios de verificación con SAIME (Sistema Automatizado de Identificación)
import axios from 'axios';
import crypto from 'crypto';

interface ResultadoSAIME {
  valido: boolean;
  nombre?: string;
  apellido?: string;
  fechaNacimiento?: string;
  estadoCivil?: string;
  nacionalidad?: string;
  mensaje?: string;
  codigoError?: string;
}

/**
 * Verifica datos de cédula con el SAIME
 */
export async function verificarSAIME(
  cedula: string, 
  nombre: string, 
  apellido: string
): Promise<boolean> {
  try {
    // Limpiar y formatear cédula
    const cedulaLimpia = limpiarCedula(cedula);
    
    if (!validarFormatoCedula(cedulaLimpia)) {
      console.log(`Formato de cédula inválido: ${cedula}`);
      return false;
    }
    
    // Intentar verificación con SAIME
    const resultado = await consultarSAIME(cedulaLimpia);
    
    if (!resultado.valido) {
      console.log(`SAIME: Cédula no encontrada o inválida: ${cedulaLimpia}`);
      return false;
    }
    
    // Comparar datos
    const coincideNombre = compararNombres(nombre, resultado.nombre || '');
    const coincideApellido = compararNombres(apellido, resultado.apellido || '');
    
    const valido = coincideNombre && coincideApellido;
    
    if (valido) {
      console.log(`SAIME: Verificación exitosa para cédula ${cedulaLimpia}`);
    } else {
      console.log(`SAIME: Datos no coinciden para cédula ${cedulaLimpia}`);
    }
    
    return valido;
    
  } catch (error) {
    console.error('Error verificando con SAIME:', error);
    return false;
  }
}

/**
 * Consulta directa al SAIME (simulada - en producción usar API oficial)
 */
async function consultarSAIME(cedula: string): Promise<ResultadoSAIME> {
  try {
    // NOTA: Esta es una implementación simulada
    // En producción se debe usar la API oficial del SAIME
    
    if (!process.env.SAIME_API_URL || !process.env.SAIME_API_KEY) {
      // Simulación para desarrollo/testing
      return simularConsultaSAIME(cedula);
    }
    
    // Implementación real (comentada para referencia)
    /*
    const response = await axios.post(process.env.SAIME_API_URL, {
      cedula: cedula,
      tipo_consulta: 'basica'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.SAIME_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    if (response.data.codigo === '200') {
      return {
        valido: true,
        nombre: response.data.nombres,
        apellido: response.data.apellidos,
        fechaNacimiento: response.data.fecha_nacimiento,
        estadoCivil: response.data.estado_civil,
        nacionalidad: response.data.nacionalidad
      };
    }
    
    return {
      valido: false,
      mensaje: response.data.mensaje,
      codigoError: response.data.codigo
    };
    */
    
    // Por ahora usar simulación
    return simularConsultaSAIME(cedula);
    
  } catch (error) {
    console.error('Error consultando SAIME:', error);
    return {
      valido: false,
      mensaje: 'Error de conexión con SAIME',
      codigoError: 'CONN_ERROR'
    };
  }
}

/**
 * Simula una consulta al SAIME para desarrollo/testing
 */
function simularConsultaSAIME(cedula: string): ResultadoSAIME {
  // Lista de cédulas válidas para testing
  const cedulasValidas = new Map([
    ['12345678', { nombre: 'JUAN CARLOS', apellido: 'RODRIGUEZ GONZALEZ', fechaNacimiento: '15/03/1985' }],
    ['87654321', { nombre: 'MARIA ELENA', apellido: 'MARTINEZ LOPEZ', fechaNacimiento: '22/07/1990' }],
    ['11223344', { nombre: 'PEDRO JOSE', apellido: 'FERNANDEZ RUIZ', fechaNacimiento: '10/12/1982' }],
    ['55667788', { nombre: 'ANA LUCIA', apellido: 'TORRES SILVA', fechaNacimiento: '05/09/1988' }]
  ]);
  
  const datos = cedulasValidas.get(cedula);
  
  if (datos) {
    return {
      valido: true,
      nombre: datos.nombre,
      apellido: datos.apellido,
      fechaNacimiento: datos.fechaNacimiento,
      estadoCivil: 'SOLTERO(A)',
      nacionalidad: 'VENEZOLANA'
    };
  }
  
  // Simular diferentes tipos de errores basados en la cédula
  if (cedula.endsWith('00')) {
    return {
      valido: false,
      mensaje: 'Cédula cancelada',
      codigoError: 'CEDULA_CANCELADA'
    };
  }
  
  if (cedula.length < 7) {
    return {
      valido: false,
      mensaje: 'Cédula inválida',
      codigoError: 'CEDULA_INVALIDA'
    };
  }
  
  return {
    valido: false,
    mensaje: 'Cédula no encontrada en el sistema',
    codigoError: 'CEDULA_NO_ENCONTRADA'
  };
}

/**
 * Limpia y formatea una cédula
 */
function limpiarCedula(cedula: string): string {
  return cedula.replace(/[^0-9]/g, '');
}

/**
 * Valida el formato de una cédula venezolana
 */
function validarFormatoCedula(cedula: string): boolean {
  // Cédulas venezolanas: 7-9 dígitos
  return /^\d{7,9}$/.test(cedula);
}

/**
 * Compara nombres eliminando diferencias menores
 */
function compararNombres(nombre1: string, nombre2: string): boolean {
  const normalizar = (str: string) => str
    .toUpperCase()
    .replace(/[ÁÀÄÂ]/g, 'A')
    .replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U')
    .replace(/Ñ/g, 'N')
    .replace(/[^A-Z\s]/g, '')
    .trim();
  
  const n1 = normalizar(nombre1);
  const n2 = normalizar(nombre2);
  
  // Verificar coincidencia exacta
  if (n1 === n2) return true;
  
  // Verificar si uno contiene al otro (nombres compuestos)
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  // Verificar palabras individuales
  const palabras1 = n1.split(/\s+/).filter(p => p.length > 2);
  const palabras2 = n2.split(/\s+/).filter(p => p.length > 2);
  
  // Al menos 70% de las palabras deben coincidir
  let coincidencias = 0;
  const totalPalabras = Math.max(palabras1.length, palabras2.length);
  
  for (const palabra1 of palabras1) {
    if (palabras2.some(palabra2 => 
      palabra1 === palabra2 || 
      calcularSimilitudLevenshtein(palabra1, palabra2) > 0.8
    )) {
      coincidencias++;
    }
  }
  
  return (coincidencias / totalPalabras) >= 0.7;
}

/**
 * Calcula similitud usando distancia de Levenshtein
 */
function calcularSimilitudLevenshtein(str1: string, str2: string): number {
  const matriz: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matriz[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matriz[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matriz[i][j] = matriz[i - 1][j - 1];
      } else {
        matriz[i][j] = Math.min(
          matriz[i - 1][j - 1] + 1,
          matriz[i][j - 1] + 1,
          matriz[i - 1][j] + 1
        );
      }
    }
  }
  
  const distancia = matriz[str2.length][str1.length];
  const longitudMaxima = Math.max(str1.length, str2.length);
  
  return 1 - (distancia / longitudMaxima);
}

/**
 * Obtiene información adicional de una cédula (si está disponible)
 */
export async function obtenerInformacionAdicionalSAIME(cedula: string): Promise<{
  lugarNacimiento?: string;
  centroVotacion?: string;
  estadoCivil?: string;
  profesion?: string;
} | null> {
  try {
    const cedulaLimpia = limpiarCedula(cedula);
    
    if (!validarFormatoCedula(cedulaLimpia)) {
      return null;
    }
    
    // En una implementación real, esto haría una consulta extendida al SAIME
    // Por ahora retornamos datos simulados para testing
    
    const hash = crypto.createHash('md5').update(cedulaLimpia).digest('hex');
    const ultimo = parseInt(hash.slice(-1), 16);
    
    const lugares = ['MARACAIBO', 'CARACAS', 'VALENCIA', 'BARQUISIMETO', 'MERIDA'];
    const estados = ['SOLTERO(A)', 'CASADO(A)', 'DIVORCIADO(A)', 'VIUDO(A)'];
    
    return {
      lugarNacimiento: lugares[ultimo % lugares.length],
      estadoCivil: estados[ultimo % estados.length],
      centroVotacion: `CENTRO ${(ultimo % 50) + 1}`,
      profesion: 'NO ESPECIFICADA'
    };
    
  } catch (error) {
    console.error('Error obteniendo información adicional SAIME:', error);
    return null;
  }
}

/**
 * Verifica el estado de conexión con SAIME
 */
export async function verificarConexionSAIME(): Promise<{
  disponible: boolean;
  tiempoRespuesta?: number;
  mensaje?: string;
}> {
  try {
    const inicio = Date.now();
    
    // En producción, hacer ping al servicio SAIME
    // Por ahora simular verificación
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const tiempoRespuesta = Date.now() - inicio;
    
    return {
      disponible: true,
      tiempoRespuesta,
      mensaje: 'Servicio SAIME disponible'
    };
    
  } catch (error) {
    return {
      disponible: false,
      mensaje: 'Servicio SAIME no disponible'
    };
  }
}

/**
 * Genera un hash para auditoría de consultas SAIME
 */
export function generarHashAuditoria(cedula: string, timestamp: number): string {
  const data = `${cedula}-${timestamp}-${process.env.SAIME_AUDIT_SALT || 'default-salt'}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}