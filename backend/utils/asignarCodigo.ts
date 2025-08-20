// Asigna el código secuencial tipo p0001, c0001
export async function asignarCodigo(tipo: 'cliente' | 'conductor', existentes: string[]): Promise<string> {
  const prefix = tipo === 'cliente' ? 'p' : 'c';
  let i = 1;
  while (existentes.includes(`${prefix}${i.toString().padStart(4, '0')}`)) {
    i++;
  }
  return `${prefix}${i.toString().padStart(4, '0')}`;
}