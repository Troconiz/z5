
// Asigna códigos según los nuevos requisitos:
// - Clientes: p0001, p0002, ...
// - Conductores: c110, c111, ...
export async function asignarCodigo(tipo: 'cliente' | 'conductor', existentes: string[]): Promise<string> {
  if (tipo === 'cliente') {
    // Clientes empiezan desde p0001
    let i = 1;
    while (existentes.includes(`p${i.toString().padStart(4, '0')}`)) {
      i++;
    }
    return `p${i.toString().padStart(4, '0')}`;
  } else {
    // Conductores empiezan desde c110
    let i = 110;
    while (existentes.includes(`c${i}`)) {
      i++;
    }
    return `c${i}`;
  }
}

// Asigna código de cliente específico si está disponible (para migración desde sistema antiguo)
export async function asignarCodigoClienteEspecifico(codigoDeseado: string, existentes: string[]): Promise<{ codigo: string; esCodigoDeseado: boolean }> {
  // Validar formato del código deseado (debe ser p + número)
  const formatoValido = /^p\d+$/.test(codigoDeseado);
  
  if (formatoValido && !existentes.includes(codigoDeseado)) {
    return { codigo: codigoDeseado, esCodigoDeseado: true };
  }
  
  // Si no está disponible o no es válido, asignar el siguiente disponible
  const codigoAlternativo = await asignarCodigo('cliente', existentes);
  return { codigo: codigoAlternativo, esCodigoDeseado: false };
}

// Libera código de conductor y asigna código de cliente (para conductores rechazados)
export async function migrarConductorRechazadoACliente(codigoConductor: string, existentesClientes: string[]): Promise<string> {
  // Liberar el código del conductor (se manejará en la lógica de base de datos)
  // Asignar el siguiente código de cliente disponible
  return await asignarCodigo('cliente', existentesClientes);
// Asigna el código secuencial tipo p0001, c0001 con validación robusta
export async function asignarCodigo(tipo: 'cliente' | 'conductor', existentes: string[]): Promise<string> {
  const prefix = tipo === 'cliente' ? 'p' : 'c';
  
  // Filtrar solo códigos con el prefijo correcto
  const codigosDelTipo = existentes.filter(codigo => codigo.startsWith(prefix));
  
  // Extraer números y encontrar el siguiente disponible
  const numeros = codigosDelTipo
    .map(codigo => {
      const match = codigo.match(/^[pc](\d{4})$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(num => num > 0)
    .sort((a, b) => a - b);

  let siguienteNumero = 1;
  
  // Encontrar el primer hueco en la secuencia o el siguiente número
  for (const numero of numeros) {
    if (numero === siguienteNumero) {
      siguienteNumero++;
    } else if (numero > siguienteNumero) {
      break;
    }
  }
  
  return `${prefix}${siguienteNumero.toString().padStart(4, '0')}`;
}

/**
 * Verifica si un código ya existe en la lista
 */
export function codigoExiste(codigo: string, existentes: string[]): boolean {
  return existentes.includes(codigo);
}

/**
 * Valida el formato de un código
 */
export function validarFormatoCodigo(codigo: string, tipo: 'cliente' | 'conductor'): boolean {
  const prefix = tipo === 'cliente' ? 'p' : 'c';
  const regex = new RegExp(`^${prefix}\\d{4}$`);
  return regex.test(codigo);
}

/**
 * Reserva un código específico (útil para casos especiales)
 */
export function reservarCodigo(codigo: string, tipo: 'cliente' | 'conductor', existentes: string[]): {
  valido: boolean;
  codigo?: string;
  error?: string;
} {
  if (!validarFormatoCodigo(codigo, tipo)) {
    return {
      valido: false,
      error: `Formato de código inválido. Debe ser ${tipo === 'cliente' ? 'p' : 'c'}XXXX`
    };
  }
  
  if (codigoExiste(codigo, existentes)) {
    return {
      valido: false,
      error: 'El código ya existe'
    };
  }
  
  return {
    valido: true,
    codigo
  };
}

/**
 * Obtiene estadísticas de códigos asignados
 */
export function obtenerEstadisticasCodigos(existentes: string[]): {
  totalClientes: number;
  totalConductores: number;
  ultimoCodigoCliente?: string;
  ultimoCodigoConductor?: string;
  siguienteCodigoCliente: string;
  siguienteCodigoConductor: string;
} {
  const clientes = existentes.filter(codigo => codigo.startsWith('p'));
  const conductores = existentes.filter(codigo => codigo.startsWith('c'));
  
  const ultimoCliente = clientes.sort().pop();
  const ultimoConductor = conductores.sort().pop();
  
  return {
    totalClientes: clientes.length,
    totalConductores: conductores.length,
    ultimoCodigoCliente: ultimoCliente,
    ultimoCodigoConductor: ultimoConductor,
    siguienteCodigoCliente: `p${(clientes.length + 1).toString().padStart(4, '0')}`,
    siguienteCodigoConductor: `c${(conductores.length + 1).toString().padStart(4, '0')}`
  };
}