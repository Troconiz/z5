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
}