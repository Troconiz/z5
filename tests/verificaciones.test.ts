import { validarTelefonoVenezolano } from '../backend/verificaciones/servicios/otp';
import { validarFormatoEmail } from '../backend/verificaciones/servicios/email';

describe('Servicios de Verificación', () => {
  
  describe('Validación de Teléfonos Venezolanos', () => {
    test('debe validar formatos correctos de teléfonos móviles', () => {
      // Formatos válidos
      expect(validarTelefonoVenezolano('04241234567')).toBe(true);
      expect(validarTelefonoVenezolano('04121234567')).toBe(true);
      expect(validarTelefonoVenezolano('04161234567')).toBe(true);
      expect(validarTelefonoVenezolano('04261234567')).toBe(true);
      
      // Con código de país
      expect(validarTelefonoVenezolano('+584241234567')).toBe(true);
      expect(validarTelefonoVenezolano('584241234567')).toBe(true);
      
      // Sin cero inicial
      expect(validarTelefonoVenezolano('4241234567')).toBe(true);
    });

    test('debe rechazar formatos incorrectos', () => {
      // Teléfonos fijos (no móviles)
      expect(validarTelefonoVenezolano('02611234567')).toBe(false);
      expect(validarTelefonoVenezolano('02121234567')).toBe(false);
      
      // Muy cortos o largos
      expect(validarTelefonoVenezolano('1234567')).toBe(false);
      expect(validarTelefonoVenezolano('042412345678')).toBe(false);
      
      // No comienzan con 4 (móviles)
      expect(validarTelefonoVenezolano('05241234567')).toBe(false);
      expect(validarTelefonoVenezolano('03241234567')).toBe(false);
      
      // Caracteres inválidos
      expect(validarTelefonoVenezolano('0424abc4567')).toBe(false);
      expect(validarTelefonoVenezolano('0424-123-4567')).toBe(false);
    });
  });

  describe('Validación de Emails', () => {
    test('debe validar formatos correctos de email', () => {
      expect(validarFormatoEmail('test@example.com')).toBe(true);
      expect(validarFormatoEmail('user.name@domain.co.uk')).toBe(true);
      expect(validarFormatoEmail('user+tag@example.org')).toBe(true);
      expect(validarFormatoEmail('firstname.lastname@company.com.ve')).toBe(true);
      expect(validarFormatoEmail('user123@test-domain.com')).toBe(true);
    });

    test('debe rechazar formatos incorrectos de email', () => {
      expect(validarFormatoEmail('invalid-email')).toBe(false);
      expect(validarFormatoEmail('test@')).toBe(false);
      expect(validarFormatoEmail('@example.com')).toBe(false);
      expect(validarFormatoEmail('test..test@example.com')).toBe(false);
      expect(validarFormatoEmail('test@.com')).toBe(false);
      expect(validarFormatoEmail('test@example')).toBe(false);
      expect(validarFormatoEmail('')).toBe(false);
      expect(validarFormatoEmail('test@example.')).toBe(false);
    });
  });
});