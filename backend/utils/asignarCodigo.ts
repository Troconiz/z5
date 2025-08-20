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