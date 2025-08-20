import { asignarCodigo, validarFormatoCodigo, obtenerEstadisticasCodigos, codigoExiste } from '../backend/utils/asignarCodigo';

describe('Asignación de Códigos Únicos', () => {
  
  describe('asignarCodigo', () => {
    test('debe generar c0001 para primer conductor', async () => {
      const codigo = await asignarCodigo('conductor', []);
      expect(codigo).toBe('c0001');
    });

    test('debe generar p0001 para primer cliente', async () => {
      const codigo = await asignarCodigo('cliente', []);
      expect(codigo).toBe('p0001');
    });

    test('debe encontrar el siguiente código disponible', async () => {
      const existentes = ['c0001', 'c0002', 'c0004'];
      const codigo = await asignarCodigo('conductor', existentes);
      expect(codigo).toBe('c0003'); // Encuentra el hueco
    });

    test('debe continuar secuencia cuando no hay huecos', async () => {
      const existentes = ['c0001', 'c0002', 'c0003'];
      const codigo = await asignarCodigo('conductor', existentes);
      expect(codigo).toBe('c0004');
    });

    test('debe manejar códigos de diferentes tipos independientemente', async () => {
      const existentes = ['c0001', 'p0001', 'c0002', 'p0002'];
      const codigoConductor = await asignarCodigo('conductor', existentes);
      const codigoCliente = await asignarCodigo('cliente', existentes);
      
      expect(codigoConductor).toBe('c0003');
      expect(codigoCliente).toBe('p0003');
    });
  });

  describe('validarFormatoCodigo', () => {
    test('debe validar códigos de conductor correctos', () => {
      expect(validarFormatoCodigo('c0001', 'conductor')).toBe(true);
      expect(validarFormatoCodigo('c9999', 'conductor')).toBe(true);
    });

    test('debe validar códigos de cliente correctos', () => {
      expect(validarFormatoCodigo('p0001', 'cliente')).toBe(true);
      expect(validarFormatoCodigo('p9999', 'cliente')).toBe(true);
    });

    test('debe rechazar formatos incorrectos', () => {
      expect(validarFormatoCodigo('x0001', 'conductor')).toBe(false);
      expect(validarFormatoCodigo('c001', 'conductor')).toBe(false);
      expect(validarFormatoCodigo('c00001', 'conductor')).toBe(false);
      expect(validarFormatoCodigo('C0001', 'conductor')).toBe(false);
      expect(validarFormatoCodigo('p0001', 'conductor')).toBe(false);
      expect(validarFormatoCodigo('c0001', 'cliente')).toBe(false);
    });
  });

  describe('codigoExiste', () => {
    test('debe detectar códigos existentes', () => {
      const existentes = ['c0001', 'c0002', 'p0001'];
      expect(codigoExiste('c0001', existentes)).toBe(true);
      expect(codigoExiste('p0001', existentes)).toBe(true);
      expect(codigoExiste('c0003', existentes)).toBe(false);
    });
  });

  describe('obtenerEstadisticasCodigos', () => {
    test('debe calcular estadísticas correctamente', () => {
      const existentes = ['c0001', 'c0002', 'p0001', 'p0002', 'p0003'];
      const stats = obtenerEstadisticasCodigos(existentes);
      
      expect(stats.totalConductores).toBe(2);
      expect(stats.totalClientes).toBe(3);
      expect(stats.ultimoCodigoConductor).toBe('c0002');
      expect(stats.ultimoCodigoCliente).toBe('p0003');
      expect(stats.siguienteCodigoCliente).toBe('p0004');
      expect(stats.siguienteCodigoConductor).toBe('c0003');
    });

    test('debe manejar lista vacía', () => {
      const stats = obtenerEstadisticasCodigos([]);
      
      expect(stats.totalConductores).toBe(0);
      expect(stats.totalClientes).toBe(0);
      expect(stats.ultimoCodigoConductor).toBeUndefined();
      expect(stats.ultimoCodigoCliente).toBeUndefined();
      expect(stats.siguienteCodigoCliente).toBe('p0001');
      expect(stats.siguienteCodigoConductor).toBe('c0001');
    });
  });
});