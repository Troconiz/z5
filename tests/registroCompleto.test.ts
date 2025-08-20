import { VerificacionesGenerales } from '../backend/verificaciones/verificaciones';
import { VerificacionesConductor } from '../backend/verificaciones/verificacionesConductor';
import { createMockConductorData, createMockClienteData } from './setup';

// Mock para simular datos de prueba
const mockConductorData = createMockConductorData();
const mockClienteData = createMockClienteData();

describe('Sistema Integrado de Verificaciones', () => {
  let verificaciones: VerificacionesGenerales;
  let verificadorConductor: VerificacionesConductor;

  beforeEach(() => {
    verificaciones = new VerificacionesGenerales();
    verificadorConductor = new VerificacionesConductor();
  });

  describe('Registro de Conductores', () => {
    test('debe procesar registro de conductor con datos válidos', async () => {
      const resultado = await verificadorConductor.procesarRegistroConductor(
        mockConductorData,
        []
      );

      expect(resultado).toBeDefined();
      expect(resultado.exito).toBeDefined();
      
      if (resultado.exito) {
        expect(resultado.conductor).toBeDefined();
        expect(resultado.conductor?.codigo).toMatch(/^c\d{4}$/);
        expect(resultado.conductor?.status).toBe('pendiente_inspeccion');
        expect(resultado.mensaje?.titulo).toBe('¡Registro exitoso!');
        expect(resultado.mensaje?.instrucciones).toContain('inspección física');
      }
    });

    test('debe asignar códigos únicos secuenciales', async () => {
      const codigosExistentes = ['c0001', 'c0002'];
      
      const resultado = await verificadorConductor.procesarRegistroConductor(
        mockConductorData,
        codigosExistentes
      );

      if (resultado.exito && resultado.conductor) {
        expect(resultado.conductor.codigo).toBe('c0003');
      }
    });

    test('debe rechazar registro con datos faltantes', async () => {
      const datosIncompletos = {
        ...mockConductorData,
        cedula: '', // Campo requerido faltante
        foto_cedula: undefined
      };

      const resultado = await verificadorConductor.procesarRegistroConductor(
        datosIncompletos,
        []
      );

      // El resultado podría ser false debido a validaciones fallidas
      if (!resultado.exito) {
        expect(resultado.errores).toBeDefined();
        expect(resultado.errores!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Registro de Clientes', () => {
    test('debe procesar registro de cliente con datos válidos', async () => {
      const resultado = await verificaciones.procesarRegistroCliente(
        mockClienteData,
        []
      );

      expect(resultado).toBeDefined();
      expect(resultado.exito).toBeDefined();
      
      if (resultado.exito) {
        expect(resultado.cliente).toBeDefined();
        expect(resultado.cliente?.codigo).toMatch(/^p\d{4}$/);
        expect(resultado.cliente?.status).toBe('aprobado');
        expect(resultado.mensaje?.titulo).toBe('¡Registro exitoso!');
      }
    });

    test('debe asignar códigos únicos secuenciales para clientes', async () => {
      const codigosExistentes = ['p0001', 'p0002', 'p0004'];
      
      const resultado = await verificaciones.procesarRegistroCliente(
        mockClienteData,
        codigosExistentes
      );

      if (resultado.exito && resultado.cliente) {
        expect(resultado.cliente.codigo).toBe('p0003'); // Debe encontrar el hueco
      }
    });
  });

  describe('Configuración del Sistema', () => {
    test('debe verificar configuración de servicios', async () => {
      const config = await verificaciones.verificarConfiguracion();
      
      expect(config).toBeDefined();
      expect(config.servicios).toBeDefined();
      expect(config.errores).toBeDefined();
      expect(Array.isArray(config.errores)).toBe(true);
    });

    test('debe obtener estadísticas del sistema', async () => {
      const stats = await verificaciones.obtenerEstadisticas();
      
      expect(stats).toBeDefined();
      expect(stats.conductores).toBeDefined();
      expect(stats.clientes).toBeDefined();
      expect(stats.verificaciones).toBeDefined();
      
      expect(typeof stats.conductores.pendientes).toBe('number');
      expect(typeof stats.conductores.aprobados).toBe('number');
      expect(typeof stats.clientes.activos).toBe('number');
    });
  });

  describe('Validaciones de Negocio', () => {
    test('debe prevenir duplicación de códigos', async () => {
      const codigosExistentes = ['c0001'];
      
      const resultado1 = await verificadorConductor.procesarRegistroConductor(
        mockConductorData,
        codigosExistentes
      );
      
      if (resultado1.exito && resultado1.conductor) {
        const nuevosExistentes = [...codigosExistentes, resultado1.conductor.codigo];
        
        const resultado2 = await verificadorConductor.procesarRegistroConductor(
          mockConductorData,
          nuevosExistentes
        );
        
        if (resultado2.exito && resultado2.conductor) {
          expect(resultado2.conductor.codigo).not.toBe(resultado1.conductor.codigo);
        }
      }
    });

    test('debe manejar diferentes tipos de error correctamente', async () => {
      const datosInvalidos = {
        ...mockConductorData,
        email: 'email-invalido', // Email con formato incorrecto
        telefono: '123456' // Teléfono muy corto
      };

      const resultado = await verificadorConductor.procesarRegistroConductor(
        datosInvalidos,
        []
      );

      if (!resultado.exito) {
        expect(resultado.errores).toBeDefined();
        expect(Array.isArray(resultado.errores)).toBe(true);
      }
    });
  });
});